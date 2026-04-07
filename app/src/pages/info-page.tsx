import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown, Info, ShieldCheck, Calendar, Target,
  Footprints, Vote, Users, KeyRound, Trophy, Code,
  Monitor, Server, Database, ArrowDown,
} from 'lucide-react'

import { T } from '@/components/trans'
import { AppInfoBoxes } from '@/components/info-boxes'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'

function Accordion({ question, answerKey }: { question: string; answerKey: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-zinc-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-700"
      >
        {question}
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="pb-3.5 text-sm leading-relaxed text-zinc-600"><T i18nKey={answerKey} /></p>
        </div>
      </div>
    </div>
  )
}

function CompactList({ items, ns = 'info' }: { items: readonly { key: string }[]; ns?: string }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
      {items.map(({ key }, idx) => (
        <div key={key} className="flex gap-3 px-4 py-3">
          <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold tabular-nums text-zinc-500">
            {idx + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900">{t(`${ns}.${key}`)}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500"><T i18nKey={`${ns}.${key}Desc`} /></p>
          </div>
        </div>
      ))}
    </div>
  )
}

const HOW_TO_STEPS = [
  { key: 'howToStep1' },
  { key: 'howToStep2' },
  { key: 'howToStep3' },
  { key: 'howToStep4' },
  { key: 'howToStep5' },
] as const

const GROUPS_ITEMS = [
  { key: 'groupsCreate' },
  { key: 'groupsInvite' },
  { key: 'groupsLeaderboard' },
  { key: 'groupsVisibility' },
  { key: 'groupsBest' },
  { key: 'groupsLeave' },
] as const

const TOKEN_ITEMS = [
  { key: 'tokenWhat' },
  { key: 'tokenBackup' },
  { key: 'tokenRestore' },
  { key: 'tokenShare' },
  { key: 'tokenLeaveSession' },
] as const

const LEADERBOARD_ITEMS = [
  { key: 'leaderboardRanking' },
  { key: 'leaderboardVisibility' },
  { key: 'leaderboardBestGroups' },
  { key: 'leaderboardProfile' },
  { key: 'leaderboardPhases' },
] as const

const PRIVACY_ITEMS = [
  { key: 'privacyNoReg', icon: '01' },
  { key: 'privacyNoCookies', icon: '02' },
  { key: 'privacyMinData', icon: '03' },
  { key: 'privacyControl', icon: '04' },
  { key: 'privacyOpenSource', icon: '05' },
] as const

const FAQ_KEYS = [
  'faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6', 'faq7', 'faq8', 'faq9',
  'faq10', 'faq11', 'faq12', 'faq13', 'faq14', 'faq15', 'faq16', 'faq17', 'faq18',
] as const

export function InfoPage() {
  const { t } = useTranslation()

  return (
    <section aria-label={t('info.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader icon={<Info className="size-5 text-zinc-500" />} title={t('info.title')}>
          {/* <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            <T i18nKey="info.subtitle" />
          </p> */}
        </PageHeader>
        <CardContent className="space-y-8">
          <AppInfoBoxes />

          {/* Election context */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Vote className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.electionTitle')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-zinc-600"><T i18nKey="info.electionIntro" /></p>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 space-y-1.5">
                <p className="text-xs leading-relaxed text-zinc-600"><T i18nKey="info.electionParties" /></p>
                <p className="text-xs leading-relaxed text-zinc-500"><T i18nKey="info.electionThreshold" /></p>
                <p className="text-xs leading-relaxed text-zinc-500"><T i18nKey="info.electionNationalities" /></p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="size-4 text-zinc-400" />
                <h4 className="text-xs font-semibold text-zinc-700">{t('info.scheduleTitle')}</h4>
              </div>
              <div className="relative space-y-0 pl-5">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-zinc-200" />
                {(['schedulePhase1', 'schedulePhase2', 'schedulePhase3'] as const).map((key, idx) => (
                  <div key={key} className="relative pb-5 last:pb-0">
                    <div className={`absolute -left-5 top-1 size-3.5 rounded-full border-2 ${
                      idx === 0
                        ? 'border-zinc-900 bg-zinc-900'
                        : idx === 1
                          ? 'border-zinc-900 bg-white'
                          : 'border-zinc-300 bg-white'
                    }`} />
                    <p className="text-xs font-semibold text-zinc-900">{t(`info.${key}`)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500"><T i18nKey={`info.${key}Desc`} /></p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scoring breakdown */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.scoringTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.scoringIntro" /></p>
            <div className="grid gap-3 md:grid-cols-3">
              {([
                { key: 'scoringListWinner', pts: 20, color: 'bg-zinc-900' },
                { key: 'scoringPct', pts: 60, color: 'bg-zinc-700' },
                { key: 'scoringPm', pts: 20, color: 'bg-zinc-500' },
              ] as const).map(({ key, pts, color }) => (
                <div key={key} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-bold tabular-nums text-white ${color}`}>
                      {pts} pt
                    </span>
                  </div>
                  <p className="mb-1 text-xs font-semibold text-zinc-900">{t(`info.${key}`)}</p>
                  <p className="text-xs leading-relaxed text-zinc-500"><T i18nKey={`info.${key}Desc`} /></p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <p className="text-xs leading-relaxed text-zinc-500"><T i18nKey="info.scoringWhy" /></p>
            </div>
          </div>

          {/* How to use — vertical stepper */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Footprints className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.howToTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.howToIntro" /></p>
            <div className="relative space-y-0 pl-8">
              <div className="absolute bottom-2 left-[11px] top-2 w-px bg-zinc-200" />
              {HOW_TO_STEPS.map(({ key }, idx) => (
                <div key={key} className="relative pb-5 last:pb-0">
                  <div className="absolute -left-8 top-0 flex size-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold tabular-nums text-white">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">{t(`info.${key}`)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500"><T i18nKey={`info.${key}Desc`} /></p>
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.groupsTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.groupsIntro" /></p>
            <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-900">
                {t('groups.infoTitle')}
              </p>
              <p className="text-xs leading-relaxed text-zinc-500">
                <T i18nKey="groups.infoHow" />
              </p>
            </div>
            <CompactList items={GROUPS_ITEMS} />
          </div>

          {/* Token and session */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.tokenTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.tokenIntro" /></p>
            <CompactList items={TOKEN_ITEMS} />
          </div>

          {/* Leaderboard details */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.leaderboardTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.leaderboardIntro" /></p>
            <CompactList items={LEADERBOARD_ITEMS} />
          </div>

          {/* Privacy */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.privacyTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.privacyIntro" /></p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {PRIVACY_ITEMS.map(({ key, icon }) => (
                <div key={key} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <span className="mb-2 inline-block rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
                    {icon}
                  </span>
                  <p className="mb-1 text-xs font-semibold text-zinc-900">{t(`info.${key}`)}</p>
                  <p className="text-xs leading-relaxed text-zinc-500"><T i18nKey={`info.${key}Desc`} /></p>
                </div>
              ))}
            </div>
          </div>

          {/* Open source */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Code className="size-5 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900">{t('info.openSourceTitle')}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600"><T i18nKey="info.openSourceIntro" /></p>
            <p className="mb-5 text-xs leading-relaxed text-zinc-500"><T i18nKey="info.openSourceArch" /></p>

            {/* Architecture layer diagram */}
            <div className="flex flex-col items-center gap-0">
              {([
                { icon: Monitor, labelKey: 'archFrontend', tags: ['React', 'TypeScript', 'Tailwind CSS', 'i18next'] },
                { icon: Server, labelKey: 'archApi', tags: ['TypeScript', 'REST', 'Hono'] },
                { icon: Database, labelKey: 'archDb', tags: ['SQL', t('info.archRelational')] },
              ] as const).map(({ icon: Icon, labelKey, tags }, idx) => (
                <div key={labelKey} className="flex w-full flex-col items-center">
                  {idx > 0 && <ArrowDown className="my-1.5 size-4 text-zinc-300" />}
                  <div className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900">{t(`info.${labelKey}`)}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500"><T i18nKey={`info.${labelKey}Desc`} /></p>
                    </div>
                    <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                      {tags.map(tag => (
                        <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-zinc-500"><T i18nKey="info.openSourceContribute" /></p>
          </div>

          {/* FAQ accordion */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('info.faqTitle')}</h3>
            <div className="rounded-lg border border-zinc-200 px-4">
              {FAQ_KEYS.map((key) => (
                <Accordion
                  key={key}
                  question={t(`info.${key}q`)}
                  answerKey={`info.${key}a`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
