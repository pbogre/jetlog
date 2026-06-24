import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plane } from 'lucide-react'

import { useFlights, useStatistics } from '@/api/queries'

const WorldMap = lazy(() =>
    import('@/components/map/WorldMap').then((m) => ({ default: m.WorldMap })),
)
import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'
import { SplitFlap } from '@/components/ui/SplitFlap'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import ConfigStorage from '@/storage/configStorage'
import type { Flight } from '@/models'

function formatNumber(n: number) {
    return n.toLocaleString('en-US')
}

interface StatCellProps {
    label: string
    value: string
    unit?: string
    delay?: number
}

function StatCell({ label, value, unit, delay = 0 }: StatCellProps) {
    return (
        <div className="px-5 py-4 border-r border-rule last:border-r-0 flex-1 min-w-[140px]">
            <div className="board-label mb-2">{label}</div>
            <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-semibold text-3xl md:text-4xl text-ink tabular-nums leading-none">
                    <SplitFlap value={value} delay={delay} />
                </span>
                {unit && <span className="board-label">{unit}</span>}
            </div>
        </div>
    )
}

function CountersStrip() {
    const metric = ConfigStorage.getSetting('metricUnits') !== 'false'
    const { data: stats, isLoading } = useStatistics({ metric })

    if (isLoading || !stats) {
        return (
            <Panel className="h-[110px] flex items-center justify-center">
                <Spinner />
            </Panel>
        )
    }

    return (
        <Panel className="overflow-x-auto">
            <div className="flex divide-x divide-rule min-w-max">
                <StatCell label="Flights" value={formatNumber(stats.totalFlights)} delay={0} />
                <StatCell label="Airports" value={formatNumber(stats.totalUniqueAirports)} delay={80} />
                <StatCell
                    label="Hours"
                    value={formatNumber(Math.round(stats.totalDuration / 60))}
                    delay={160}
                />
                <StatCell
                    label="Distance"
                    value={formatNumber(stats.totalDistance)}
                    unit={metric ? 'km' : 'mi'}
                    delay={240}
                />
                <StatCell
                    label="Countries"
                    value={formatNumber(stats.visitedCountries)}
                    delay={320}
                />
            </div>
        </Panel>
    )
}

function RecentFlightRow({ flight }: { flight: Flight }) {
    const origin = flight.origin?.iata || flight.origin?.icao || '—'
    const dest = flight.destination?.iata || flight.destination?.icao || '—'
    const dep = flight.departureTime?.slice(0, 5) || '—'
    return (
        <Link
            to={`/flights?id=${flight.id}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-rule last:border-b-0 odd:bg-paper even:bg-paper-soft/50 hover:bg-accent-soft/40 transition-colors"
        >
            <span className="font-mono text-xs text-ink-muted tabular-nums w-20 shrink-0">
                {flight.date}
            </span>
            <span className="font-mono font-semibold text-sm tabular-nums tracking-board">
                {origin}
            </span>
            <ArrowRight size={12} className="text-ink-faint" />
            <span className="font-mono font-semibold text-sm tabular-nums tracking-board">
                {dest}
            </span>
            <span className="font-mono text-xs text-ink-muted tabular-nums ml-auto hidden sm:inline">
                {dep}
            </span>
            <Badge variant="muted" className="hidden md:inline-flex">
                {flight.airline?.iata || flight.airline?.icao || '—'}
            </Badge>
        </Link>
    )
}

function RecentFlights() {
    const { data: flights, isLoading } = useFlights({
        limit: 5,
        sort: 'date',
        order: 'descending',
    })

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>Recent flights</PanelTitle>
                <Link
                    to="/flights"
                    className="board-label text-ink-muted hover:text-ink flex items-center gap-1"
                >
                    All flights <ArrowRight size={12} />
                </Link>
            </PanelHeader>
            {isLoading ? (
                <PanelBody className="flex justify-center">
                    <Spinner />
                </PanelBody>
            ) : flights && flights.length > 0 ? (
                <div>
                    {flights.map((f) => (
                        <RecentFlightRow key={f.id} flight={f} />
                    ))}
                </div>
            ) : (
                <PanelBody className="text-center text-ink-muted text-sm py-10">
                    <Plane className="mx-auto mb-2 text-ink-faint" size={28} strokeWidth={1.5} />
                    No flights yet. <Link to="/new" className="text-accent-deep underline">Add your first flight</Link>.
                </PanelBody>
            )}
        </Panel>
    )
}

export default function Home() {
    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
            <CountersStrip />

            <Panel>
                <PanelHeader>
                    <PanelTitle>World map</PanelTitle>
                    <span className="board-label text-ink-muted hidden sm:inline">
                        Visited airports & routes
                    </span>
                </PanelHeader>
                <Suspense
                    fallback={
                        <div className="flex justify-center py-16">
                            <Spinner />
                        </div>
                    }
                >
                    <WorldMap className="bg-paper-soft/30" />
                </Suspense>
            </Panel>

            <RecentFlights />
        </div>
    )
}
