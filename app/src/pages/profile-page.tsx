import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, MapPin, Trophy, User, Users } from 'lucide-react'
import { useApiQuery } from '@/hooks/use-api-query'
import { getSharedPrediction } from '@/lib/api-client'

import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { RestoreSessionModal } from '@/components/restore-session-modal'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import type { SharedPrediction, PartyId } from '@mandatoto/shared/types'
import { REFERENCE_RESULT, RESULTS_AVAILABLE, TOTAL_ELIGIBLE_VOTERS } from '@mandatoto/shared/types'
import pmXSvg from '@/assets/pm-x.svg'

function pctDisplay(val: number | null): string {
  if (val === null) return '—'
  return `${val}%`
}

function DeltaIndicator({ guess, partyId }: { guess: number | null; partyId: PartyId }) {
  if (!RESULTS_AVAILABLE || guess === null) return null
  const actual = REFERENCE_RESULT.percentages[partyId]
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 1) {
    color = 'text-emerald-600'
  } else if (abs <= 3) {
    color = 'text-blue-600'
  } else if (abs <= 5) {
    color = 'text-orange-500'
  } else {
    color = 'text-red-600'
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(1)}
    </span>
  )
}

function AttendanceDelta({ guess }: { guess: number }) {
  if (!RESULTS_AVAILABLE) return null
  const actual = REFERENCE_RESULT.participationRate
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 1) {
    color = 'text-emerald-600'
  } else if (abs <= 3) {
    color = 'text-blue-600'
  } else if (abs <= 5) {
    color = 'text-orange-500'
  } else {
    color = 'text-red-600'
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(1)}
    </span>
  )
}

function NationalitiesDelta({ guess }: { guess: number }) {
  if (!RESULTS_AVAILABLE) return null
  const actual = REFERENCE_RESULT.pctNationalities
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 0.2) {
    color = 'text-emerald-600'
  } else if (abs <= 0.5) {
    color = 'text-blue-600'
  } else if (abs <= 1) {
    color = 'text-orange-500'
  } else {
    color = 'text-red-600'
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(2)}
    </span>
  )
}

const PCT_KEYS: Record<PartyId, keyof SharedPrediction> = {
  mkkp: 'pctMkkp',
  tisza: 'pctTisza',
  mi_hazank: 'pctMiHazank',
  dk: 'pctDk',
  fidesz_kdnp: 'pctFideszKdnp',
}

type ProfilePageProps = {
  shareToken: string
  restoreSession: (token: string) => Promise<void>
}

export function ProfilePage({ shareToken, restoreSession }: ProfilePageProps) {
  const { t } = useTranslation()
  const { data: prediction, loading, error } = useApiQuery(
    () => getSharedPrediction(shareToken),
    [shareToken],
  )
  const notFound = !loading && (error !== null || prediction === null)
  const [copied, setCopied] = useState(false)
  const [showRestore, setShowRestore] = useState(false)

  function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#tipp/${shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRestore(token: string) {
    await restoreSession(token)
    window.location.hash = 'jatek'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (notFound || !prediction) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-zinc-500">{t('profile.notFound')}</p>
        <a href="#jatek" className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950">
          {t('profile.backToBallot')}
        </a>
      </div>
    )
  }

  return (
    <section aria-label={prediction.displayName}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader icon={<User className="size-5 text-zinc-500" />} title={prediction.displayName}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                prediction.visibility === 'public'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {prediction.visibility === 'public'
                  ? <Eye className="size-3" />
                  : <EyeOff className="size-3" />
                }
                {t(`profile.visibility.${prediction.visibility}`)}
              </span>
              {prediction.score !== null && (
                <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                  {t('profile.score')}: {prediction.score.toFixed(1)}
                </span>
              )}
              {prediction.leaderboardRank != null && (
                <a
                  href="#board"
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <Trophy className="size-3" />
                  {t('leaderboard.profileRank', { rank: prediction.leaderboardRank })}
                </a>
              )}
              {(prediction.locationSettlement || prediction.locationCountry) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                  <MapPin className="size-3" />
                  {prediction.locationSettlement
                    ? `${prediction.locationSettlement} (${prediction.locationZip})`
                    : prediction.locationCountry === 'abroad'
                      ? t('flow.locationCountryAbroad')
                      : t('flow.locationCountryHu')
                  }
                </span>
              )}
              {prediction.groups?.map((g) => (
                <a key={g.groupToken} href={`#csoport/${g.groupToken}`}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100">
                  <Users className="size-3" />
                  {g.name}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyShareLink}>
                {copied
                  ? <Check className="size-3.5 text-emerald-600" aria-hidden />
                  : <Copy className="size-3.5" aria-hidden />
                }
                <span className="hidden sm:inline">{copied ? t('profile.copied') : t('profile.share')}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowRestore(true)}>
                <KeyRound className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{t('flow.restoreSession')}</span>
              </Button>
            </div>
          </div>
        </PageHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
            <div className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-5 md:overflow-visible">
              {PARTY_OPTIONS.map((option) => {
                const isWinner = prediction.listWinnerId === option.id
                const pctValue = prediction[PCT_KEYS[option.id]] as number | null
                const pmOption = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === option.id)
                const isPmWinner = prediction.pmWinnerId === option.id

                return (
                  <div key={option.id} className="w-[85vw] max-w-xs shrink-0 snap-center border-r border-zinc-200 last:border-r-0 md:w-auto md:max-w-none md:shrink md:border-b-0 md:border-r">
                    <div className="flex w-full flex-col items-center bg-white p-4 text-center md:min-h-[25rem]">
                      <p className="mb-3 text-xs font-semibold text-zinc-700">{option.ballotNumber}.</p>
                      <img
                        src={option.logoSrc}
                        alt={option.shortName}
                        className="mx-auto mb-4 h-12 w-auto object-contain"
                      />
                      <div className="mb-4 flex justify-center">
                        <span className={`flex size-10 items-center justify-center overflow-hidden rounded-full border-2 ${
                          isWinner ? 'border-zinc-400' : 'border-zinc-300'
                        }`}>
                          {isWinner && <span className="text-[2rem] font-bold leading-none text-[#1616E6]">&#x2715;</span>}
                        </span>
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-zinc-900">{option.shortName}</p>
                      <p className="mt-1 min-h-[2.8rem] break-words text-[10px] uppercase leading-tight text-zinc-600">
                        {option.fullName}
                      </p>
                      <div className="mt-4 w-full border-t border-zinc-200 pt-3 md:hidden">
                        <details className="text-left">
                          <summary className="cursor-pointer list-none text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:text-zinc-600">
                            {t('flow.candidatesLabel')} ↓
                          </summary>
                          <ul className="mt-2 space-y-0.5 text-center text-[10px] uppercase leading-tight text-zinc-700">
                            {option.topFiveCandidates.map((candidate) => (
                              <li key={candidate}>{candidate}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                      <div className="mt-5 hidden w-full border-t border-zinc-200 pt-4 md:block">
                        <ul className="space-y-0.5 text-[10px] uppercase leading-tight text-zinc-700">
                          {option.topFiveCandidates.map((candidate) => (
                            <li key={candidate}>{candidate}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-zinc-200 px-3 pb-3 pt-2">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                          {t('flow.partyPercent')}
                        </span>
                        <p className={`flex items-center justify-between gap-1 rounded-md border bg-zinc-50 px-2 py-1.5 text-xs ${
                          pctValue !== null && pctValue < 5
                            ? 'border-red-300 text-red-700'
                            : 'border-zinc-200 text-zinc-800'
                        }`}>
                          <span>{pctDisplay(pctValue)}</span>
                          <DeltaIndicator guess={pctValue} partyId={option.id} />
                        </p>
                        {pctValue !== null && pctValue > 0 && prediction.participationRate !== null && prediction.participationRate > 0 && (
                          <p className="mt-0.5 text-[10px] text-zinc-400">
                            {t('flow.totalVotesEst', { count: Math.round(TOTAL_ELIGIBLE_VOTERS * prediction.participationRate / 100 * pctValue / 100).toLocaleString('hu-HU') })}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 border-t border-zinc-100 pt-2">
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                          {t('flow.pmCandidate')}
                        </p>
                        {pmOption && (() => {
                          const isBelowPct = pctValue !== null && pctValue < 5
                          const pmImgClass = isPmWinner ? '' : 'grayscale opacity-60'
                          const pmBorderClass = isPmWinner
                            ? 'ring-2 ring-zinc-800 border-zinc-800 bg-zinc-50'
                            : isBelowPct
                              ? 'border-zinc-200 bg-zinc-50'
                              : 'border-zinc-200 bg-white'
                          return (
                            <div className={`w-full rounded-md border p-2 text-center ${pmBorderClass}`}>
                              <div className="space-y-2">
                                <div className="relative overflow-hidden rounded">
                                  <img
                                    src={pmOption.portraitSrc}
                                    alt={pmOption.candidateName}
                                    className={`aspect-[3/4] w-full object-cover object-top md:aspect-auto md:h-50 ${pmImgClass}`}
                                  />
                                  {isBelowPct && (
                                    <img
                                      src={pmXSvg}
                                      alt=""
                                      aria-hidden
                                      className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                                    />
                                  )}
                                </div>
                                <p className={`truncate text-xs font-semibold ${
                                  isPmWinner ? 'text-zinc-900' : 'text-zinc-400'
                                }`}>
                                  {pmOption.candidateName}
                                </p>
                                <p className={`truncate text-[10px] ${
                                  isPmWinner ? 'text-zinc-600' : 'text-zinc-400'
                                }`}>
                                  {pmOption.partyShortName}
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-1.5 border-t border-zinc-100 py-2 md:hidden">
              {PARTY_OPTIONS.map((option) => (
                <span
                  key={option.id}
                  className={`inline-block size-1.5 rounded-full ${
                    prediction.listWinnerId === option.id ? 'bg-zinc-700' : 'bg-zinc-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-[10px] text-zinc-400">{t('flow.swipeHint')}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{t('flow.nationalitiesLabel')}</p>
                  <p className="text-[10px] leading-snug text-zinc-500"><T i18nKey="flow.nationalitiesHint" /></p>
                  {prediction.pctNationalities !== null && prediction.pctNationalities > 0 && prediction.participationRate !== null && prediction.participationRate > 0 && (
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {t('flow.totalVotesEst', { count: Math.round(TOTAL_ELIGIBLE_VOTERS * prediction.participationRate / 100 * prediction.pctNationalities / 100).toLocaleString('hu-HU') })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border bg-zinc-50 px-2 py-1.5 text-xs tabular-nums ${
                    prediction.pctNationalities !== null && prediction.pctNationalities > 0
                      ? 'border-zinc-200 text-zinc-800'
                      : 'border-zinc-200 text-zinc-400'
                  }`}>
                    {pctDisplay(prediction.pctNationalities)}
                  </span>
                  {RESULTS_AVAILABLE && prediction.pctNationalities !== null && (
                    <NationalitiesDelta guess={prediction.pctNationalities} />
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{t('flow.participationRate')}</p>
                  <p className="text-[10px] leading-snug text-zinc-500"><T i18nKey="flow.participationRateHint" /></p>
                  {prediction.participationRate != null && (
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {t('flow.totalVoters', { count: Math.round(TOTAL_ELIGIBLE_VOTERS * prediction.participationRate / 100).toLocaleString('hu-HU') })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border bg-zinc-50 px-2 py-1.5 text-xs tabular-nums ${
                    prediction.participationRate !== null
                      ? 'border-zinc-200 text-zinc-800'
                      : 'border-zinc-200 text-zinc-400'
                  }`}>
                    {pctDisplay(prediction.participationRate)}
                  </span>
                  {RESULTS_AVAILABLE && prediction.participationRate !== null && (
                    <AttendanceDelta guess={prediction.participationRate} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {prediction.groups && prediction.groups.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-zinc-900">{t('profile.groupsTitle')}</p>
              <div className="space-y-1.5">
                {prediction.groups.map((g) => (
                  <div key={g.groupToken} className="flex items-center justify-between text-xs">
                    <a href={`#csoport/${g.groupToken}`} className="font-medium text-indigo-700 hover:underline">
                      {g.name}
                    </a>
                    <span className="text-zinc-500">
                      {g.memberRank != null
                        ? t('profile.groupRank', { rank: g.memberRank, count: g.memberCount })
                        : t('profile.noGroupRank')
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prediction.finalizedAt && (
            <p className="text-xs text-zinc-500">
              {t('profile.finalizedAt')} {new Date(prediction.finalizedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      <RestoreSessionModal open={showRestore} onClose={() => setShowRestore(false)} onRestore={handleRestore} />
    </section>
  )
}
