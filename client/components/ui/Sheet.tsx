import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    side?: 'right' | 'bottom'
    children: ReactNode
    className?: string
}

export function Sheet({ open, onOpenChange, title, side = 'right', children, className }: SheetProps) {
    const sideClasses =
        side === 'right'
            ? 'right-0 top-0 h-full w-[92%] max-w-md border-l animate-slide-in-right'
            : 'left-0 right-0 bottom-0 max-h-[85vh] border-t animate-fade-in'

    return (
        <RDialog.Root open={open} onOpenChange={onOpenChange}>
            <RDialog.Portal>
                <RDialog.Overlay className="fixed inset-0 z-50 bg-ink/30 animate-fade-in" />
                <RDialog.Content
                    className={cn(
                        'fixed z-50 bg-paper border-rule shadow-paper flex flex-col',
                        sideClasses,
                        className,
                    )}
                >
                    <div className="flex items-center justify-between gap-4 px-4 h-12 border-b border-rule shrink-0">
                        <RDialog.Title className="board-label text-ink">{title}</RDialog.Title>
                        <RDialog.Close aria-label="Close" className="p-1 -mr-1 hover:text-accent-deep">
                            <X size={18} />
                        </RDialog.Close>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">{children}</div>
                </RDialog.Content>
            </RDialog.Portal>
        </RDialog.Root>
    )
}
