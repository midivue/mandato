import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ExternalLink, Link2, X } from 'lucide-react'
import type { VotingDraft } from '@/hooks/use-prediction'

const TELEX_BASE = 'https://telex.hu/melleklet/valasztas-2026/tippjatek/'
// Full-string test (with anchors) — used to validate a bare UUID input
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Substring search (no anchors) — used to find a UUID anywhere inside a URL path
const UUID_IN_PATH = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function extractTelexId(input: string): string | null {
  const trimmed = input.trim()
  if (UUID_RE.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'telex.hu' && url.pathname.includes('/tippjatek/')) {
      // UUID_IN_PATH has no anchors so it finds the UUID anywhere in the path,
      // handling both the normal form (.../tippjatek/<uuid>) and the Telex
      // copy-link bug (.../tippjatek//<uuid>)
      const match = url.pathname.match(UUID_IN_PATH)
      if (match) return match[0]
    }
  } catch {
    // not a valid URL — fall through
  }
  return null
}

type TelexMandateSectionProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
}

export function TelexMandateSection({ draft, canEdit, updateDraft }: TelexMandateSectionProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(
    draft.telexTipId ? `${TELEX_BASE}${draft.telexTipId}` : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleInput(value: string) {
    setInputValue(value)
    setError(null)
    setSaved(false)

    if (value.trim() === '') {
      updateDraft((prev) => ({ ...prev, telexTipId: null }))
      return
    }

    const id = extractTelexId(value)
    if (id) {
      updateDraft((prev) => ({ ...prev, telexTipId: id }))
      setSaved(true)
    } else {
      updateDraft((prev) => ({ ...prev, telexTipId: null }))
    }
  }

  function handleBlur() {
    if (inputValue.trim() !== '' && !extractTelexId(inputValue)) {
      setError(t('telex.invalidUrl'))
    }
  }

  function handleClear() {
    setInputValue('')
    setError(null)
    setSaved(false)
    updateDraft((prev) => ({ ...prev, telexTipId: null }))
  }

  return (
    <div id="telex-section" className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex items-center gap-2">
            <Link2 className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
            <p className="text-xs font-semibold text-zinc-900">{t('telex.title')}</p>
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{t('telex.description')}</p>
        </div>
        <a
          href={TELEX_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <ExternalLink className="size-3" aria-hidden />
          {t('telex.openTelex')}
        </a>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          {t('telex.inputLabel')}
        </label>
        <div className="relative flex items-center">
          <input
            type="url"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            onBlur={handleBlur}
            disabled={!canEdit}
            placeholder={t('telex.inputPlaceholder')}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2 pr-16 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition',
              'focus:ring-2 focus:ring-zinc-200',
              error
                ? 'border-red-300 focus:ring-red-100'
                : saved
                  ? 'border-emerald-300 focus:ring-emerald-100'
                  : 'border-zinc-200',
              !canEdit ? 'cursor-not-allowed opacity-60' : '',
            ].join(' ')}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {saved && !error && (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Check className="size-2.5" aria-hidden />
                {t('telex.saved')}
              </span>
            )}
            {inputValue && canEdit && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-0.5 text-zinc-400 transition hover:text-zinc-600"
                aria-label={t('telex.clear')}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-[10px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
