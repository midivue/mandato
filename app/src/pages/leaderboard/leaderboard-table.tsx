import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, Trophy, User, X } from 'lucide-react'
import * as api from '@/lib/api-client'
import { PartyBadge } from '@/components/party-badge'
import { RankBadge } from '@/components/rank-badge'
import { Button } from '@/components/ui/button'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { LeaderboardEntry } from '@mandatoto/shared/types'
import { ScoreTooltip } from './score-tooltip'

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  loading: boolean
  currentToken: string | null
}

export function LeaderboardTable({ entries, loading, currentToken }: LeaderboardTableProps) {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [findMeLoading, setFindMeLoading] = useState(false)
  const [userShareToken, setUserShareToken] = useState<string | null>(null)

  const clientFiltered = useMemo(() => {
    if (searchQuery.length < 2) return null
    const q = searchQuery.toLowerCase()
    const matches = entries.filter((e) => e.displayName.toLowerCase().includes(q))
    return matches.length > 0 ? matches : null
  }, [searchQuery, entries])

  const searchServerSide = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      api.getLeaderboard(query)
        .then((data) => setSearchResults(data))
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 350)
  }, [])

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setSearchResults(null)

    if (value.length < 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchLoading(false)
      return
    }

    const q = value.toLowerCase()
    const hasClientMatch = entries.some((e) => e.displayName.toLowerCase().includes(q))
    if (!hasClientMatch) {
      searchServerSide(value)
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
    setSearchLoading(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  async function handleFindMe() {
    if (!currentToken) return
    setFindMeLoading(true)
    try {
      const data = await api.getPrediction(currentToken)
      if (!data) return
      setUserShareToken(data.shareToken ?? null)
      const name = data.displayName as string
      setSearchQuery(name)
      setSearchResults(null)
      const q = name.toLowerCase()
      const hasClientMatch = entries.some((e) => e.displayName.toLowerCase().includes(q))
      if (!hasClientMatch) {
        searchServerSide(name)
      }
    } catch {
      // ignore
    } finally {
      setFindMeLoading(false)
    }
  }

  const allDisplayed = clientFiltered ?? searchResults ?? entries
  const displayedEntries = !RESULTS_AVAILABLE ? allDisplayed.slice(0, 10) : allDisplayed
  const isSearchActive = searchQuery.length >= 2

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Trophy className="size-4 text-zinc-500" />
        {t(RESULTS_AVAILABLE ? 'leaderboard.individualLeaderboard' : 'leaderboard.individualLeaderboardPreResult')}
      </h3>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500">
        {t(RESULTS_AVAILABLE ? 'leaderboard.individualSubtitle' : 'leaderboard.individualSubtitlePreResult')}
      </p>

      {RESULTS_AVAILABLE && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2">
            <Search className="size-3.5 shrink-0 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('leaderboard.searchPlaceholder')}
              className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600">
                <X className="size-3.5" />
              </button>
            )}
            {searchLoading && <Loader2 className="size-3.5 shrink-0 animate-spin text-zinc-400" />}
          </div>
          {currentToken && (
            <Button variant="outline" size="sm" onClick={handleFindMe} disabled={findMeLoading}>
              {findMeLoading ? <Loader2 className="size-3.5 animate-spin" /> : <User className="size-3.5" />}
              {t('leaderboard.findMe')}
            </Button>
          )}
        </div>
      )}

      {isSearchActive && displayedEntries.length === 0 && !searchLoading && (
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
      ) : displayedEntries.length > 0 ? (
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
              {displayedEntries.map((entry, idx) => {
                const num = entry.rank ?? (entries.length - idx)
                const isCurrentUserRow =
                  userShareToken != null
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
                        ? new Date(entry.finalizedAt).toLocaleString(undefined, {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })
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
