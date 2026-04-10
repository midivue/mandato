/**
 * Local test script: takes a screenshot of the Telex hemicycle element
 * and saves it to .telex-screenshots-test/<uuid>.png
 *
 * Usage:  tsx worker/scripts/test-telex-screenshot.ts <uuid>
 *
 * Uses regular puppeteer (not @cloudflare/puppeteer) so it works without
 * wrangler --remote. The actual Worker endpoint uses @cloudflare/puppeteer
 * and stores the result in R2.
 */
import puppeteer from 'puppeteer'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../../.telex-screenshots-test')

const TELEX_BASE = 'https://telex.hu/melleklet/valasztas-2026/tippjatek/'

// The candidate selectors to try in order — we log which one matched
// so we can confirm the right one for the Worker route.
const SELECTORS = [
  '.election2026__guessing__container',
  '.election2026__guessing',
  '[class*="guessing"]',
]

const uuid = process.argv[2]
if (!uuid || !/^[0-9a-f-]{36}$/i.test(uuid)) {
  console.error('Usage: tsx worker/scripts/test-telex-screenshot.ts <uuid>')
  process.exit(1)
}

console.log(`Screenshotting https://telex.hu/melleklet/valasztas-2026/tippjatek/${uuid}`)

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 })

// Block ad/campaign/YouTube domains that inject popups and overlays
await page.setRequestInterception(true)
page.on('request', (req) => {
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

// Give Nuxt time to hydrate and render the client-side hemicycle
await new Promise(r => setTimeout(r, 3000))

// 1. Hide share/action buttons and tooltip spans inside the container
await page.addStyleTag({ content: `
  .election2026__guessing__btn,
  .election2026__guessing__btns,
  .tooltiptext,
  [class*="tooltip"],
  iframe, [class*="youtube"]
  { display: none !important; }
`})

// 2. Find and hide any fixed/sticky elements that overlap the hemicycle area
//    (e.g. the Telex ÉLŐ live bar, cookie banners, etc.)
await page.evaluate(`(function(){
  var fixed = Array.from(document.querySelectorAll('*')).filter(function(el){
    var s = window.getComputedStyle(el);
    return s.position === 'fixed' || s.position === 'sticky';
  });
  fixed.forEach(function(el){ el.style.display = 'none'; });
})()`)

// Wait until at least one candidate selector contains "mandátum"
let matched: string | null = null
try {
  // Pass selectors as JSON so the function body is a plain string (no DOM types in TS)
  await page.waitForFunction(
    `(function(sels){
      for(var i=0;i<sels.length;i++){
        var el=document.querySelector(sels[i]);
        if(el&&el.textContent&&el.textContent.includes('mandátum')) return sels[i];
      }
      return false;
    })(${JSON.stringify(SELECTORS)})`,
    { timeout: 20_000 },
  )
  for (const sel of SELECTORS) {
    const el = await page.$(sel)
    // evaluate also runs in browser context — cast to avoid TS DOM errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = await el?.evaluate(`(function(n){return n.textContent||'';})`  as unknown as (el: any) => string)
    if ((text as string | undefined)?.includes('mandátum')) {
      matched = sel
      break
    }
  }
} catch {
  console.warn('Timed out waiting for mandátum text — screenshotting best candidate anyway')
  matched = SELECTORS[0]
}

if (!matched) {
  // Debug: log all element classes to help find the right selector
  const allClasses = await page.evaluate(`
    Array.from(document.querySelectorAll('[class]'))
      .map(el => el.className)
      .filter(c => c.includes('election') || c.includes('guessing') || c.includes('tipp'))
      .slice(0, 30)
      .join('\\n')
  `) as string
  console.error('No matching element found. Election-related classes on page:\n' + allClasses)
  await browser.close()
  process.exit(1)
}

console.log(`Using selector: ${matched}`)
const el = await page.$(matched)
if (!el) {
  console.error(`Element ${matched} not found in DOM`)
  await browser.close()
  process.exit(1)
}

// Compute a tight clip by finding the rightmost edge of actual content:
// the hemicycle SVG and the legend list items.
const clip = await page.evaluate(`(function(sel){
  var container = document.querySelector(sel);
  if (!container) return null;
  var containerRect = container.getBoundingClientRect();

  // Target only text-bearing content nodes for the right-edge calculation.
  // Exclude svg/canvas — they are full-width even if content only draws on the left.
  var contentSelectors = 'li, span, p, strong, b';
  var maxRight = containerRect.left;
  var nodes = Array.from(container.querySelectorAll(contentSelectors));
  nodes.forEach(function(node){
    var s = window.getComputedStyle(node);
    if (s.display === 'none' || s.visibility === 'hidden') return;
    var r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.right > maxRight) {
      maxRight = r.right;
    }
  });
  if (maxRight <= containerRect.left) maxRight = containerRect.right;

  var padding = 32;
  return {
    x: containerRect.left,
    y: containerRect.top,
    width: Math.min(maxRight - containerRect.left + padding, containerRect.width),
    height: containerRect.height,
  };
})(${JSON.stringify(matched)})`) as { x: number; y: number; width: number; height: number } | null

console.log('Clip region:', clip)

const png = clip
  ? await page.screenshot({ type: 'png', clip })
  : await el.screenshot({ type: 'png' })

await mkdir(OUT_DIR, { recursive: true })
const outPath = resolve(OUT_DIR, `${uuid}.png`)
await writeFile(outPath, png)
console.log(`Saved: ${outPath}`)

await browser.close()
