export function formatDuration(minutes?: number | null): string {
    if (!minutes) return '—'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function formatDistance(value?: number | null, metric: boolean = true): string {
    if (!value) return '—'
    return `${value.toLocaleString('en-US')} ${metric ? 'km' : 'mi'}`
}

export function formatTime(time?: string | null): string {
    if (!time) return '—'
    return time.slice(0, 5)
}

export function formatDate(date?: string | null): string {
    if (!date) return '—'
    return date
}

export function airportCode(
    code?: { iata?: string; icao?: string } | string | null,
): string {
    if (!code) return '—'
    if (typeof code === 'string') return code
    return code.iata || code.icao || '—'
}
