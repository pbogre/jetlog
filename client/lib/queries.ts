import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseQueryOptions,
} from '@tanstack/react-query'
import API, { ENABLE_EXTERNAL_APIS } from '@/api'
import type { Flight, Airport, Airline, Statistics, User, Coord, Trajectory } from '@/models'

export { ENABLE_EXTERNAL_APIS }

// ---------- Users ----------

export function useCurrentUser() {
    return useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: () => API.get('/users/me'),
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
        queryFn: () => API.get('/flights', filters),
    })
}

export function useFlight(id?: number) {
    return useQuery<Flight>({
        queryKey: ['flight', id],
        queryFn: () => API.get('/flights', { id }),
        enabled: id !== undefined && id !== null,
    })
}

export function useDeleteFlight() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => API.delete(`/flights/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['flights'] }),
    })
}

export function useUpdateFlight() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Flight> }) =>
            API.patch(`/flights/${id}`, data),
        onSuccess: (_d, { id }) => {
            qc.invalidateQueries({ queryKey: ['flights'] })
            qc.invalidateQueries({ queryKey: ['flight', id] })
        },
    })
}

export function useCreateFlight() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: Partial<Flight>) => API.post('/flights', data),
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
        queryFn: () => API.get('/statistics', filters),
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
    markers: Coord[]
    lines: Trajectory[]
}

export function useDecorations(flightId?: number) {
    return useQuery<Decorations>({
        queryKey: ['geo', 'decorations', flightId],
        queryFn: () =>
            API.get('/geography/decorations', flightId ? { flight_id: flightId } : {}),
        staleTime: 60_000,
    })
}

// ---------- Airports / Airlines ----------

export function searchAirports(q: string): Promise<Airport[]> {
    return API.get('/airports', { q })
}

export function searchAirlines(q: string): Promise<Airline[]> {
    return API.get('/airlines', { q })
}

export function fetchAirport(icao: string): Promise<Airport> {
    return API.get(`/airports/${icao}`)
}

export function fetchAirline(icao: string): Promise<Airline> {
    return API.get(`/airlines/${icao}`)
}
