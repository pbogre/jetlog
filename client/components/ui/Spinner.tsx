import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'inline-block h-4 w-4 border-2 border-ink-faint border-t-ink animate-spin',
                className,
            )}
            role="status"
            aria-label="Loading"
        />
    )
}
