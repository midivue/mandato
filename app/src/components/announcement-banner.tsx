import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Info, User, X } from 'lucide-react'
import { CUTOFF_AT } from '@mandatoto/shared/types'
import { storage } from '@/lib/storage'

const BANNER_ID = 'election-started-v1'
const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

export function AnnouncementBanner() {
  const { t } = useTranslation()

  const shareToken = storage.getDraft<{ shareToken?: string }>()?.shareToken ?? null

  const [dismissed, setDismissed] = useState(
    () => storage.getDismissedBanners().includes(BANNER_ID) || Date.now() < CUTOFF_MS,
  )

  if (dismissed) return null

  function handleDismiss() {
    storage.addDismissedBanner(BANNER_ID)
    setDismissed(true)
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8">
      <div className="flex items-center gap-2 rounded-b-xl border-x border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        <Info className="size-4 shrink-0 text-amber-500" aria-hidden />
        <p className="min-w-0 flex-1 text-xs leading-snug sm:text-sm">
          {t('banner.text')}
        </p>

        {shareToken && (
          <a
            href={`#tipp/${shareToken}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
          >
            <User className="size-3" aria-hidden />
            {t('banner.cta')}
            <ArrowRight className="size-3" aria-hidden />
          </a>
        )}

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
