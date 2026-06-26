import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    children: ReactNode
    className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
    return (
        <RDialog.Root open={open} onOpenChange={onOpenChange}>
            <RDialog.Portal>
                <RDialog.Overlay className="fixed inset-0 z-50 bg-ink/30 animate-fade-in" />
                <RDialog.Content
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                        'w-[92vw] max-w-md max-h-[90vh] overflow-y-auto',
                        'bg-paper border border-ink shadow-paper',
                        'animate-fade-in',
                        className,
                    )}
                >
                    <div className="flex items-center justify-between gap-4 px-4 h-11 border-b border-rule">
                        <RDialog.Title className="board-label text-ink">{title}</RDialog.Title>
                        <RDialog.Close
                            aria-label="Close"
                            className="p-1 -mr-1 hover:text-accent-deep"
                        >
                            <X size={18} />
                        </RDialog.Close>
                    </div>
                    {description && (
                        <RDialog.Description className="px-4 pt-3 text-sm text-ink-muted">
                            {description}
                        </RDialog.Description>
                    )}
                    <div className="p-4">{children}</div>
                </RDialog.Content>
            </RDialog.Portal>
        </RDialog.Root>
    )
}
