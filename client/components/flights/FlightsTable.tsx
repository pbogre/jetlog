import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table'

import type { Flight } from '@/models'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatDistance, formatDuration, formatTime, airportCode } from '@/lib/format'
import { cn } from '@/lib/cn'

interface FlightsTableProps {
    flights: Flight[] | undefined
    isLoading: boolean
    sorting: SortingState
    setSorting: (s: SortingState) => void
    metric: boolean
}

export function FlightsTable({ flights, isLoading, sorting, setSorting, metric }: FlightsTableProps) {
    const navigate = useNavigate()

    const columns = useMemo<ColumnDef<Flight>[]>(
        () => [
            {
                accessorKey: 'date',
                header: 'Date',
                cell: ({ row }) => (
                    <span className="text-ink tabular-nums">{row.original.date}</span>
                ),
            },
            {
                id: 'route',
                header: 'Route',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold tracking-board">
                            {airportCode(row.original.origin)}
                        </span>
                        <ArrowRight size={11} className="text-ink-faint" />
                        <span className="font-semibold tracking-board">
                            {airportCode(row.original.destination)}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'departureTime',
                header: 'Dep',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="tabular-nums text-ink-soft">
                        {formatTime(row.original.departureTime)}
                    </span>
                ),
            },
            {
                accessorKey: 'arrivalTime',
                header: 'Arr',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="tabular-nums text-ink-soft">
                        {formatTime(row.original.arrivalTime)}
                    </span>
                ),
            },
            {
                accessorKey: 'duration',
                header: 'Duration',
                cell: ({ row }) => (
                    <span className="tabular-nums text-ink-soft">
                        {formatDuration(row.original.duration)}
                    </span>
                ),
            },
            {
                accessorKey: 'distance',
                header: 'Distance',
                cell: ({ row }) => (
                    <span className="tabular-nums text-ink-soft">
                        {formatDistance(row.original.distance, metric)}
                    </span>
                ),
            },
            {
                accessorKey: 'seat',
                header: 'Seat',
                cell: ({ row }) =>
                    row.original.seat ? (
                        <span className="capitalize text-ink-soft">{row.original.seat}</span>
                    ) : (
                        <span className="text-ink-faint">—</span>
                    ),
            },
            {
                accessorKey: 'ticketClass',
                header: 'Class',
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.ticketClass ? (
                        <Badge variant="muted">{row.original.ticketClass}</Badge>
                    ) : (
                        <span className="text-ink-faint">—</span>
                    ),
            },
            {
                id: 'airline',
                header: 'Airline',
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.airline ? (
                        <span className="text-ink-soft">
                            {row.original.airline.iata || row.original.airline.icao}
                        </span>
                    ) : (
                        <span className="text-ink-faint">—</span>
                    ),
            },
        ],
        [metric],
    )

    const table = useReactTable({
        data: flights ?? [],
        columns,
        state: { sorting },
        onSortingChange: (updater) =>
            setSorting(typeof updater === 'function' ? updater(sorting) : updater),
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
    })

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
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((h) => {
                                    const sortable = h.column.getCanSort()
                                    const sorted = h.column.getIsSorted()
                                    return (
                                        <th
                                            key={h.id}
                                            onClick={
                                                sortable
                                                    ? h.column.getToggleSortingHandler()
                                                    : undefined
                                            }
                                            className={cn(
                                                'board-label text-left px-3 h-10 select-none',
                                                sortable && 'cursor-pointer hover:text-ink',
                                            )}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {flexRender(h.column.columnDef.header, h.getContext())}
                                                {sortable &&
                                                    (sorted === 'asc' ? (
                                                        <ArrowUp size={11} />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown size={11} />
                                                    ) : (
                                                        <ArrowUpDown size={11} className="opacity-40" />
                                                    ))}
                                            </span>
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, i) => (
                            <tr
                                key={row.id}
                                onClick={() => navigate(`/flights?id=${row.original.id}`)}
                                className={cn(
                                    'cursor-pointer border-b border-rule transition-colors',
                                    i % 2 === 0 ? 'bg-paper' : 'bg-paper-stripe',
                                    'hover:bg-accent-soft/40',
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="px-3 py-2.5 font-mono text-sm"
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
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
