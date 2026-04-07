import { useTranslation } from 'react-i18next'
import { T } from '@/components/trans'

function GuideBox({
  titleKey,
  descKey,
  variant = 'default',
}: {
  titleKey: string
  descKey: string
  variant?: 'default' | 'amber' | 'blue'
}) {
  const { t } = useTranslation()
  const colors = {
    default: {
      wrap: 'border-zinc-200 bg-zinc-50/50',
      title: 'text-zinc-900',
      desc: 'text-zinc-500',
    },
    amber: {
      wrap: 'border-amber-200 bg-amber-50/50',
      title: 'text-amber-800',
      desc: 'text-amber-700/80',
    },
    blue: {
      wrap: 'border-blue-200 bg-blue-50/50',
      title: 'text-blue-800',
      desc: 'text-blue-700/80',
    },
  }[variant]

  return (
    <div className={`rounded-lg border px-3 py-2 ${colors.wrap}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${colors.title}`}>{t(titleKey)}</p>
      <p className={`mt-0.5 text-xs leading-relaxed ${colors.desc}`}><T i18nKey={descKey} /></p>
    </div>
  )
}

export function GuideSection() {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('flow.guideTitle')}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <GuideBox titleKey="flow.guideWinner" descKey="flow.guideWinnerDesc" />
        <GuideBox titleKey="flow.guidePercent" descKey="flow.guidePercentDesc" />
        <GuideBox titleKey="flow.guidePm" descKey="flow.guidePmDesc" />
        <GuideBox titleKey="flow.guideFinalize" descKey="flow.guideFinalizeDesc" />

        {/* Secondary info — always visible on desktop, collapsible on mobile */}
        <div className="contents md:hidden">
          <details className="col-span-full">
            <summary className="cursor-pointer list-none py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:text-zinc-600">
              {t('flow.guideMoreDetails')} ↓
            </summary>
            <div className="mt-2 grid gap-2">
              <GuideBox titleKey="flow.guideDraft" descKey="flow.guideDraftDesc" variant="amber" />
              <GuideBox titleKey="flow.guideToken" descKey="flow.guideTokenDesc" variant="blue" />
            </div>
          </details>
        </div>
        <div className="contents max-md:hidden">
          <GuideBox titleKey="flow.guideDraft" descKey="flow.guideDraftDesc" variant="amber" />
          <GuideBox titleKey="flow.guideToken" descKey="flow.guideTokenDesc" variant="blue" />
        </div>
      </div>
    </div>
  )
}
