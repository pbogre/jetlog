import * as RTabs from '@radix-ui/react-tabs'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = RTabs.Root

export const TabsList = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<typeof RTabs.List>
>(({ className, ...props }, ref) => (
    <RTabs.List
        ref={ref}
        className={cn(
            'inline-flex items-stretch border-b border-rule -mb-px',
            className,
        )}
        {...props}
    />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<
    HTMLButtonElement,
    ComponentPropsWithoutRef<typeof RTabs.Trigger>
>(({ className, ...props }, ref) => (
    <RTabs.Trigger
        ref={ref}
        className={cn(
            'px-4 h-10 font-mono uppercase tracking-board text-[11px] text-ink-muted',
            'border-b-2 border-transparent -mb-px',
            'hover:text-ink',
            'data-[state=active]:border-accent data-[state=active]:text-ink',
            'focus-visible:outline-none',
            className,
        )}
        {...props}
    />
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<typeof RTabs.Content>
>(({ className, ...props }, ref) => (
    <RTabs.Content
        ref={ref}
        className={cn('pt-6 focus-visible:outline-none', className)}
        {...props}
    />
))
TabsContent.displayName = 'TabsContent'
