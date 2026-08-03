import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

export type ConflictAction = 'ignore' | 'merge' | 'overwrite'

export interface ImportConflict {
    index: number
    match_id: number | null
    ambiguous: boolean
    conflicts: string[]
    gaps: string[]
    flight: Record<string, unknown>
    existing: Record<string, unknown> | null
}

const FIELD_LABELS: Record<string, string> = {
    date: 'Date',
    origin: 'Origin',
    destination: 'Destination',
    departure_time: 'Departure time',
    arrival_time: 'Arrival time',
    arrival_date: 'Arrival date',
    seat: 'Seat',
    aircraft_side: 'Aircraft side',
    ticket_class: 'Ticket class',
    purpose: 'Purpose',
    duration: 'Duration (min)',
    distance: 'Distance (km)',
    airplane: 'Aircraft',
    airline: 'Airline',
    tail_number: 'Tail number',
    flight_number: 'Flight number',
    notes: 'Notes',
}

function valueLabel(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—'
    return String(value)
}

function flightSummary(flight: Record<string, unknown>): string {
    const date = valueLabel(flight.date)
    const origin = valueLabel(flight.origin)
    const destination = valueLabel(flight.destination)
    const number = flight.flight_number ? String(flight.flight_number) : ''
    return `${date}  ${origin} → ${destination}${number ? `  ·  ${number}` : ''}`
}

interface Props {
    conflicts: ImportConflict[]
    open: boolean
    onClose: () => void
    onConfirm: (decisions: Record<number, ConflictAction>) => void
}

export function ImportConflictsDialog({ conflicts, open, onClose, onConfirm }: Props) {
    const [decisions, setDecisions] = useState<Record<number, ConflictAction>>(() =>
        Object.fromEntries(conflicts.map((c) => [c.index, 'ignore'])),
    )

    // Reset decisions whenever a new conflict set arrives, so choices made
    // for a previous import never leak into the next one (row indices repeat).
    useEffect(() => {
        setDecisions(Object.fromEntries(conflicts.map((c) => [c.index, 'ignore'])))
    }, [conflicts])

    const setAll = (action: ConflictAction) => {
        setDecisions(Object.fromEntries(conflicts.map((c) => [c.index, action])))
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose()
            }}
            title="Conflicting flights"
            description={`${conflicts.length} flight(s) conflict with existing records. Choose how to handle each one.`}
            className="max-w-2xl"
        >
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAll('ignore')}>
                        All ignore
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAll('merge')}>
                        All merge
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAll('overwrite')}>
                        All overwrite
                    </Button>
                </div>

                <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                    {conflicts.map((conflict) => (
                        <div key={conflict.index} className="border border-rule p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-sm text-ink truncate">
                                        {flightSummary(conflict.flight)}
                                    </span>
                                    {conflict.ambiguous && (
                                        <Badge variant="danger">
                                            <AlertTriangle size={10} /> Uncertain match
                                        </Badge>
                                    )}
                                </div>
                                <Select
                                    className="h-8 w-32 shrink-0"
                                    value={decisions[conflict.index]}
                                    onChange={(e) =>
                                        setDecisions((prev) => ({
                                            ...prev,
                                            [conflict.index]: e.target.value as ConflictAction,
                                        }))
                                    }
                                >
                                    <option value="ignore">Ignore</option>
                                    <option value="merge">Merge</option>
                                    <option value="overwrite">Overwrite</option>
                                </Select>
                            </div>

                            {conflict.ambiguous && (
                                <p className="text-xs text-ink-muted font-mono">
                                    No flight number or time to confirm this match — please check before merging or
                                    overwriting.
                                </p>
                            )}

                            {conflict.conflicts.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-mono text-xs">
                                        <thead>
                                            <tr className="text-ink-muted">
                                                <th className="py-0.5 pr-3 font-normal">Field</th>
                                                <th className="py-0.5 pr-3 font-normal">Existing</th>
                                                <th className="py-0.5 font-normal">New</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {conflict.conflicts.map((field) => (
                                                <tr key={field} className="align-top">
                                                    <td className="py-0.5 pr-3 text-ink-soft whitespace-nowrap">
                                                        {FIELD_LABELS[field] ?? field}
                                                    </td>
                                                    <td className="py-0.5 pr-3 text-ink whitespace-nowrap">
                                                        {valueLabel(conflict.existing?.[field])}
                                                    </td>
                                                    <td className="py-0.5 text-ink whitespace-nowrap">
                                                        {valueLabel(conflict.flight[field])}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {conflict.gaps.length > 0 && (
                                <p className="text-xs text-ink-muted font-mono">
                                    Will fill on merge: {conflict.gaps.map((f) => FIELD_LABELS[f] ?? f).join(', ')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="accent" onClick={() => onConfirm(decisions)}>
                        Apply ({conflicts.length})
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
