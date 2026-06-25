import type { ReactNode } from 'react'
import type { Flight } from '@/models'
import { formatDistance, formatDuration, formatTime, airportCode } from '@/lib/format'

export type FlightSortKey = 'date' | 'duration' | 'distance' | 'seat'

export interface FlightColumnDef {
    id: string
    label: string
    sortable?: FlightSortKey
    required?: boolean
    defaultVisible: boolean
    /** Right-aligned numeric columns get tabular treatment in the table. */
    numeric?: boolean
    render: (flight: Flight, ctx: { metric: boolean }) => ReactNode
}

const dash = '—'

export const FLIGHT_COLUMNS: FlightColumnDef[] = [
    {
        id: 'date',
        label: 'Date',
        sortable: 'date',
        required: true,
        defaultVisible: true,
        render: (f) => f.date || dash,
    },
    {
        id: 'origin',
        label: 'Origin',
        required: true,
        defaultVisible: true,
        render: (f) => airportCode(f.origin),
    },
    {
        id: 'destination',
        label: 'Destination',
        required: true,
        defaultVisible: true,
        render: (f) => airportCode(f.destination),
    },
    {
        id: 'departureTime',
        label: 'Departure',
        defaultVisible: true,
        render: (f) => formatTime(f.departureTime),
    },
    {
        id: 'arrivalTime',
        label: 'Arrival',
        defaultVisible: true,
        render: (f) => formatTime(f.arrivalTime),
    },
    {
        id: 'arrivalDate',
        label: 'Arrival date',
        defaultVisible: false,
        render: (f) => f.arrivalDate || dash,
    },
    {
        id: 'duration',
        label: 'Duration',
        sortable: 'duration',
        defaultVisible: true,
        numeric: true,
        render: (f) => formatDuration(f.duration),
    },
    {
        id: 'distance',
        label: 'Distance',
        sortable: 'distance',
        defaultVisible: true,
        numeric: true,
        render: (f, { metric }) => formatDistance(f.distance, metric),
    },
    {
        id: 'seat',
        label: 'Seat',
        sortable: 'seat',
        defaultVisible: true,
        render: (f) => f.seat || dash,
    },
    {
        id: 'aircraftSide',
        label: 'Side',
        defaultVisible: false,
        render: (f) => f.aircraftSide || dash,
    },
    {
        id: 'ticketClass',
        label: 'Class',
        defaultVisible: true,
        render: (f) => f.ticketClass || dash,
    },
    {
        id: 'purpose',
        label: 'Purpose',
        defaultVisible: false,
        render: (f) => f.purpose || dash,
    },
    {
        id: 'airline',
        label: 'Airline',
        defaultVisible: true,
        render: (f) => (f.airline ? f.airline.iata || f.airline.icao : dash),
    },
    {
        id: 'airplane',
        label: 'Airplane',
        defaultVisible: false,
        render: (f) => f.airplane || dash,
    },
    {
        id: 'tailNumber',
        label: 'Tail number',
        defaultVisible: false,
        render: (f) => f.tailNumber || dash,
    },
    {
        id: 'flightNumber',
        label: 'Flight number',
        defaultVisible: false,
        render: (f) => f.flightNumber || dash,
    },
    {
        id: 'username',
        label: 'User',
        defaultVisible: false,
        render: (f) => f.username || dash,
    },
    {
        id: 'notes',
        label: 'Notes',
        defaultVisible: false,
        render: (f) => f.notes || dash,
    },
    {
        id: 'connection',
        label: 'Connection',
        defaultVisible: false,
        numeric: true,
        render: (f) => (f.connection ? `#${f.connection}` : dash),
    },
    {
        id: 'id',
        label: 'Flight ID',
        defaultVisible: false,
        numeric: true,
        render: (f) => `#${f.id}`,
    },
]

export const COLUMN_INDEX = Object.fromEntries(FLIGHT_COLUMNS.map((c) => [c.id, c]))

export const REQUIRED_COLUMN_IDS = FLIGHT_COLUMNS.filter((c) => c.required).map((c) => c.id)
