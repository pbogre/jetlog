import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DataBlockProps {
    label: string
    value: ReactNode
    sub?: ReactNode
    className?: string
    valueClassName?: string
}

export function DataBlock({ label, value, sub, className, valueClassName }: DataBlockProps) {
    return (
        <div className={cn('flex flex-col', className)}>
            <span className="board-label">{label}</span>
            <span className={cn('font-mono tabular-nums text-ink leading-tight mt-1', valueClassName)}>
                {value}
            </span>
            {sub && <span className="font-mono text-[11px] text-ink-muted mt-0.5">{sub}</span>}
        </div>
    )
}
