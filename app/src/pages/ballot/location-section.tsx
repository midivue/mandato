import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { COUNTRIES } from '@/data/countries'
import { SETTLEMENTS } from '@/data/settlements'
import type { VotingDraft } from '@/hooks/use-prediction'
import { strip } from './ballot-utils'

type LocationSectionProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
}

export function LocationSection({ draft, canEdit, updateDraft }: LocationSectionProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isHu = i18n.language === 'hu'

  const settlementResults = useMemo(() => {
    if (query.length < 2) return []
    const q = strip(query.toLowerCase())
    return SETTLEMENTS.filter(
      (s) => strip(s.name.toLowerCase()).includes(q) || s.zip.startsWith(query),
    ).slice(0, 8)
  }, [query])

  const countryResults = useMemo(() => {
    if (query.length < 2) return []
    const q = strip(query.toLowerCase())
    return COUNTRIES.filter(
      (c) =>
        strip(c.nameEn.toLowerCase()).includes(q) ||
        strip(c.nameHu.toLowerCase()).includes(q) ||
        c.code.toLowerCase() === query.toLowerCase() ||
        c.aliases?.some((a) => strip(a.toLowerCase()).includes(q)),
    ).slice(0, 8)
  }, [query])

  function selectSettlement(name: string, zip: string) {
    updateDraft((prev) => ({ ...prev, locationSettlement: name, locationZip: zip }))
    setQuery('')
    setOpen(false)
  }

  function selectCountry(code: string) {
    const country = COUNTRIES.find((c) => c.code === code)
    if (!country) return
    const name = isHu ? country.nameHu : country.nameEn
    updateDraft((prev) => ({ ...prev, locationSettlement: name, locationZip: code }))
    setQuery('')
    setOpen(false)
  }

  function clearSettlement() {
    updateDraft((prev) => ({ ...prev, locationSettlement: null, locationZip: null }))
    setQuery('')
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900">{t('flow.locationTitle')}</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600"><T i18nKey="flow.locationDescription" /></p>

      <div className="mt-4 flex flex-1 flex-col space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={draft.locationCountry === 'hu' ? 'default' : 'outline'}
            disabled={!canEdit}
            onClick={() => {
              setQuery('')
              updateDraft((prev) => ({ ...prev, locationCountry: 'hu' as const }))
            }}
          >
            {t('flow.locationCountryHu')}
          </Button>
          <Button
            variant={draft.locationCountry === 'abroad' ? 'default' : 'outline'}
            disabled={!canEdit}
            onClick={() => {
              setQuery('')
              updateDraft((prev) => ({
                ...prev,
                locationCountry: 'abroad' as const,
                locationSettlement: null,
                locationZip: null,
              }))
            }}
          >
            {t('flow.locationCountryAbroad')}
          </Button>
        </div>

        {draft.locationCountry === 'hu' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              {t('flow.locationSettlement')}
            </label>
            {draft.locationSettlement ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900">
                  {draft.locationSettlement}
                  <span className="text-xs text-zinc-400">({draft.locationZip})</span>
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={clearSettlement}
                    className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div ref={containerRef} className="relative mt-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  disabled={!canEdit}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  placeholder={t('flow.locationSettlementPlaceholder')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
                {open && query.length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                    {settlementResults.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-400">{t('flow.locationNoResults')}</p>
                    ) : (
                      settlementResults.map((s) => (
                        <button
                          key={`${s.zip}-${s.name}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSettlement(s.name, s.zip)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
                        >
                          <span className="font-medium text-zinc-900">{s.name}</span>
                          <span className="text-xs tabular-nums text-zinc-400">{s.zip}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {draft.locationCountry === 'abroad' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700">
              {t('flow.locationCountrySelect')}
            </label>
            {draft.locationSettlement ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900">
                  {draft.locationSettlement}
                  <span className="text-xs text-zinc-400">({draft.locationZip})</span>
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={clearSettlement}
                    className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div ref={containerRef} className="relative mt-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  disabled={!canEdit}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  placeholder={t('flow.locationCountryPlaceholder')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
                {open && query.length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                    {countryResults.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-400">{t('flow.locationNoResults')}</p>
                    ) : (
                      countryResults.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCountry(c.code)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
                        >
                          <span className="font-medium text-zinc-900">{isHu ? c.nameHu : c.nameEn}</span>
                          <span className="text-xs tabular-nums text-zinc-400">{c.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.locationPublic}
            disabled={!canEdit}
            onChange={(e) =>
              updateDraft((prev) => ({ ...prev, locationPublic: e.target.checked }))
            }
            className="size-3.5 rounded border-zinc-300 accent-zinc-900"
          />
          <span className="text-xs text-zinc-600">{t(draft.locationCountry === 'abroad' ? 'flow.locationPublicLabelAbroad' : 'flow.locationPublicLabel')}</span>
        </label>

        <div className="mt-4">
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-zinc-400">
            <ShieldCheck className="mt-px size-3 shrink-0" aria-hidden />
            {t('flow.locationPrivacyNote')}
          </p>
        </div>
      </div>
    </div>
  )
}
