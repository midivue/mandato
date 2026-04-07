import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { PartyBadge } from '@/components/party-badge'
import { PARTY_OPTIONS } from '@/data/election-options'
import { REFERENCE_RESULT, RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { GroupMember } from '@mandatoto/shared/types'
import { PCT_KEYS, pctDeviationClass } from './group-detail-utils'

type TipsComparisonProps = {
  members: GroupMember[]
  userShareToken: string | null
  canEdit: boolean
  onConfirmRemove: (member: GroupMember) => void
}

export function sortMembersByGroupScore(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => {
    const sa = a.score
    const sb = b.score
    if (sa != null && sb != null && sa !== sb) return sb - sa
    if (sa != null && sb == null) return -1
    if (sa == null && sb != null) return 1
    return a.groupRank - b.groupRank
  })
}

export function TipsComparison({
  members,
  userShareToken,
  canEdit,
  onConfirmRemove,
}: TipsComparisonProps) {
  const { t } = useTranslation()
  const sorted = useMemo(() => sortMembersByGroupScore(members), [members])

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        {t('groups.detail.emptyGroup')}
      </p>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t('groups.detail.tipsTitle')}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="sticky left-0 bg-zinc-50 px-1.5 py-2 text-left sm:px-3">
                {t('leaderboard.name')}
              </th>
              {PARTY_OPTIONS.map((p) => (
                <th key={p.id} className="px-1.5 py-2 text-right sm:px-2">
                  {p.shortName}
                </th>
              ))}
              <th className="px-1.5 py-2 text-right sm:px-2">{t('stats.nationalities')}</th>
              <th className="px-1.5 py-2 text-right sm:px-2">{t('leaderboard.tooltipAttendance')}</th>
              <th className="px-1.5 py-2 text-center sm:px-2">{t('leaderboard.partyWinner')}</th>
              <th className="px-1.5 py-2 text-center sm:px-2">{t('leaderboard.pmWinner')}</th>
              <th className="px-1.5 py-2 text-right sm:px-2">{t('leaderboard.score')}</th>
              {canEdit && <th className="w-10 px-1 py-2 sm:w-11" aria-label={t('groups.detail.removeButton')} />}
            </tr>
          </thead>
          <tbody>
            {sorted.map((member, rowIdx) => {
              const isMe = userShareToken === member.shareToken
              const topThreeRow = RESULTS_AVAILABLE && rowIdx < 3 && member.score != null
              return (
                <tr
                  key={member.shareToken}
                  className={`border-b border-zinc-100 ${isMe ? 'bg-zinc-50/60' : ''} ${
                    topThreeRow ? 'bg-zinc-50/60' : ''
                  }`}
                >
                  <td
                    className={`sticky left-0 px-1.5 py-2 font-medium text-zinc-900 whitespace-nowrap sm:px-3 ${
                      topThreeRow || isMe ? 'bg-zinc-50/80' : 'bg-white'
                    }`}
                  >
                    <a
                      href={`#tipp/${member.shareToken}`}
                      className="underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
                    >
                      {member.displayName}
                    </a>
                  </td>
                  {PCT_KEYS.map(({ id, key }) => {
                    const val = member[key] as number | null
                    const actual = REFERENCE_RESULT.percentages[id]
                    return (
                      <td
                        key={id}
                        className={`px-1.5 py-2 text-right text-[10px] tabular-nums sm:px-2 sm:text-xs ${pctDeviationClass(val, actual)}`}
                      >
                        {val !== null ? `${val}%` : '—'}
                      </td>
                    )
                  })}
                  <td
                    className={`px-1.5 py-2 text-right text-[10px] tabular-nums sm:px-2 sm:text-xs ${pctDeviationClass(
                      member.pctNationalities,
                      REFERENCE_RESULT.pctNationalities,
                    )}`}
                  >
                    {member.pctNationalities !== null ? `${member.pctNationalities}%` : '—'}
                  </td>
                  <td
                    className={`px-1.5 py-2 text-right text-[10px] tabular-nums sm:px-2 sm:text-xs ${pctDeviationClass(
                      member.participationRate,
                      REFERENCE_RESULT.participationRate,
                    )}`}
                  >
                    {member.participationRate !== null ? `${member.participationRate}%` : '—'}
                  </td>
                  <td className="px-1.5 py-2 text-center sm:px-2">
                    {member.listWinnerId && <PartyBadge partyId={member.listWinnerId} size="sm" />}
                  </td>
                  <td className="px-1.5 py-2 text-center sm:px-2">
                    {member.pmWinnerId && <PartyBadge partyId={member.pmWinnerId} size="sm" />}
                  </td>
                  <td className="px-1.5 py-2 text-right text-[10px] tabular-nums font-semibold text-zinc-800 sm:px-2 sm:text-xs">
                    {member.score !== null ? member.score.toFixed(1) : '—'}
                  </td>
                  {canEdit && (
                    <td className="px-1 py-2 sm:px-2">
                      <button
                        type="button"
                        onClick={() => onConfirmRemove(member)}
                        className="rounded p-1 text-zinc-300 transition-colors hover:text-red-500"
                        title={t('groups.detail.removeButton')}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
