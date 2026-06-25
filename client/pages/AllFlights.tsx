import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { SortingState } from '@tanstack/react-table'

import { FlightsTable } from '@/components/flights/FlightsTable'
import { FlightFiltersBar } from '@/components/flights/FlightFilters'
import { FlightDetail } from '@/components/flights/FlightDetail'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import ConfigStorage from '@/storage/configStorage'
import type { FlightsFilters } from '@/lib/queries'

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
    const [filters, setFilters] = useState<FlightsFilters>({ limit: 50 })
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])

    const enrichedFilters: FlightsFilters = {
        ...filters,
        sort: sorting[0]?.id as FlightsFilters['sort'],
        order: sorting[0]?.desc ? 'descending' : 'ascending',
    }

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
                    filters={enrichedFilters}
                    sorting={sorting}
                    setSorting={setSorting}
                    metric={metric}
                />
            </Panel>

            <p className="text-xs font-mono text-ink-muted mt-3">
                Showing at most {filters.limit ?? 50} flights. Adjust filters for more.
            </p>
        </div>
    )
}
