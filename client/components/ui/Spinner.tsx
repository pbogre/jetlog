import { cn } from '@/lib/cn'
import { useTranslation } from 'react-i18next'

export function Spinner({ className }: { className?: string }) {
    const { t } = useTranslation()

    return (
        <span
            className={cn(
                'inline-block h-4 w-4 border-2 border-ink-faint border-t-ink animate-spin',
                className,
            )}
            role="status"
            aria-label={t('common.loading')}
        />
    )
}
