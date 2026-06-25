import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        const isFile = type === 'file'
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    'h-10 w-full bg-paper border border-rule font-mono text-sm text-ink',
                    'placeholder:text-ink-faint',
                    'focus:border-ink focus:outline-none',
                    'disabled:opacity-50 disabled:bg-paper-soft',
                    'tabular-nums',
                    isFile
                        ? [
                              'pl-0 pr-3 cursor-pointer text-ink-soft',
                              'file:h-full file:mr-3 file:px-3',
                              'file:border-0 file:border-r file:border-rule',
                              'file:bg-paper-soft file:text-ink',
                              'file:font-mono file:uppercase file:tracking-board file:text-[11px]',
                              'hover:file:bg-accent-soft',
                              'file:cursor-pointer',
                          ]
                        : 'px-3',
                    className,
                )}
                {...props}
            />
        )
    },
)
Input.displayName = 'Input'
