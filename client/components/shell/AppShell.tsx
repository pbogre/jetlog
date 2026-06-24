import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NavSheet } from './NavSheet'
import { BoardClock } from './BoardClock'

const TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/flights': 'Flights',
    '/new': 'New Flight',
    '/statistics': 'Statistics',
    '/settings': 'Settings',
}

function pageTitle(pathname: string) {
    if (TITLES[pathname]) return TITLES[pathname]
    const match = Object.keys(TITLES)
        .filter((p) => p !== '/')
        .find((p) => pathname.startsWith(p))
    return match ? TITLES[match] : 'Jetlog'
}

export function AppShell() {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

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
                        <BoardClock />
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
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
