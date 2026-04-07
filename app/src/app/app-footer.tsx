import { Trans, useTranslation } from 'react-i18next'
import { useCountdown } from '@/hooks/use-countdown'
import {
  BUILD_COMMIT_HASH,
  BUILD_DATE,
  BUILD_TAG,
  COMMIT_HREF,
  FOOTER_CREDIT_MIDI_HREF,
  FOOTER_CREDIT_OAK_HREF,
  RELEASE_HREF,
} from '@/lib/build-info'

const footerLinkClass =
  'text-[11px] font-medium text-zinc-500 transition hover:text-zinc-900'

export function AppFooter() {
  const { t, i18n } = useTranslation()
  const cd = useCountdown()

  return (
    <footer className="relative mx-auto w-full max-w-6xl px-5 pb-8 md:px-8">
      <div className="flex flex-col items-center gap-3 border-t border-zinc-200/80 pt-5 text-center sm:grid sm:grid-cols-3 sm:items-center sm:gap-y-2 sm:text-left">

        {/* Row 1 — left */}
        <p className="order-3 text-[11px] text-zinc-400 sm:order-none">{t('footer.madeFor')}</p>

        {/* Row 1 — center */}
        <a
          href="https://vtr.valasztas.hu/ogy2026/valasztopolgaroknak/szavazohelyiseg-kereses"
          target="_blank"
          rel="noopener noreferrer"
          className="order-1 text-[11px] text-zinc-400 no-underline sm:order-none sm:text-center"
        >
          {t('footer.goVote')}
        </a>

        {/* Row 1 — right: open source link + language switcher */}
        <div className="order-5 flex items-center justify-center gap-4 sm:order-none sm:justify-end">
          <a
            href={t('footer.openSourceHref')}
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClass}
          >
            {t('footer.openSource')} &middot; {t('footer.github')} ↗
          </a>
          <span className="text-zinc-200">|</span>
          {(['hu', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => void i18n.changeLanguage(lang)}
              className={`text-[11px] uppercase transition ${
                i18n.resolvedLanguage === lang
                  ? 'font-semibold text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Row 2 — left */}
        <p className="order-7 text-[11px] text-zinc-400 sm:order-none">
          <Trans
            i18nKey="footer.devCredit"
            components={{
              midi: (
                <a
                  href={FOOTER_CREDIT_MIDI_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                />
              ),
              oak: (
                <a
                  href={FOOTER_CREDIT_OAK_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                />
              ),
            }}
          />
        </p>

        {/* Row 2 — center: countdown or cutoff message */}
        {cd.expired ? (
          <p className="order-2 text-[11px] text-zinc-400 sm:order-none sm:text-center">{t('footer.cutoffPassed')}</p>
        ) : (
          <div className="order-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 sm:order-none">
            <span className="font-semibold text-zinc-900">{cd.d}</span>
            <span className="text-zinc-400">{t('footer.days')}</span>
            <span className="font-semibold text-zinc-900">{String(cd.h).padStart(2, '0')}</span>
            <span className="text-zinc-400">{t('footer.hours')}</span>
            <span className="font-semibold text-zinc-900">{String(cd.m).padStart(2, '0')}</span>
            <span className="text-zinc-400">{t('footer.minutes')}</span>
            <span className="font-semibold text-zinc-900">{String(cd.s).padStart(2, '0')}</span>
            <span className="text-zinc-400">{t('footer.seconds')}</span>
          </div>
        )}

        {/* Row 2 — right: version/date + commit hash */}
        <p className="order-6 text-[11px] text-zinc-400 sm:order-none sm:text-right">
          {RELEASE_HREF ? (
            <a
              href={RELEASE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-zinc-600"
            >
              {BUILD_TAG}
            </a>
          ) : (
            <span>{BUILD_DATE}</span>
          )}
          <span className="mx-1 text-zinc-300">·</span>
          <a
            href={COMMIT_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono transition hover:text-zinc-600"
          >
            {BUILD_COMMIT_HASH}
          </a>
        </p>

      </div>
    </footer>
  )
}
