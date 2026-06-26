import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, ...props }, ref) => (
        <div className="relative">
            <select
                ref={ref}
                className={cn(
                    'h-10 w-full appearance-none bg-paper border border-rule px-3 pr-8 font-mono text-sm text-ink',
                    'focus:border-ink focus:outline-none',
                    'disabled:opacity-50',
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
        </div>
    ),
)
Select.displayName = 'Select'
