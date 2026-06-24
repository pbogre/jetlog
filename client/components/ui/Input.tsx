import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                'h-10 w-full bg-paper border border-rule px-3 font-mono text-sm text-ink',
                'placeholder:text-ink-faint',
                'focus:border-ink focus:outline-none',
                'disabled:opacity-50 disabled:bg-paper-soft',
                'tabular-nums',
                className,
            )}
            {...props}
        />
    ),
)
Input.displayName = 'Input'
