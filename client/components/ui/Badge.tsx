import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badge = cva(
    'inline-flex items-center gap-1.5 px-2 py-0.5 font-mono uppercase tracking-board text-[10px] border',
    {
        variants: {
            variant: {
                default: 'bg-paper border-rule text-ink-soft',
                accent: 'bg-accent-soft border-accent-deep text-ink',
                ok: 'bg-paper border-ok text-ok',
                danger: 'bg-paper border-danger text-danger',
                muted: 'bg-paper-soft border-rule text-ink-muted',
            },
        },
        defaultVariants: { variant: 'default' },
    },
)

export interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badge({ variant }), className)} {...props} />
}
