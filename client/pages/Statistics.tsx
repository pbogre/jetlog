import { useMemo, useState } from 'react'
import { Filter, X } from 'lucide-react'

import { useFlights, useStatistics, useUsernames, type StatsFilters } from '@/api/queries'
import ConfigStorage from '@/storage/configStorage'
import type { Flight } from '@/models'

import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { SplitFlap } from '@/components/ui/SplitFlap'
import {
    FrequencyBarChart,
    FrequencyDonut,
    FlightsPerMonthChart,
    CumulativeDistanceChart,
} from '@/components/stats/Charts'

function formatNum(n: number) {
    return n.toLocaleString('en-US')
}

function StatCell({ label, value, unit, delay = 0 }: { label: string; value: string; unit?: string; delay?: number }) {
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

interface FiltersSheetProps {
    open: boolean
    onOpenChange: (o: boolean) => void
    filters: StatsFilters
    onApply: (f: StatsFilters) => void
}

function FiltersSheet({ open, onOpenChange, filters, onApply }: FiltersSheetProps) {
    const { data: usernames } = useUsernames()
    const [draft, setDraft] = useState<StatsFilters>(filters)

    return (
        <Sheet open={open} onOpenChange={onOpenChange} title="Filter statistics">
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
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            setDraft({})
                            onApply({})
                            onOpenChange(false)
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="accent"
                        className="flex-1"
                        onClick={() => {
                            const clean: StatsFilters = {}
                            for (const [k, v] of Object.entries(draft)) {
                                if (v) (clean as any)[k] = v
                            }
                            onApply(clean)
                            onOpenChange(false)
                        }}
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </Sheet>
    )
}

function useTimeline(flights: Flight[] | undefined) {
    return useMemo(() => {
        if (!flights || flights.length === 0) return []
        const buckets = new Map<string, { flights: number; distance: number }>()
        for (const f of flights) {
            if (!f.date) continue
            const month = f.date.slice(0, 7)
            const cur = buckets.get(month) ?? { flights: 0, distance: 0 }
            cur.flights += 1
            cur.distance += f.distance || 0
            buckets.set(month, cur)
        }
        const months = Array.from(buckets.keys()).sort()
        let cumulative = 0
        return months.map((m) => {
            const b = buckets.get(m)!
            cumulative += b.distance
            return {
                label: m,
                flights: b.flights,
                cumulative,
            }
        })
    }, [flights])
}

export default function Statistics() {
    const metric = ConfigStorage.getSetting('metricUnits') !== 'false'
    const [filters, setFilters] = useState<StatsFilters>({})
    const [filtersOpen, setFiltersOpen] = useState(false)

    const { data: stats, isLoading } = useStatistics({ ...filters, metric })
    const { data: flights } = useFlights({ ...filters, metric, limit: 5000 })
    const timeline = useTimeline(flights)

    const activeCount = Object.values(filters).filter((v) => v).length

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="font-mono uppercase tracking-board text-base">Statistics</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.start && (
                        <Badge variant="accent" className="gap-1.5 pl-2 pr-1 py-1">
                            From {filters.start}
                            <button
                                onClick={() => setFilters({ ...filters, start: undefined })}
                                aria-label="Remove"
                            >
                                <X size={11} />
                            </button>
                        </Badge>
                    )}
                    {filters.end && (
                        <Badge variant="accent" className="gap-1.5 pl-2 pr-1 py-1">
                            To {filters.end}
                            <button
                                onClick={() => setFilters({ ...filters, end: undefined })}
                                aria-label="Remove"
                            >
                                <X size={11} />
                            </button>
                        </Badge>
                    )}
                    {filters.username && (
                        <Badge variant="accent" className="gap-1.5 pl-2 pr-1 py-1">
                            User {filters.username}
                            <button
                                onClick={() => setFilters({ ...filters, username: undefined })}
                                aria-label="Remove"
                            >
                                <X size={11} />
                            </button>
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                        <Filter size={13} />
                        Filters
                        {activeCount > 0 && (
                            <span className="ml-1 bg-accent text-ink px-1.5 text-[10px] font-bold">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {isLoading || !stats ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : (
                <>
                    {/* Top counters */}
                    <Panel className="overflow-x-auto">
                        <div className="flex divide-x divide-rule min-w-max">
                            <StatCell label="Flights" value={formatNum(stats.totalFlights)} delay={0} />
                            <StatCell label="Airports" value={formatNum(stats.totalUniqueAirports)} delay={80} />
                            <StatCell
                                label="Hours"
                                value={formatNum(Math.round(stats.totalDuration / 60))}
                                delay={160}
                            />
                            <StatCell
                                label="Distance"
                                value={formatNum(stats.totalDistance)}
                                unit={metric ? 'km' : 'mi'}
                                delay={240}
                            />
                            <StatCell label="Countries" value={formatNum(stats.visitedCountries)} delay={320} />
                            <StatCell label="Day range" value={formatNum(stats.daysRange)} unit="days" delay={400} />
                        </div>
                    </Panel>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <FlightsPerMonthChart title="Flights per month" data={timeline} />
                        <CumulativeDistanceChart
                            title="Cumulative distance"
                            data={timeline}
                            metric={metric}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <FrequencyBarChart
                            title="Most visited airports"
                            data={stats.mostVisitedAirports as any}
                            label="visits"
                        />
                        <FrequencyBarChart
                            title="Most common airlines"
                            data={stats.mostCommonAirlines as any}
                            label="flights"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        <FrequencyDonut
                            title="Ticket class"
                            data={stats.ticketClassFrequency as any}
                        />
                        <FrequencyDonut title="Seat" data={stats.seatFrequency as any} />
                    </div>

                    <FrequencyBarChart
                        title="Most common countries"
                        data={stats.mostCommonCountries as any}
                        label="flights"
                    />
                </>
            )}

            <FiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                onApply={setFilters}
            />
        </div>
    )
}
