import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavSheet } from './NavSheet'
import { BoardClock } from './BoardClock'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AppShell() {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()
    const { t } = useTranslation()

    const titles: Record<string, string> = {
        '/': t('nav.dashboard'),
        '/flights': t('nav.flights'),
        '/new': t('nav.newFlight'),
        '/statistics': t('nav.statistics'),
        '/settings': t('nav.settings'),
    }

    const pageTitle = (pathname: string) => {
        if (titles[pathname]) return titles[pathname]
        const match = Object.keys(titles)
            .filter((p) => p !== '/')
            .find((p) => pathname.startsWith(p))
        return match ? titles[match] : 'Jetlog'
    }

    return (
        <div className="min-h-full flex flex-col">
            <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-rule">
                <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-3 min-w-0">
                        <Link
                            to="/"
                            className="font-mono font-bold text-ink tracking-board uppercase text-base shrink-0"
                        >
                            Jet<span className="text-accent-deep">log</span>
                        </Link>
                        <span className="text-ink-faint shrink-0">/</span>
                        <span className="board-label truncate">
                            {pageTitle(location.pathname)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <BoardClock />
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label={t('common.openMenu')}
                            className="p-1.5 -mr-1.5 text-ink hover:text-accent-deep"
                        >
                            <Menu size={22} strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 min-h-0">
                <Outlet />
            </main>

            <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
        </div>
    )
}
