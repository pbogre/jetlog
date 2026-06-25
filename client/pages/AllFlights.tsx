import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SortingState } from '@tanstack/react-table'

import { FlightsTable } from '@/components/flights/FlightsTable'
import { FlightFiltersBar } from '@/components/flights/FlightFilters'
import { FlightDetail } from '@/components/flights/FlightDetail'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import ConfigStorage from '@/storage/configStorage'
import { useFlights, type FlightsFilters } from '@/lib/queries'

const PAGE_SIZES = [10, 20, 50]

export default function AllFlights() {
    const [searchParams] = useSearchParams()
    const flightId = searchParams.get('id')

    if (flightId) {
        return <FlightDetail flightId={Number(flightId)} />
    }

    return <FlightsListPage />
}

function FlightsListPage() {
    const metric = ConfigStorage.getSetting('metricUnits') !== 'false'
    const [filters, setFilters] = useState<FlightsFilters>({})
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
    const [pageSize, setPageSize] = useState(20)
    const [page, setPage] = useState(0)

    // Reset to first page whenever filters, sort, or page size change
    useEffect(() => {
        setPage(0)
    }, [filters, sorting, pageSize])

    // Fetch one extra to detect a next page without a count endpoint
    const queryFilters: FlightsFilters = {
        ...filters,
        metric,
        sort: sorting[0]?.id as FlightsFilters['sort'],
        order: sorting[0]?.desc ? 'DESC' : 'ASC',
        limit: pageSize + 1,
        offset: page * pageSize,
    }
    const { data: rawFlights, isLoading, isFetching } = useFlights(queryFilters)

    const hasNext = (rawFlights?.length ?? 0) > pageSize
    const pageFlights = rawFlights?.slice(0, pageSize)
    const showingCount = pageFlights?.length ?? 0
    const start = showingCount > 0 ? page * pageSize + 1 : 0
    const end = page * pageSize + showingCount

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="font-mono uppercase tracking-board text-base">All flights</h1>
                <Button asChild variant="accent" size="sm">
                    <Link to="/new">
                        <Plus size={13} /> New flight
                    </Link>
                </Button>
            </div>

            <FlightFiltersBar filters={filters} onChange={setFilters} />

            <Panel className="overflow-hidden">
                <FlightsTable
                    flights={pageFlights}
                    isLoading={isLoading}
                    sorting={sorting}
                    setSorting={setSorting}
                    metric={metric}
                />
            </Panel>

            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="board-label text-ink-muted">Per page</label>
                    <Select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="h-8 w-auto min-w-[68px]"
                    >
                        {PAGE_SIZES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select>
                </div>

                <p className="text-xs font-mono text-ink-muted tabular-nums">
                    {showingCount > 0 ? `Showing ${start}–${end}` : 'No results'}
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || isFetching}
                    >
                        <ChevronLeft size={13} /> Prev
                    </Button>
                    <span className="board-label text-ink-muted tabular-nums px-2">
                        Page {page + 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasNext || isFetching}
                    >
                        Next <ChevronRight size={13} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
