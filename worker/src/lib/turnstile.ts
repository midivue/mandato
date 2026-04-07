const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verifies a Cloudflare Turnstile token against the Siteverify API.
 *
 * Returns null on success, or an error string to return to the client on failure.
 * When TURNSTILE_SECRET is not configured (local dev), skips verification and returns null.
 * On Siteverify network errors, fails open (returns null) so users aren't blocked if
 * Cloudflare is temporarily unreachable — rate limiting still applies as a fallback.
 */
export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
  remoteip: string,
): Promise<string | null> {
  if (!secret) return null

  if (!token) return 'Human verification token missing'

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip })
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json<{ success: boolean; 'error-codes'?: string[] }>()
    if (!data.success) {
      const codes = data['error-codes']?.join(', ') ?? 'none'
      console.error(`[turnstile] siteverify rejected: error-codes=[${codes}]`)
      return `Human verification failed [${codes}]`
    }
  } catch (err) {
    console.error('[turnstile] siteverify fetch error, failing open:', err)
  }

  return null
}
