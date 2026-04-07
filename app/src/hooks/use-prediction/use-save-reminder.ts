import { useEffect, useState } from 'react'

export function useSaveReminder(isDirty: boolean, lastEditAt: Date | null) {
  const [showSaveReminder, setShowSaveReminder] = useState(false)

  useEffect(() => {
    if (!isDirty || !lastEditAt) return
    const timer = setTimeout(() => setShowSaveReminder(true), 5 * 60 * 1000)
    return () => {
      clearTimeout(timer)
      setShowSaveReminder(false)
    }
  }, [isDirty, lastEditAt])

  return {
    showSaveReminder: showSaveReminder && isDirty && lastEditAt !== null,
    setShowSaveReminder,
  }
}
