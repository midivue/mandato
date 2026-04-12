import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, Trophy, User, X } from 'lucide-react'
import * as api from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { RESULTS_AVAILABLE, REFERENCE_RESULT } from '@mandatoto/shared/types'
import type { LeaderboardEntry } from '@mandatoto/shared/types'
import { PARTY_OPTIONS } from '@/data/election-options'

import { LeaderboardTable } from './leaderboard-table'
import { CategoryTable } from './category-table'

type TabId =
  | 'overall'
  | 'mkkp'
  | 'tisza'
  | 'mi_hazank'
  | 'dk'
  | 'fidesz_kdnp'
  | 'nationalities'
  | 'participation'

type LeaderboardTabsProps = {
  entries: LeaderboardEntry[]
  loading: boolean
  currentToken: string | null
}

export function LeaderboardTabs({ entries, loading, currentToken }: LeaderboardTabsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('overall')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [findMeLoading, setFindMeLoading] = useState(false)
  const [userShareToken, setUserShareToken] = useState<string | null>(null)

  const isSearchActive = searchQuery.length >= 2

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

  // For the overall tab: honour server-search results (may include entries outside top 100).
  const overallDisplayed = clientFiltered ?? searchResults ?? entries

  if (!RESULTS_AVAILABLE) {
    return <LeaderboardTable entries={entries} loading={loading} currentToken={currentToken} />
  }

  const partyTabIds = PARTY_OPTIONS.map((p) => p.id as TabId)

  const categoryTitleMap: Record<TabId, string> = {
    overall: t('leaderboard.individualLeaderboard'),
    mkkp: t('leaderboard.categoryTabTitle', { party: 'MKKP' }),
    tisza: t('leaderboard.categoryTabTitle', { party: 'TISZA' }),
    mi_hazank: t('leaderboard.categoryTabTitle', { party: 'Mi Hazánk' }),
    dk: t('leaderboard.categoryTabTitle', { party: 'DK' }),
    fidesz_kdnp: t('leaderboard.categoryTabTitle', { party: 'FIDESZ-KDNP' }),
    nationalities: t('leaderboard.categoryTabTitleNationalities'),
    participation: t('leaderboard.categoryTabTitleParticipation'),
  }

  const tabLabels: Record<TabId, string> = {
    overall: t('leaderboard.tabOverall'),
    mkkp: 'MKKP',
    tisza: 'TISZA',
    mi_hazank: 'Mi Hazánk',
    dk: 'DK',
    fidesz_kdnp: 'FIDESZ-KDNP',
    nationalities: t('leaderboard.tabNationalities'),
    participation: t('leaderboard.tabParticipation'),
  }

  const tabOrder: TabId[] = ['overall', ...partyTabIds, 'nationalities', 'participation']

  function renderContent() {
    if (activeTab === 'overall') {
      return (
        <LeaderboardTable
          entries={entries}
          loading={loading}
          currentToken={null}
          hideHeader
          displayedEntries={overallDisplayed}
          userShareToken={userShareToken}
          isSearchActive={isSearchActive}
          searchLoading={searchLoading}
        />
      )
    }

    const nameFilter = searchQuery.length >= 2 ? searchQuery : undefined

    if (activeTab === 'nationalities') {
      return (
        <CategoryTable
          entries={entries}
          getValue={(e) => e.pctNationalities}
          referenceValue={REFERENCE_RESULT.pctNationalities}
          nameFilter={nameFilter}
        />
      )
    }

    if (activeTab === 'participation') {
      return (
        <CategoryTable
          entries={entries}
          getValue={(e) => e.participationRate}
          referenceValue={REFERENCE_RESULT.participationRate}
          nameFilter={nameFilter}
        />
      )
    }

    const party = PARTY_OPTIONS.find((p) => p.id === activeTab)
    if (party) {
      const fieldKey = `pct${party.id.charAt(0).toUpperCase()}${party.id.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}` as keyof LeaderboardEntry
      return (
        <CategoryTable
          entries={entries}
          getValue={(e) => e[fieldKey] as number | null}
          referenceValue={REFERENCE_RESULT.percentages[party.id]}
          nameFilter={nameFilter}
        />
      )
    }

    return null
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Trophy className="size-4 text-zinc-500" />
        {categoryTitleMap[activeTab]}
      </h3>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500">
        {activeTab === 'overall'
          ? t('leaderboard.individualSubtitle')
          : t('leaderboard.categorySubtitle')}
      </p>

      <div className="mb-3 flex items-center gap-2">
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
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600"
            >
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

      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-1 px-1 pb-1 min-w-max">
          {tabOrder.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              {tabLabels[id]}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  )
}
