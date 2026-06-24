import { useMemo } from 'react'
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from 'react-simple-maps'
import { useDecorations, useWorldGeography } from '@/api/queries'
import ConfigStorage from '@/storage/configStorage'

interface WorldMapProps {
    flightId?: number
    className?: string
    interactive?: boolean
}

const MAP_W = 1000
const MAP_H = 480

const COLORS = {
    land: '#EFE7CE',
    landStroke: '#14130F',
    visited: '#F5C518',
    visitedStroke: '#C99A00',
    line: '#14130F',
    marker: '#14130F',
    markerRing: '#F5C518',
}

export function WorldMap({ flightId, className, interactive = true }: WorldMapProps) {
    const showVisited = ConfigStorage.getSetting('showVisitedCountries') === 'true'
    const freqMarker = ConfigStorage.getSetting('frequencyBasedMarker') === 'true'
    const freqLine = ConfigStorage.getSetting('frequencyBasedLine') === 'true'
    const restrict = ConfigStorage.getSetting('restrictWorldMap') === 'true'

    const { data: world } = useWorldGeography(showVisited)
    const { data: decor } = useDecorations(flightId)

    const lines = decor?.lines ?? []
    const markers = decor?.markers ?? []

    const { initialZoom, center } = useMemo(() => {
        if (!restrict || markers.length < 2) {
            return { initialZoom: 1, center: [0, 0] as [number, number] }
        }
        const lats = markers.map((m) => m.latitude)
        const lons = markers.map((m) => m.longitude)
        const south = Math.min(...lats)
        const north = Math.max(...lats)
        const west = Math.min(...lons)
        const east = Math.max(...lons)
        const maxSpan = Math.max(east - west, north - south)
        const z = Math.min(150 / maxSpan, 3)
        if (z < 1) return { initialZoom: 1, center: [0, 0] as [number, number] }
        return {
            initialZoom: z,
            center: [(west + east) / 2, (south + north) / 2] as [number, number],
        }
    }, [markers, restrict])

    return (
        <div className={className}>
            <ComposableMap width={MAP_W} height={MAP_H} style={{ width: '100%', height: 'auto', display: 'block' }}>
                <ZoomableGroup
                    zoom={initialZoom}
                    center={center}
                    maxZoom={interactive ? 10 : 1}
                    minZoom={1}
                    filterZoomEvent={() => interactive}
                    translateExtent={[
                        [0, 0],
                        [MAP_W, MAP_H],
                    ]}
                >
                    {world && (
                        <Geographies geography={world as any}>
                            {({ geographies }) =>
                                geographies.map((geo: any) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        stroke={geo.properties.visited ? COLORS.visitedStroke : COLORS.landStroke}
                                        strokeWidth={geo.properties.visited ? 0.5 : 0.3}
                                        fill={geo.properties.visited ? COLORS.visited : COLORS.land}
                                        style={{
                                            default: { outline: 'none' },
                                            hover: { outline: 'none', fill: geo.properties.visited ? '#FBE680' : '#F0EBDC' },
                                            pressed: { outline: 'none' },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>
                    )}

                    {lines.map((line, i) => (
                        <Line
                            key={`l-${i}`}
                            from={[line.first.longitude, line.first.latitude]}
                            to={[line.second.longitude, line.second.latitude]}
                            stroke={COLORS.line}
                            strokeOpacity={0.55}
                            strokeWidth={freqLine ? Math.min(0.6 + line.frequency * 0.25, 3) : 0.8}
                            strokeLinecap="round"
                        />
                    ))}

                    {markers.map((marker, i) => {
                        const r = freqMarker ? Math.min(2 + marker.frequency * 0.4, 5.5) : 2.5
                        return (
                            <Marker key={`m-${i}`} coordinates={[marker.longitude, marker.latitude]}>
                                <circle r={r + 0.8} fill={COLORS.markerRing} opacity={0.9} />
                                <circle r={r} fill={COLORS.marker} />
                            </Marker>
                        )
                    })}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    )
}

interface SingleFlightMapProps {
    flightId: number
    distance: number
    className?: string
}

export function SingleFlightMap({ flightId, distance, className }: SingleFlightMapProps) {
    const { data: decor } = useDecorations(flightId)
    const lines = decor?.lines ?? []
    const markers = decor?.markers ?? []

    if (lines.length === 0 || markers.length < 2) return null

    // spherical midpoint
    const toRad = (d: number) => (d * Math.PI) / 180
    const toDeg = (r: number) => (r * 180) / Math.PI
    const p1 = markers[0]
    const p2 = markers[1]
    const lat1 = toRad(p1.latitude)
    const lon1 = toRad(p1.longitude)
    const lat2 = toRad(p2.latitude)
    const lon2 = toRad(p2.longitude)
    const x = (Math.cos(lat1) * Math.cos(lon1) + Math.cos(lat2) * Math.cos(lon2)) / 2
    const y = (Math.cos(lat1) * Math.sin(lon1) + Math.cos(lat2) * Math.sin(lon2)) / 2
    const z = (Math.sin(lat1) + Math.sin(lat2)) / 2
    const cLon = toDeg(Math.atan2(y, x))
    const cLat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))
    const scale = Math.min(20000 / Math.max(distance, 1), 10) * 160

    return (
        <div className={className}>
            <ComposableMap
                width={MAP_W}
                height={MAP_H}
                projectionConfig={{ scale, rotate: [-cLon, -cLat, 0] }}
                style={{ width: '100%', height: 'auto', display: 'block' }}
            >
                {lines.map((line, i) => (
                    <Line
                        key={`l-${i}`}
                        from={[line.first.longitude, line.first.latitude]}
                        to={[line.second.longitude, line.second.latitude]}
                        stroke={COLORS.line}
                        strokeWidth={0.6}
                        strokeLinecap="round"
                    />
                ))}
                {markers.map((m, i) => (
                    <Marker key={`m-${i}`} coordinates={[m.longitude, m.latitude]}>
                        <circle r={2.4} fill={COLORS.markerRing} />
                        <circle r={1.4} fill={COLORS.marker} />
                    </Marker>
                ))}
            </ComposableMap>
        </div>
    )
}
