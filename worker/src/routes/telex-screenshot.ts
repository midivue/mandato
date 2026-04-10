import { Hono } from 'hono'
import puppeteer from '@cloudflare/puppeteer'
import type { AppEnv } from '../types.js'

const app = new Hono<AppEnv>()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TELEX_BASE = 'https://telex.hu/melleklet/valasztas-2026/tippjatek/'
const HEMICYCLE_SELECTOR = '.election2026__guessing__container'

const PNG_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
} as const

function r2Key(uuid: string) {
  return `telex-screenshots/${uuid}.png`
}

app.get('/:uuid', async (c) => {
  const uuid = c.req.param('uuid')
  if (!UUID_RE.test(uuid)) return c.json({ error: 'Invalid ID' }, 400)

  const media = c.env.MEDIA

  // Serve from R2 if already cached
  const cached = await media.get(r2Key(uuid))
  if (cached) {
    return new Response(cached.body, { headers: PNG_HEADERS })
  }

  // Need browser rendering to generate the screenshot
  const browser = c.env.BROWSER
  if (!browser) {
    return c.json({ error: 'Browser rendering not available in this environment' }, 503)
  }

  let b: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
  try {
    b = await puppeteer.launch(browser)
    const page = await b.newPage()

    // 2× device pixel ratio for a crisp image
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 })

    // Block ad/campaign/YouTube domains that inject overlays and popups
    await page.setRequestInterception(true)
    page.on('request', (req: { url: () => string; abort: () => void; continue: () => void }) => {
      const url = req.url()
      if (
        url.includes('campaign.telex.hu') ||
        url.includes('youtube.com') ||
        url.includes('doubleclick.net') ||
        url.includes('googletagmanager.com') ||
        url.includes('google-analytics.com') ||
        url.includes('performax.cz') ||
        url.includes('facebook.net')
      ) {
        req.abort()
      } else {
        req.continue()
      }
    })

    await page.goto(`${TELEX_BASE}${uuid}`, { waitUntil: 'networkidle2', timeout: 30_000 })

    // Hide buttons, tooltips, fixed overlays (ÉLŐ live bar, etc.)
    await page.addStyleTag({ content: `
      .election2026__guessing__btn, .election2026__guessing__btns,
      .tooltiptext, [class*="tooltip"],
      .rempNotification, .rempCampaign,
      [class*="notification"], [class*="campaign"],
      [class*="popup"], [class*="live-bar"], [class*="live_bar"],
      [class*="breaking"], #CybotCookiebotDialog, .cc-window,
      iframe, [class*="youtube"] { display: none !important; }
    `})

    // Hide all fixed/sticky elements (e.g. Telex live breaking-news bar)
    await page.evaluate(`(function(){
      Array.from(document.querySelectorAll('*')).forEach(function(el){
        var s = window.getComputedStyle(el);
        if (s.position === 'fixed' || s.position === 'sticky') el.style.display = 'none';
      });
    })()`)

    // Wait until the hemicycle has rendered (seat count text is present)
    await page.waitForFunction(
      `(function(sel){
        var el = document.querySelector(sel);
        return el ? el.textContent.includes('mandátum') : false;
      })(${JSON.stringify(HEMICYCLE_SELECTOR)})`,
      { timeout: 20_000 },
    ).catch(() => { /* fall through and screenshot whatever is there */ })

    const el = await page.$(HEMICYCLE_SELECTOR)
    if (!el) {
      await b.close()
      return c.json({ error: 'Hemicycle element not found' }, 502)
    }

    // Tight clip: find rightmost text node edge (excludes full-width SVG containers)
    const clip = await page.evaluate(
      `(function(sel){
        var container = document.querySelector(sel);
        if (!container) return null;
        var cr = container.getBoundingClientRect();
        var maxRight = cr.left;
        Array.from(container.querySelectorAll('li, span, p, strong, b')).forEach(function(node){
          var s = window.getComputedStyle(node);
          if (s.display === 'none' || s.visibility === 'hidden') return;
          var r = node.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.right > maxRight) maxRight = r.right;
        });
        if (maxRight <= cr.left) maxRight = cr.right;
        return { x: cr.left, y: cr.top, width: Math.min(maxRight - cr.left + 32, cr.width), height: cr.height };
      })(${JSON.stringify(HEMICYCLE_SELECTOR)})`,
    ) as { x: number; y: number; width: number; height: number } | null

    const screenshot = clip
      ? await page.screenshot({ type: 'png', clip })
      : await el.screenshot({ type: 'png' })
    await b.close()
    b = null

    // Store in R2 so future requests skip the puppeteer step
    await media.put(r2Key(uuid), screenshot, {
      httpMetadata: { contentType: 'image/png' },
    })

    return new Response(screenshot, { headers: PNG_HEADERS })
  } catch (err) {
    if (b) await b.close().catch(() => {})
    console.error(JSON.stringify({
      requestId: c.get('requestId'),
      event: 'telex_screenshot_error',
      uuid,
      error: String(err),
    }))
    return c.json({ error: 'Screenshot failed' }, 502)
  }
})

export default app
