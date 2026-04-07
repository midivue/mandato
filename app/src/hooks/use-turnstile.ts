import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: TurnstileParams,
      ) => string
      execute: (widgetId: string, options?: { action?: string }) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileParams {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  appearance?: 'always' | 'execute' | 'interaction-only'
  execution?: 'render' | 'execute'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  action?: string
}

const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY as string | undefined

const TOKEN_TIMEOUT_MS = 60_000

// Pending state supports multiple concurrent callers: each getToken() call
// that arrives while a challenge is already running just adds its resolver
// to the array instead of calling execute() again.
type Pending = {
  resolvers: Array<(t: string) => void>
  timeoutId: ReturnType<typeof setTimeout>
}

/**
 * Wraps Cloudflare Turnstile explicit rendering.
 *
 * Usage:
 *   const { containerRef, getToken, reset } = useTurnstile()
 *   // Render <div ref={containerRef} /> somewhere in your JSX.
 *   // Call getToken() before a sensitive action to obtain a fresh token.
 *   // Multiple concurrent getToken() calls are safe — they share one
 *   // execute() invocation and all resolve together when the challenge
 *   // completes (or all fail-open together on timeout/error).
 *
 * Uses a callback ref (not useRef + useEffect) so the widget is rendered
 * the moment the container div appears in the DOM — even when it is
 * conditionally mounted inside a Modal that returns null when closed.
 */
export function useTurnstile() {
  const { i18n } = useTranslation()
  const widgetIdRef = useRef<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const pendingRef = useRef<Pending | null>(null)

  function resolvePending(t: string) {
    if (!pendingRef.current) return
    clearTimeout(pendingRef.current.timeoutId)
    pendingRef.current.resolvers.forEach((r) => r(t))
    pendingRef.current = null
  }

  const resolveToken = useCallback((t: string) => {
    setToken(t)
    resolvePending(t)
  }, [])

  // Callback ref: called with the node when the container mounts/unmounts.
  // Fires correctly even when the container is inside a Modal that returns
  // null while closed, unlike useRef + useEffect([]).
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        return
      }

      if (!SITEKEY || widgetIdRef.current !== null) return

      let attempts = 0
      const maxAttempts = 20

      function tryRender() {
        if (!node || widgetIdRef.current !== null) return

        if (window.turnstile) {
          widgetIdRef.current = window.turnstile.render(node, {
            sitekey: SITEKEY!,
            theme: 'auto',
            language: i18n.language.startsWith('hu') ? 'hu' : 'en',
            appearance: 'interaction-only',
            execution: 'execute',
            callback: (t: string) => {
              resolveToken(t)
            },
            'expired-callback': () => {
              setToken(null)
            },
            'error-callback': () => {
              setToken(null)
            },
          })
          // If getToken() was called before the widget finished rendering,
          // execute now that we have a widget ID.
          if (pendingRef.current && pendingRef.current.resolvers.length > 0 && widgetIdRef.current) {
            window.turnstile.execute(widgetIdRef.current)
          }
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(tryRender, 200)
        } else {
          resolvePending('')
        }
      }

      tryRender()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally omit i18n.language and resolveToken — widget renders once on mount
  )

  const getToken = useCallback((): Promise<string> => {
    if (!SITEKEY) return Promise.resolve('')
    if (token) return Promise.resolve(token)

    return new Promise<string>((resolve) => {
      if (pendingRef.current) {
        // A challenge is already in flight — piggyback on it instead of
        // calling execute() again (which would throw "already executing").
        pendingRef.current.resolvers.push(resolve)
        return
      }

      const timeoutId = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current.resolvers.forEach((r) => r(''))
          pendingRef.current = null
        }
      }, TOKEN_TIMEOUT_MS)

      pendingRef.current = { resolvers: [resolve], timeoutId }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.execute(widgetIdRef.current)
      }
      // If widget isn't ready yet, execute() will be called in tryRender()
      // once the widget ID is assigned.
    })
  }, [token])

  const reset = useCallback(() => {
    setToken(null)
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [])

  return { containerRef, getToken, reset, isEnabled: !!SITEKEY }
}
