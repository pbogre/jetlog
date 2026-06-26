import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useUsernames, type FlightsFilters } from '@/lib/queries'

interface FlightFiltersProps {
    filters: FlightsFilters
    onChange: (f: FlightsFilters) => void
}

const ACTIVE_KEYS: (keyof FlightsFilters)[] = ['start', 'end', 'username']

export function FlightFiltersBar({ filters, onChange }: FlightFiltersProps) {
    const [open, setOpen] = useState(false)
    const { data: usernames } = useUsernames()
    const [draft, setDraft] = useState<FlightsFilters>(filters)

    const activeCount = ACTIVE_KEYS.filter((k) => filters[k] !== undefined && filters[k] !== '').length

    const apply = () => {
        const clean: FlightsFilters = {}
        for (const [k, v] of Object.entries(draft)) {
            if (v === '' || v === undefined || v === null) continue
            ;(clean as any)[k] = v
        }
        onChange(clean)
        setOpen(false)
    }

    const clear = () => {
        setDraft({})
        onChange({})
        setOpen(false)
    }

    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.start && (
                        <FilterChip
                            label={`From ${filters.start}`}
                            onClear={() => onChange({ ...filters, start: undefined })}
                        />
                    )}
                    {filters.end && (
                        <FilterChip
                            label={`To ${filters.end}`}
                            onClear={() => onChange({ ...filters, end: undefined })}
                        />
                    )}
                    {filters.username && (
                        <FilterChip
                            label={`User ${filters.username}`}
                            onClear={() => onChange({ ...filters, username: undefined })}
                        />
                    )}
                    {activeCount === 0 && (
                        <span className="board-label text-ink-muted">All flights</span>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setDraft(filters)
                        setOpen(true)
                    }}
                >
                    <Filter size={13} />
                    Filters
                    {activeCount > 0 && (
                        <span className="ml-1 bg-accent text-ink px-1.5 text-[10px] font-bold">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </div>

            <Sheet open={open} onOpenChange={setOpen} title="Filters">
                <div className="space-y-4">
                    <div>
                        <Label>Start date</Label>
                        <Input
                            type="date"
                            value={draft.start ?? ''}
                            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>End date</Label>
                        <Input
                            type="date"
                            value={draft.end ?? ''}
                            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>User</Label>
                        <Select
                            value={draft.username ?? ''}
                            onChange={(e) =>
                                setDraft({ ...draft, username: e.target.value || undefined })
                            }
                        >
                            <option value="">Any user</option>
                            {usernames?.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-rule">
                        <Button variant="outline" onClick={clear} className="flex-1">
                            Clear all
                        </Button>
                        <Button variant="accent" onClick={apply} className="flex-1">
                            Apply
                        </Button>
                    </div>
                </div>
            </Sheet>
        </>
    )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <Badge variant="accent" className="gap-1.5 pl-2 pr-1 py-1">
            {label}
            <button
                onClick={onClear}
                aria-label="Remove filter"
                className="hover:text-danger"
            >
                <X size={11} />
            </button>
        </Badge>
    )
}
