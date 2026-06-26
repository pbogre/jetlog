import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
    return (
        <label
            className={cn(
                'block board-label mb-1.5 select-none',
                className,
            )}
            {...props}
        >
            {children}
            {required && <span className="text-danger ml-1">*</span>}
        </label>
    )
}
