import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Users } from 'lucide-react'
import * as api from '@/lib/api-client'

import { TopThreePodium } from '@/components/top-three-podium'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { GroupInfoBoxes } from '@/components/info-boxes'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { GroupDetail, GroupMember } from '@mandatoto/shared/types'

import { CUTOFF_MS, removeGroupFromLocalStorage, sortMembersByGroupScore } from './group-detail-utils'
import { GroupHeader } from './group-header'
import { AddMemberSection } from './add-member-section'
import { TipsComparison } from './tips-comparison'
import { RemoveMemberModal } from './remove-member-modal'
import { LeaveGroupModal } from './leave-group-modal'

type GroupDetailPageProps = {
  groupToken: string
  userToken: string | null
  userShareToken: string | null
}

export function GroupDetailPage({ groupToken, userToken, userShareToken }: GroupDetailPageProps) {
  const { t } = useTranslation()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [confirmRemove, setConfirmRemove] = useState<GroupMember | null>(null)
  const [showLeaveGroup, setShowLeaveGroup] = useState(false)

  const [isBeforeCutoff] = useState(() => Date.now() < CUTOFF_MS)
  const isMember =
    userShareToken !== null &&
    group !== null &&
    group.members.some((m) => m.shareToken === userShareToken)
  const canEdit = isMember && isBeforeCutoff

  const groupPodiumItems = useMemo(() => {
    if (!group) return []
    return sortMembersByGroupScore(group.members)
      .filter((m) => m.score != null)
      .slice(0, 3)
      .map((m) => ({
        displayName: m.displayName,
        score: m.score!,
        shareToken: m.shareToken,
      }))
  }, [group])

  useEffect(() => {
    let cancelled = false
    api.getGroupDetail(groupToken)
      .then((data) => { if (!cancelled) setGroup(data) })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [groupToken])

  useEffect(() => {
    if (notFound) {
      removeGroupFromLocalStorage(groupToken)
      return
    }
    if (!group || !userShareToken) return
    const memberOfGroup = group.members.some((m) => m.shareToken === userShareToken)
    if (!memberOfGroup) {
      removeGroupFromLocalStorage(groupToken)
    }
  }, [group, notFound, groupToken, userShareToken])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (notFound || !group) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-zinc-500">{t('groups.errors.notFound')}</p>
        <a
          href="#csoportok"
          className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
        >
          {t('groups.title')}
        </a>
      </div>
    )
  }

  return (
    <section aria-label={group.name}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader
          icon={<Users className="size-5 text-zinc-500" />}
          title={group.name}
        >
          <GroupHeader
            group={group}
            groupToken={groupToken}
            isMember={isMember}
            userToken={userToken}
            onGroupUpdate={setGroup}
            onShowLeaveGroup={() => setShowLeaveGroup(true)}
          />
        </PageHeader>

        <CardContent className="space-y-5">
          <GroupInfoBoxes />

          {canEdit && userToken && (
            <AddMemberSection
              groupToken={groupToken}
              userToken={userToken}
              onGroupUpdate={setGroup}
            />
          )}

          {RESULTS_AVAILABLE && groupPodiumItems.length > 0 && (
            <TopThreePodium
              items={groupPodiumItems}
              titleKey="groups.detail.topThreeTitle"
              subtitleKey="groups.detail.topThreeSubtitle"
            />
          )}

          <TipsComparison
            members={group.members}
            userShareToken={userShareToken}
            canEdit={canEdit}
            onConfirmRemove={setConfirmRemove}
          />
        </CardContent>
      </Card>

      <RemoveMemberModal
        open={confirmRemove !== null}
        member={confirmRemove}
        groupToken={groupToken}
        userToken={userToken}
        userShareToken={userShareToken}
        onClose={() => setConfirmRemove(null)}
        onGroupUpdate={setGroup}
      />

      {group && (
        <LeaveGroupModal
          open={showLeaveGroup}
          group={group}
          groupToken={groupToken}
          userToken={userToken}
          userShareToken={userShareToken}
          onClose={() => setShowLeaveGroup(false)}
        />
      )}
    </section>
  )
}
