import { useSyncExternalStore } from 'react'

function getHash() {
  return window.location.hash.replace(/^#\/?/, '') || 'jatek'
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useHash() {
  return useSyncExternalStore(subscribe, getHash, () => 'jatek')
}
