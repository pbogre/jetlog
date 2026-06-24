import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'bg-paper border border-rule',
                className,
            )}
            {...props}
        />
    )
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-4 px-4 h-11 border-b border-rule',
                className,
            )}
            {...props}
        />
    )
}

export function PanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2
            className={cn('board-label text-ink', className)}
            {...props}
        />
    )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-4', className)} {...props} />
}
