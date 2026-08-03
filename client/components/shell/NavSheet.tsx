import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Home, PlaneTakeoff, Plus, BarChart3, Settings as Cog, LogOut, X, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import TokenStorage from '@/storage/tokenStorage'
import { useCurrentUser } from '@/lib/queries'

interface NavSheetProps {
    open: boolean
    onClose: () => void
}

export function NavSheet({ open, onClose }: NavSheetProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const { data: me } = useCurrentUser()
    const { t } = useTranslation()

    const NAV_ITEMS = [
        { to: '/', label: t('nav.home'), icon: Home },
        { to: '/flights', label: t('nav.flights'), icon: PlaneTakeoff },
        { to: '/new', label: t('nav.newFlight'), icon: Plus },
        { to: '/statistics', label: t('nav.statistics'), icon: BarChart3 },
        { to: '/settings', label: t('nav.settings'), icon: Cog },
    ]

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    const handleLogout = () => {
        TokenStorage.clearToken()
        qc.clear()
        onClose()
        navigate('/login')
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-ink/30 animate-fade-in"
                onClick={onClose}
                aria-hidden
            />
            <aside
                role="dialog"
                aria-label={t('common.navigation')}
                className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] bg-paper border-l border-rule shadow-paper animate-slide-in-right flex flex-col"
            >
                <div className="flex items-center justify-between px-5 h-14 border-b border-rule">
                    <span className="board-label">{t('common.menu')}</span>
                    <button
                        onClick={onClose}
                        aria-label={t('common.closeMenu')}
                        className="p-1 -mr-1 hover:text-accent-deep"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-2">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                        const active =
                            to === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(to)
                        return (
                            <Link
                                key={to}
                                to={to}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-5 py-3.5 border-l-2 transition-colors',
                                    active
                                        ? 'border-accent bg-accent-soft/40 text-ink'
                                        : 'border-transparent text-ink-soft hover:bg-paper-soft',
                                )}
                            >
                                <Icon size={18} strokeWidth={1.75} />
                                <span className="font-mono uppercase tracking-board text-sm">
                                    {label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-rule p-3 space-y-1">
                    {me && (
                        <div className="flex items-center gap-3 px-2 py-2 min-w-0">
                            <div className="h-7 w-7 border border-ink bg-accent flex items-center justify-center shrink-0">
                                <UserRound size={14} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <div className="board-label text-ink-muted leading-none">
                                    {t('common.signedInAs')}
                                </div>
                                <div className="font-mono text-sm text-ink truncate">
                                    {me.username}
                                    {me.isAdmin && (
                                        <span className="ml-2 text-[10px] uppercase tracking-board text-accent-deep">
                                            {t('common.admin')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-ink-soft hover:text-danger transition-colors"
                    >
                        <LogOut size={18} strokeWidth={1.75} />
                        <span className="font-mono uppercase tracking-board text-sm">
                            {t('common.logout')}
                        </span>
                    </button>
                </div>
            </aside>
        </div>
    )
}
