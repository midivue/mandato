import { useTranslation } from 'react-i18next'
import { Loader2, Trophy } from 'lucide-react'
import { PartyBadge } from '@/components/party-badge'
import { RankBadge } from '@/components/rank-badge'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { LeaderboardEntry } from '@mandatoto/shared/types'
import { formatDateTimeBudapest } from '@/lib/date-format'
import { ScoreTooltip } from './score-tooltip'

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  loading: boolean
  currentToken: string | null
  /** When true the title/subtitle header is omitted (used inside LeaderboardTabs). */
  hideHeader?: boolean
  /** Pre-filtered entries from the parent search; falls back to entries when absent. */
  displayedEntries?: LeaderboardEntry[]
  /** Share token of the current user, resolved by the parent search handler. */
  userShareToken?: string | null
  /** Whether a search is currently active (≥2 chars typed). */
  isSearchActive?: boolean
  /** Whether a server-side search is in progress. */
  searchLoading?: boolean
}

export function LeaderboardTable({
  entries,
  loading,
  currentToken: _currentToken,
  hideHeader = false,
  displayedEntries,
  userShareToken,
  isSearchActive = false,
  searchLoading = false,
}: LeaderboardTableProps) {
  const { t } = useTranslation()

  const shown = displayedEntries ?? (!RESULTS_AVAILABLE ? entries.slice(0, 10) : entries)

  return (
    <div>
      {!hideHeader && (
        <>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Trophy className="size-4 text-zinc-500" />
            {t(RESULTS_AVAILABLE ? 'leaderboard.individualLeaderboard' : 'leaderboard.individualLeaderboardPreResult')}
          </h3>
          <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500">
            {t(RESULTS_AVAILABLE ? 'leaderboard.individualSubtitle' : 'leaderboard.individualSubtitlePreResult')}
          </p>
        </>
      )}

      {isSearchActive && shown.length === 0 && !searchLoading && (
        <p className="py-8 text-center text-sm text-zinc-400">
          {t('leaderboard.noSearchResults')}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        </div>
      ) : !isSearchActive && entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-400">
          {t('leaderboard.empty')}
        </p>
      ) : shown.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5 text-right w-10">{t('leaderboard.rank')}</th>
                <th className="px-3 py-2.5">{t('leaderboard.name')}</th>
                <th className="px-3 py-2.5 text-right">{t('leaderboard.score')}</th>
                <th className="px-3 py-2.5">{t('leaderboard.partyWinner')}</th>
                <th className="px-3 py-2.5">{t('leaderboard.pmWinner')}</th>
                <th className="px-3 py-2.5 text-right">{t('leaderboard.finalized')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((entry, idx) => {
                const num = entry.rank ?? (entries.length - idx)
                const isCurrentUserRow = userShareToken != null
                  ? entry.shareToken === userShareToken
                  : false
                return (
                  <tr
                    key={`${entry.shareToken}-${idx}`}
                    className={`border-b border-zinc-100 transition-colors ${
                      RESULTS_AVAILABLE && entry.rank != null && entry.rank <= 3 ? 'bg-zinc-50/60' : ''
                    } ${isCurrentUserRow ? 'border-l-2 border-l-zinc-900 bg-amber-50/40' : ''}`}
                  >
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-zinc-500">
                      {RESULTS_AVAILABLE && entry.rank != null && entry.rank <= 3 ? (
                        <RankBadge rank={num} />
                      ) : RESULTS_AVAILABLE ? (
                        num
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-zinc-900">
                      <a
                        href={`#tipp/${entry.shareToken}`}
                        className="underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
                      >
                        {entry.displayName}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-zinc-800">
                      <div className="group/score relative inline-block cursor-default">
                        {entry.score !== null ? entry.score.toFixed(1) : '—'}
                        <ScoreTooltip entry={entry} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.listWinnerId && <PartyBadge partyId={entry.listWinnerId} />}
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.pmWinnerId && <PartyBadge partyId={entry.pmWinnerId} />}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-zinc-500">
                      {entry.finalizedAt
                        ? formatDateTimeBudapest(entry.finalizedAt)
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
