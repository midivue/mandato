import { useEffect } from 'react'
import { joinGroup } from '@/lib/api-client'
import { storage } from '@/lib/storage'

export function usePendingJoin(token: string | undefined) {
  useEffect(() => {
    if (!token) return
    const pending = storage.getPendingJoin()
    if (!pending) return

    void (async () => {
      try {
        await joinGroup(pending.groupToken, token)
        storage.removePendingJoin()
        const groups = storage.getGroups()
        if (!groups.some((g) => g.groupToken === pending.groupToken)) {
          storage.setGroups([{ groupToken: pending.groupToken, name: pending.groupName }, ...groups])
        }
        window.location.hash = `csoport/${pending.groupToken}`
      } catch { /* silent */ }
    })()
  }, [token])
}
