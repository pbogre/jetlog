import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseQueryOptions,
} from '@tanstack/react-query'
import API, { ENABLE_EXTERNAL_APIS } from '@/api'
import type { Flight, Airport, Airline, Statistics, User, Coord, Trajectory } from '@/models'
import { camelize } from './normalize'

export { ENABLE_EXTERNAL_APIS }

async function getJSON<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const data = await API.get(endpoint, params)
    return camelize<T>(data)
}

// ---------- Users ----------

export function useCurrentUser() {
    return useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: () => getJSON<User>('/users/me'),
        staleTime: 5 * 60_000,
    })
}

export function useUsernames() {
    return useQuery<string[]>({
        queryKey: ['users'],
        queryFn: () => API.get('/users'),
        staleTime: 60_000,
    })
}

// ---------- Flights ----------

export interface FlightsFilters {
    limit?: number
    offset?: number
    order?: 'ASC' | 'DESC'
    sort?: 'date' | 'duration' | 'distance' | 'seat'
    start?: string
    end?: string
    username?: string
    metric?: boolean
}

export function useFlights(filters: FlightsFilters) {
    return useQuery<Flight[]>({
        queryKey: ['flights', filters],
        queryFn: () => getJSON<Flight[]>('/flights', filters as Record<string, unknown>),
    })
}

export function useFlight(id?: number) {
    return useQuery<Flight>({
        queryKey: ['flight', id],
        queryFn: () => getJSON<Flight>('/flights', { id }),
        enabled: id !== undefined && id !== null,
    })
}

export function useDeleteFlight() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => API.delete(`/flights?id=${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['flights'] }),
    })
}

// ---------- Statistics ----------

export interface StatsFilters {
    start?: string
    end?: string
    username?: string
    metric?: boolean
}

export function useStatistics(filters: StatsFilters = {}, options?: UseQueryOptions<Statistics>) {
    return useQuery<Statistics>({
        queryKey: ['statistics', filters],
        queryFn: () => getJSON<Statistics>('/statistics', filters as Record<string, unknown>),
        ...options,
    })
}

// ---------- Geography ----------

export function useWorldGeography(visited: boolean) {
    return useQuery({
        queryKey: ['geo', 'world', visited],
        queryFn: () => API.get('/geography/world', { visited }),
        staleTime: 10 * 60_000,
    })
}

export interface Decorations {
    lines: Trajectory[]
    markers: Coord[]
}

export function useDecorations(flightId?: number) {
    return useQuery<Decorations>({
        queryKey: ['geo', 'decorations', flightId],
        queryFn: async () => {
            const raw = await API.get(
                '/geography/decorations',
                flightId ? { flight_id: flightId } : {},
            )
            // Backend returns a tuple: [lines, markers]
            const [lines, markers] = Array.isArray(raw) ? raw : [[], []]
            return {
                lines: camelize<Trajectory[]>(lines ?? []),
                markers: camelize<Coord[]>(markers ?? []),
            }
        },
        staleTime: 60_000,
    })
}

// ---------- Airports / Airlines ----------

export function searchAirports(q: string): Promise<Airport[]> {
    return getJSON<Airport[]>('/airports', { q })
}

export function searchAirlines(q: string): Promise<Airline[]> {
    return getJSON<Airline[]>('/airlines', { q })
}

export function fetchAirport(icao: string): Promise<Airport> {
    return getJSON<Airport>(`/airports/${icao}`)
}

export function fetchAirline(icao: string): Promise<Airline> {
    return getJSON<Airline>(`/airlines/${icao}`)
}
