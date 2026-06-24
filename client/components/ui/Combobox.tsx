import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ComboboxOption<T = unknown> {
    value: string
    label: string
    sub?: string
    raw?: T
}

interface ComboboxProps<T> {
    value?: string
    placeholder?: string
    onSearch: (query: string) => Promise<ComboboxOption<T>[]>
    onSelect: (option: ComboboxOption<T>) => void
    displayValue?: string
    disabled?: boolean
    minChars?: number
    className?: string
}

export function Combobox<T>({
    placeholder = 'Search...',
    onSearch,
    onSelect,
    displayValue,
    disabled,
    minChars = 2,
    className,
}: ComboboxProps<T>) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [options, setOptions] = useState<ComboboxOption<T>[]>([])
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef<number | null>(null)

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current)
        if (query.length < minChars) {
            setOptions([])
            return
        }
        setLoading(true)
        debounceRef.current = window.setTimeout(async () => {
            try {
                const results = await onSearch(query)
                setOptions(results)
            } finally {
                setLoading(false)
            }
        }, 200)
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current)
        }
    }, [query, minChars, onSearch])

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'h-10 w-full px-3 bg-paper border border-rule flex items-center justify-between gap-2 font-mono text-sm text-left',
                        'hover:border-ink focus:border-ink focus:outline-none',
                        'disabled:opacity-50',
                        className,
                    )}
                >
                    <span className={cn(displayValue ? 'text-ink truncate' : 'text-ink-faint')}>
                        {displayValue || placeholder}
                    </span>
                    <ChevronDown size={14} className="text-ink-muted shrink-0" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={4}
                    className="z-50 w-[var(--radix-popover-trigger-width)] bg-paper border border-ink shadow-paper animate-fade-in"
                >
                    <div className="flex items-center gap-2 border-b border-rule px-3 h-10">
                        <Search size={14} className="text-ink-muted" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent font-mono text-sm focus:outline-none"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {query.length < minChars && (
                            <p className="px-3 py-3 text-xs text-ink-muted">
                                Type at least {minChars} characters
                            </p>
                        )}
                        {loading && (
                            <p className="px-3 py-3 text-xs text-ink-muted">Searching...</p>
                        )}
                        {!loading && query.length >= minChars && options.length === 0 && (
                            <p className="px-3 py-3 text-xs text-ink-muted">No results</p>
                        )}
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onSelect(opt)
                                    setOpen(false)
                                    setQuery('')
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-accent-soft/40 border-b border-rule last:border-b-0"
                            >
                                <div className="font-mono text-sm text-ink">{opt.label}</div>
                                {opt.sub && (
                                    <div className="font-mono text-[11px] text-ink-muted truncate">
                                        {opt.sub}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}
