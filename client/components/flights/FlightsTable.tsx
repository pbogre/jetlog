import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { SortingState } from '@tanstack/react-table'

import type { Flight } from '@/models'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatDistance, formatDuration, formatTime, airportCode } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
    FLIGHT_COLUMNS,
    COLUMN_INDEX,
    type FlightColumnDef,
} from '@/lib/flightColumns'
import type { ColumnPref } from '@/storage/columnsStorage'

interface FlightsTableProps {
    flights: Flight[] | undefined
    isLoading: boolean
    sorting: SortingState
    setSorting: (s: SortingState) => void
    metric: boolean
    columnPrefs: ColumnPref[]
}

export function FlightsTable({
    flights,
    isLoading,
    sorting,
    setSorting,
    metric,
    columnPrefs,
}: FlightsTableProps) {
    const navigate = useNavigate()

    const visibleColumns = useMemo<FlightColumnDef[]>(() => {
        // Use prefs order, fall back to registry order for unknowns.
        const fromPrefs = columnPrefs
            .filter((p) => p.visible && COLUMN_INDEX[p.id])
            .map((p) => COLUMN_INDEX[p.id])
        return fromPrefs.length > 0 ? fromPrefs : FLIGHT_COLUMNS.filter((c) => c.defaultVisible)
    }, [columnPrefs])

    const currentSort = sorting[0]
    const toggleSort = (key: string) => {
        if (currentSort?.id === key) {
            setSorting([{ id: key, desc: !currentSort.desc }])
        } else {
            setSorting([{ id: key, desc: true }])
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        )
    }

    if (!flights || flights.length === 0) {
        return (
            <div className="text-center text-ink-muted text-sm font-mono py-16">
                No flights found.
            </div>
        )
    }

    return (
        <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-paper-soft border-y border-rule">
                        <tr>
                            {visibleColumns.map((col) => {
                                const sortable = !!col.sortable
                                const sortedDesc =
                                    sortable && currentSort?.id === col.sortable
                                        ? currentSort.desc
                                        : undefined
                                return (
                                    <th
                                        key={col.id}
                                        onClick={
                                            sortable ? () => toggleSort(col.sortable!) : undefined
                                        }
                                        className={cn(
                                            'board-label text-left px-3 h-10 select-none whitespace-nowrap',
                                            col.numeric && 'text-right',
                                            sortable && 'cursor-pointer hover:text-ink',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1',
                                                col.numeric && 'justify-end w-full',
                                            )}
                                        >
                                            {col.label}
                                            {sortable && sortedDesc === undefined && (
                                                <ArrowUpDown size={11} className="opacity-40" />
                                            )}
                                            {sortable && sortedDesc === false && (
                                                <ArrowUp size={11} />
                                            )}
                                            {sortable && sortedDesc === true && (
                                                <ArrowDown size={11} />
                                            )}
                                        </span>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {flights.map((flight, i) => (
                            <tr
                                key={flight.id}
                                onClick={() => navigate(`/flights?id=${flight.id}`)}
                                className={cn(
                                    'cursor-pointer border-b border-rule transition-colors',
                                    i % 2 === 0 ? 'bg-paper' : 'bg-paper-stripe',
                                    'hover:bg-accent-soft/40',
                                )}
                            >
                                {visibleColumns.map((col) => (
                                    <td
                                        key={col.id}
                                        className={cn(
                                            'px-3 py-2.5 font-mono text-sm whitespace-nowrap',
                                            col.numeric && 'text-right tabular-nums',
                                            col.id === 'notes' && 'max-w-[280px] truncate',
                                        )}
                                    >
                                        {col.render(flight, { metric })}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards (compact, doesn't honor column prefs) */}
            <div className="md:hidden divide-y divide-rule">
                {flights.map((f, i) => (
                    <button
                        key={f.id}
                        onClick={() => navigate(`/flights?id=${f.id}`)}
                        className={cn(
                            'w-full text-left p-4 transition-colors',
                            i % 2 === 0 ? 'bg-paper' : 'bg-paper-stripe',
                            'hover:bg-accent-soft/40',
                        )}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono tabular-nums text-xs text-ink-muted">
                                {f.date}
                            </span>
                            {f.ticketClass && (
                                <Badge variant="muted">{f.ticketClass}</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                            <span className="text-xl font-semibold tracking-board">
                                {airportCode(f.origin)}
                            </span>
                            <ArrowRight size={14} className="text-ink-faint" />
                            <span className="text-xl font-semibold tracking-board">
                                {airportCode(f.destination)}
                            </span>
                            <span className="ml-auto text-ink-muted tabular-nums text-xs">
                                {formatTime(f.departureTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs font-mono text-ink-muted tabular-nums">
                            <span>{formatDuration(f.duration)}</span>
                            <span>·</span>
                            <span>{formatDistance(f.distance, metric)}</span>
                            {f.airline && (
                                <>
                                    <span>·</span>
                                    <span>{f.airline.iata || f.airline.icao}</span>
                                </>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </>
    )
}
