import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { PartyBadge } from '@/components/party-badge'
import { RankBadge } from '@/components/rank-badge'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { GroupMember } from '@mandatoto/shared/types'

type MemberLeaderboardProps = {
  members: GroupMember[]
  userShareToken: string | null
  canEdit: boolean
  onConfirmRemove: (member: GroupMember) => void
}

export function MemberLeaderboard({ members, userShareToken, canEdit, onConfirmRemove }: MemberLeaderboardProps) {
  const { t } = useTranslation()

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        {t('groups.detail.emptyGroup')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-2 py-2.5 text-right w-10 sm:px-3">{t('groups.detail.groupRank')}</th>
            <th className="hidden px-3 py-2.5 text-right w-14 sm:table-cell">{t('groups.detail.globalRank')}</th>
            <th className="px-2 py-2.5 sm:px-3">{t('leaderboard.name')}</th>
            <th className="px-2 py-2.5 text-right sm:px-3">{t('leaderboard.score')}</th>
            <th className="px-2 py-2.5 sm:px-3">{t('leaderboard.partyWinner')}</th>
            <th className="hidden px-3 py-2.5 sm:table-cell">{t('leaderboard.pmWinner')}</th>
            {canEdit && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isMe = userShareToken === member.shareToken
            return (
              <tr
                key={member.shareToken}
                className={`border-b border-zinc-100 transition-colors ${
                  isMe ? 'border-l-2 border-l-zinc-900 bg-zinc-50/40' : ''
                } ${
                  RESULTS_AVAILABLE && member.groupRank <= 3 ? 'bg-zinc-50/60' : ''
                }`}
              >
                <td className="px-2 py-2.5 text-right tabular-nums font-medium text-zinc-500 sm:px-3">
                  {RESULTS_AVAILABLE && member.groupRank <= 3 ? (
                    <RankBadge rank={member.groupRank} />
                  ) : (
                    member.groupRank
                  )}
                </td>
                <td className="hidden px-3 py-2.5 text-right tabular-nums text-xs text-zinc-400 sm:table-cell">
                  {member.globalRank ?? '—'}
                </td>
                <td className="px-2 py-2.5 font-medium text-zinc-900 sm:px-3">
                  <a
                    href={`#tipp/${member.shareToken}`}
                    className="underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
                  >
                    {member.displayName}
                  </a>
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-zinc-800 sm:px-3">
                  {member.score !== null ? member.score.toFixed(1) : '—'}
                </td>
                <td className="px-2 py-2.5 sm:px-3">
                  {member.listWinnerId && <PartyBadge partyId={member.listWinnerId} />}
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  {member.pmWinnerId && <PartyBadge partyId={member.pmWinnerId} />}
                </td>
                {canEdit && (
                  <td className="px-2 py-2.5">
                    <button
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
  )
}
