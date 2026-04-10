import { useState } from 'react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { CUTOFF_AT } from '@mandatoto/shared/types'
import { storage } from '@/lib/storage'

const BANNER_ID = 'telex-tip-v1'
const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

function navigateToTelex(e: React.MouseEvent) {
  e.preventDefault()
  window.location.hash = 'jatek'
  // Give the router one tick to mount the ballot page before scrolling
  setTimeout(() => {
    document.getElementById('telex-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 80)
}

export function AnnouncementBanner() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(
    () => storage.getDismissedBanners().includes(BANNER_ID) || Date.now() >= CUTOFF_MS,
  )

  if (dismissed) return null

  function handleDismiss() {
    storage.addDismissedBanner(BANNER_ID)
    setDismissed(true)
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8">
      <div className="flex items-center gap-2 rounded-b-xl border-x border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        {/* On mobile the whole strip (minus X) is tappable */}
        <a href="#jatek" onClick={navigateToTelex} className="flex min-w-0 flex-1 items-center gap-2 sm:contents">
          <Sparkles className="size-4 shrink-0 text-amber-500" aria-hidden />
          <p className="min-w-0 flex-1 text-xs leading-snug sm:text-sm">
            {t('banner.text')}
          </p>
        </a>

        <a
          href="#jatek"
          onClick={navigateToTelex}
          className="hidden shrink-0 items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 sm:inline-flex"
        >
          {t('banner.cta')}
          <ArrowRight className="size-3" aria-hidden />
        </a>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded p-0.5 text-amber-600 transition hover:text-amber-900"
          aria-label={t('banner.dismiss')}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
