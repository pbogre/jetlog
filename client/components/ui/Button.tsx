import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const button = cva(
    'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-board text-[12px] border transition-colors select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
    {
        variants: {
            variant: {
                default:
                    'bg-paper text-ink border-ink hover:bg-ink hover:text-paper',
                accent:
                    'bg-accent text-ink border-accent-deep hover:bg-accent-deep hover:text-paper',
                ghost:
                    'bg-transparent text-ink border-transparent hover:bg-paper-soft',
                danger:
                    'bg-paper text-danger border-danger hover:bg-danger hover:text-paper',
                outline:
                    'bg-transparent text-ink border-rule hover:border-ink hover:bg-paper-soft',
            },
            size: {
                sm: 'h-7 px-2.5',
                md: 'h-9 px-3.5',
                lg: 'h-11 px-5 text-[13px]',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: { variant: 'default', size: 'md' },
    },
)

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof button> {
    asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return (
            <Comp ref={ref} className={cn(button({ variant, size }), className)} {...props} />
        )
    },
)
Button.displayName = 'Button'
