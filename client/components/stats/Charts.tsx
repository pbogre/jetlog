import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'

const INK = '#14130F'
const RULE = '#D9D2BC'
const ACCENT = '#F5C518'
const PIE_COLORS = ['#F5C518', '#14130F', '#76725F', '#C99A00', '#FBE680', '#A8A48F']

const tooltipStyle = {
    background: '#FAF7F0',
    border: '1px solid #14130F',
    borderRadius: 0,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
    padding: '6px 8px',
}
const labelStyle = { color: INK, fontWeight: 600, textTransform: 'uppercase' as const }

interface FrequencyChartProps {
    title: string
    data: Record<string, number> | undefined
    label?: string
}

export function FrequencyBarChart({ title, data, label = 'count' }: FrequencyChartProps) {
    const entries = Object.entries(data ?? {})
        .map(([name, value]) => ({ name, value }))
        .slice(0, 8)

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
            </PanelHeader>
            <PanelBody className="pt-2">
                {entries.length === 0 ? (
                    <p className="text-center text-ink-muted text-sm py-8 font-mono">
                        No data
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(220, entries.length * 32)}>
                        <BarChart
                            data={entries}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid stroke={RULE} horizontal={false} />
                            <XAxis
                                type="number"
                                stroke={INK}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke={INK}
                                width={140}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(245,197,24,0.1)' }}
                                contentStyle={tooltipStyle}
                                labelStyle={labelStyle}
                                formatter={(v: number) => [`${v} ${label}`, '']}
                            />
                            <Bar dataKey="value" fill={ACCENT} stroke={INK} strokeWidth={1} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </PanelBody>
        </Panel>
    )
}

export function FrequencyDonut({ title, data }: FrequencyChartProps) {
    const entries = Object.entries(data ?? {}).map(([name, value]) => ({ name, value }))
    const total = entries.reduce((sum, e) => sum + e.value, 0)

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
            </PanelHeader>
            <PanelBody>
                {entries.length === 0 ? (
                    <p className="text-center text-ink-muted text-sm py-8 font-mono">
                        No data
                    </p>
                ) : (
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={180}>
                            <PieChart>
                                <Pie
                                    data={entries}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={40}
                                    outerRadius={75}
                                    stroke={INK}
                                    strokeWidth={1}
                                    paddingAngle={1}
                                >
                                    {entries.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelStyle={labelStyle}
                                    formatter={(v: number, n: string) => [
                                        `${v} (${Math.round((v / total) * 100)}%)`,
                                        n,
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className="flex-1 space-y-1.5 min-w-0">
                            {entries.map((e, i) => (
                                <li key={e.name} className="flex items-center gap-2 text-xs font-mono">
                                    <span
                                        className="inline-block h-2.5 w-2.5 border border-ink shrink-0"
                                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                    />
                                    <span className="capitalize truncate flex-1">{e.name}</span>
                                    <span className="text-ink-muted tabular-nums">
                                        {Math.round((e.value / total) * 100)}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </PanelBody>
        </Panel>
    )
}

interface TimelinePoint {
    label: string
    flights: number
    cumulative: number
}
interface TimelineChartProps {
    title: string
    data: TimelinePoint[]
    metric: boolean
}

export function FlightsPerMonthChart({ title, data }: { title: string; data: TimelinePoint[] }) {
    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
            </PanelHeader>
            <PanelBody>
                {data.length === 0 ? (
                    <p className="text-center text-ink-muted text-sm py-8 font-mono">No data</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke={RULE} vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke={INK}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                            />
                            <YAxis
                                stroke={INK}
                                allowDecimals={false}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(245,197,24,0.12)' }}
                                contentStyle={tooltipStyle}
                                labelStyle={labelStyle}
                            />
                            <Bar dataKey="flights" fill={ACCENT} stroke={INK} strokeWidth={1} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </PanelBody>
        </Panel>
    )
}

export function CumulativeDistanceChart({ title, data, metric }: TimelineChartProps) {
    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
                <span className="board-label text-ink-muted">{metric ? 'km' : 'mi'}</span>
            </PanelHeader>
            <PanelBody>
                {data.length === 0 ? (
                    <p className="text-center text-ink-muted text-sm py-8 font-mono">No data</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid stroke={RULE} vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke={INK}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                            />
                            <YAxis
                                stroke={INK}
                                tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: INK }}
                                tickLine={false}
                                axisLine={{ stroke: RULE }}
                                tickFormatter={(v: number) =>
                                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                                }
                            />
                            <Tooltip
                                cursor={{ stroke: ACCENT }}
                                contentStyle={tooltipStyle}
                                labelStyle={labelStyle}
                                formatter={(v: number) => [v.toLocaleString(), '']}
                            />
                            <Line
                                type="monotone"
                                dataKey="cumulative"
                                stroke={INK}
                                strokeWidth={2}
                                dot={{ fill: ACCENT, stroke: INK, r: 3 }}
                                activeDot={{ r: 5, fill: ACCENT, stroke: INK }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </PanelBody>
        </Panel>
    )
}
