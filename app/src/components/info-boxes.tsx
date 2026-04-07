import { useTranslation } from 'react-i18next'

import { T } from '@/components/trans'

type InfoBoxProps = {
  titleKey: string
  bodyKey: string
  bodyKeyShort?: string
}

function InfoBox({ titleKey, bodyKey, bodyKeyShort }: InfoBoxProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-900">
        {t(titleKey)}
      </p>
      {bodyKeyShort ? (
        <>
          <p className="text-xs leading-relaxed text-zinc-500 md:hidden">
            <T i18nKey={bodyKeyShort} />
          </p>
          <p className="hidden text-xs leading-relaxed text-zinc-500 md:block">
            <T i18nKey={bodyKey} />
          </p>
        </>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-500">
          <T i18nKey={bodyKey} />
        </p>
      )}
    </div>
  )
}

export function AppInfoBoxes() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <InfoBox titleKey="main.introPurposeTitle" bodyKey="main.introPurpose" bodyKeyShort="main.introPurposeShort" />
      <InfoBox titleKey="main.introHowTitle" bodyKey="main.introHow" bodyKeyShort="main.introHowShort" />
    </div>
  )
}

export function GroupInfoBoxes() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <InfoBox titleKey="main.introPurposeTitle" bodyKey="main.introPurpose" bodyKeyShort="main.introPurposeShort" />
      <InfoBox titleKey="groups.infoTitle" bodyKey="groups.infoHow" bodyKeyShort="groups.infoHowShort" />
    </div>
  )
}
