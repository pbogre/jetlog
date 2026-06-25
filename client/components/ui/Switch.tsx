import * as RSwitch from '@radix-ui/react-switch'
import { cn } from '@/lib/cn'

interface SwitchProps {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    id?: string
    'aria-label'?: string
}

export function Switch(props: SwitchProps) {
    return (
        <RSwitch.Root
            {...props}
            className={cn(
                'relative inline-flex items-center h-5 w-9 shrink-0 border border-ink bg-paper-soft transition-colors px-[2px]',
                'data-[state=checked]:bg-accent data-[state=checked]:border-accent-deep',
                'disabled:opacity-50 disabled:pointer-events-none',
            )}
        >
            <RSwitch.Thumb
                className={cn(
                    'block h-3 w-3 bg-ink transition-transform',
                    'data-[state=checked]:translate-x-[16px]',
                )}
            />
        </RSwitch.Root>
    )
}
