import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrediction } from '@/hooks/use-prediction'
import { usePendingJoin } from '@/hooks/use-pending-join'
import { useHash } from '@/hooks/use-hash'
import { AppHeader } from '@/app/app-header'
import { AppFooter } from '@/app/app-footer'
import { AppRouter } from '@/app/app-router'
import { ErrorBoundary } from '@/app/error-boundary'

function App() {
  const { i18n } = useTranslation()
  const page = useHash()
  const prediction = usePrediction()

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || 'hu'
    const sync = (lng: string) => { document.documentElement.lang = lng }
    i18n.on('languageChanged', sync)
    return () => { i18n.off('languageChanged', sync) }
  }, [i18n])

  usePendingJoin(prediction.draft?.token)

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(24,24,27,0.09),transparent_34%),radial-gradient(circle_at_92%_-4%,rgba(113,113,122,0.13),transparent_30%)]"
      />
      <AppHeader page={page} />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
        <ErrorBoundary>
          <AppRouter page={page} prediction={prediction} />
        </ErrorBoundary>
      </main>
      <AppFooter />
    </div>
  )
}

export default App
