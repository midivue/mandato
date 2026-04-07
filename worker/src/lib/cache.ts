type CacheEntry<T> = { data: T; ts: number }
const l1 = new Map<string, CacheEntry<unknown>>()

const MAX_L1_ENTRIES = 500

function l1Set<T>(key: string, data: T) {
  if (l1.size >= MAX_L1_ENTRIES) {
    const oldest = l1.keys().next().value
    if (oldest !== undefined) l1.delete(oldest)
  }
  l1.set(key, { data, ts: Date.now() })
}

/**
 * Two-layer cache: L1 (in-memory per isolate) + L2 (CF Cache API per PoP).
 * Falls through to `compute` on full miss.
 *
 * @param useL2 - Set false for high-cardinality keys (e.g. per-user share tokens)
 *                where CF Cache API pollution outweighs benefit.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>,
  ctx?: ExecutionContext,
  useL2 = true,
): Promise<T> {
  const l1Entry = l1.get(key) as CacheEntry<T> | undefined
  if (l1Entry && Date.now() - l1Entry.ts < ttlMs) return l1Entry.data

  if (useL2) {
    const cacheUrl = new Request(`https://cache.internal/${key}`)
    const l2Response = await caches.default.match(cacheUrl)
    if (l2Response) {
      const data = (await l2Response.json()) as T
      l1Set(key, data)
      return data
    }
  }

  const data = await compute()
  l1Set(key, data)

  if (useL2 && ctx) {
    const ttlSec = Math.ceil(ttlMs / 1000)
    const cacheUrl = new Request(`https://cache.internal/${key}`)
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttlSec}`,
      },
    })
    ctx.waitUntil(caches.default.put(cacheUrl, response))
  }

  return data
}

/**
 * Remove a single key from L1 and (if ctx provided) L2.
 */
export function invalidate(key: string, ctx?: ExecutionContext) {
  l1.delete(key)
  if (ctx) {
    const cacheUrl = new Request(`https://cache.internal/${key}`)
    ctx.waitUntil(caches.default.delete(cacheUrl))
  }
}

/**
 * Remove all L1 keys matching a prefix. L2 cannot be enumerated, so this
 * only clears the in-memory layer — acceptable for L1-only cached endpoints.
 */
export function invalidatePrefix(prefix: string) {
  for (const key of l1.keys()) {
    if (key.startsWith(prefix)) l1.delete(key)
  }
}
