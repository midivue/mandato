import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Trophy, User, X } from 'lucide-react'
import logoSvg from '@/assets/logo3.svg'

type AppHeaderProps = {
  page: string
  isFinalized: boolean
  shareToken: string | null
}

export function AppHeader({ page, isFinalized, shareToken }: AppHeaderProps) {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors duration-150 hover:text-zinc-950 ${
      active ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
    }`

  const mobileNavLinkClass = (active: boolean) =>
    `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-zinc-100 text-zinc-950'
        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950'
    }`

  const showMyTip = isFinalized && shareToken
  const myTipHref = `#tipp/${shareToken}`
  const myTipActive = page === `tipp/${shareToken}`

  const links = [
    { href: '#jatek', label: t('header.menuBallot'), active: page === 'jatek' || page === '' },
    { href: '#csoportok', label: t('header.menuGroups'), active: page === 'csoportok' || page.startsWith('csoport/') || page.startsWith('meghivo/') },
    { href: '#stats', label: t('header.menuStats'), active: page === 'stats' },
    { href: '#info', label: t('header.menuInfo'), active: page === 'info' },
    ...(showMyTip ? [{ href: myTipHref, label: t('header.menuMyTip'), active: myTipActive, icon: true }] : []),
  ]

  return (
    <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8">
      <header className="rounded-b-2xl border-x border-b border-zinc-200/80 bg-white/70 px-5 backdrop-blur-sm md:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <a href="#jatek" aria-label={t('header.logoAria')} className="block">
            <img src={logoSvg} alt={t('app.name')} className="h-[2.75rem] w-auto" />
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="primary">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={navLinkClass(link.active)}>
                {'icon' in link && link.icon && <User className="mr-1 inline size-3.5" aria-hidden />}
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#board"
              onClick={() => setMobileOpen(false)}
              className="hidden items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 min-[401px]:inline-flex"
            >
              <Trophy className="size-3.5" />
              {t('header.menuLeaderboard')}
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
              aria-label={mobileOpen ? t('header.menuClose') : t('header.menuOpen')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-zinc-200/80 pb-4 pt-3 md:hidden" aria-label="mobile">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`${'icon' in link && link.icon ? 'inline-flex items-center gap-1.5 ' : ''}${mobileNavLinkClass(link.active)}`}>
                  {'icon' in link && link.icon && <User className="size-3.5" aria-hidden />}
                  {link.label}
                </a>
              ))}
              <a
                href="#board"
                onClick={() => setMobileOpen(false)}
                className={`${mobileNavLinkClass(page === 'board')} inline-flex items-center gap-1.5 min-[401px]:hidden`}
              >
                <Trophy className="size-3.5" />
                {t('header.menuLeaderboard')}
              </a>
            </div>
          </nav>
        )}
      </header>
    </div>
  )
}
