import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, ExternalLink, KeyRound, Link2, Loader2, MapPin, Trophy, User, Users } from 'lucide-react'
import { useApiQuery } from '@/hooks/use-api-query'
import { getSharedPrediction } from '@/lib/api-client'
import { formatDateTimeBudapest } from '@/lib/date-format'

import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { RestoreSessionModal } from '@/components/restore-session-modal'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { RESULTS_AVAILABLE, TOTAL_ELIGIBLE_VOTERS } from '@mandatoto/shared/types'
import { AttendanceDelta, NationalitiesDelta } from './profile/profile-deltas'
import { pctDisplay } from './profile/profile-utils'
import { ProfilePredictionsCompact } from './profile/profile-predictions-compact'
import { ProfilePredictionsCards } from './profile/profile-predictions-cards'

const TELEX_BASE = 'https://telex.hu/melleklet/valasztas-2026/tippjatek/'
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

function TelexEmbed({ telexTipId }: { telexTipId: string }) {
  const { t } = useTranslation()
  const telexUrl = `${TELEX_BASE}${telexTipId}`
  const screenshotUrl = `${API_BASE}/telex-screenshot/${telexTipId}`
  const [imgState, setImgState] = useState<'loading' | 'ok' | 'error'>('loading')

  return (
    <div className="space-y-2">
      <a
        href={telexUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3.5 transition hover:border-zinc-300 hover:bg-zinc-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link2 className="size-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900">{t('telex.profileTitle')}</p>
            <p className="mt-0.5 text-[10px] text-zinc-400 truncate">{telexUrl}</p>
          </div>
        </div>
        <ExternalLink className="size-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-700" aria-hidden />
      </a>

      {imgState !== 'error' && (
        <a
          href={telexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-zinc-200 transition hover:border-zinc-300"
          title={t('telex.profileTitle')}
        >
          <img
            src={screenshotUrl}
            alt={t('telex.screenshotAlt')}
            className="w-full"
            onLoad={() => setImgState('ok')}
            onError={() => setImgState('error')}
          />
        </a>
      )}

      {imgState === 'error' && (
        <p className="text-[11px] text-zinc-500">{t('telex.embedFallback')}</p>
      )}
    </div>
  )
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
          {/* Container query: show compact table below ~52rem, full 5-col cards above */}
          <div className="@container">
            <div className="@min-[52rem]:hidden overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <ProfilePredictionsCompact prediction={prediction} />
            </div>
            <div className="hidden @min-[52rem]:block">
              <ProfilePredictionsCards prediction={prediction} />
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

          {prediction.telexTipId && (
            <TelexEmbed telexTipId={prediction.telexTipId} />
          )}

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
              {t('profile.finalizedAt')} {formatDateTimeBudapest(prediction.finalizedAt)}
            </p>
          )}
        </CardContent>
      </Card>
      <RestoreSessionModal open={showRestore} onClose={() => setShowRestore(false)} onRestore={handleRestore} />
    </section>
  )
}
