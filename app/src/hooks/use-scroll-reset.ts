import { useLayoutEffect } from 'react'

/**
 * Scrolls to the top of the page whenever `page` changes.
 * Hash-only navigations do not trigger a browser scroll reset by themselves,
 * so without this a user scrolled deep into the ballot would see the previous
 * page's content still visible (or stale compositor layers) when switching routes.
 */
export function useScrollReset(page: string) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [page])
}
