import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import type { Flight } from '@/models'
import { formatDistance, formatDuration, formatTime, airportCode } from '@/lib/format'

export type FlightSortKey = 'date' | 'duration' | 'distance' | 'seat'

export interface FlightColumnDef {
    id: string
    /** Column header label; receives the i18n `t` function so it translates live. */
    label: (t: TFunction) => string
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
        label: (t) => t('columns.date'),
        sortable: 'date',
        required: true,
        defaultVisible: true,
        render: (f) => f.date || dash,
    },
    {
        id: 'origin',
        label: (t) => t('columns.origin'),
        required: true,
        defaultVisible: true,
        render: (f) => airportCode(f.origin),
    },
    {
        id: 'destination',
        label: (t) => t('columns.destination'),
        required: true,
        defaultVisible: true,
        render: (f) => airportCode(f.destination),
    },
    {
        id: 'departureTime',
        label: (t) => t('columns.departure'),
        defaultVisible: true,
        render: (f) => formatTime(f.departureTime),
    },
    {
        id: 'arrivalTime',
        label: (t) => t('columns.arrival'),
        defaultVisible: true,
        render: (f) => formatTime(f.arrivalTime),
    },
    {
        id: 'arrivalDate',
        label: (t) => t('columns.arrivalDate'),
        defaultVisible: false,
        render: (f) => f.arrivalDate || dash,
    },
    {
        id: 'duration',
        label: (t) => t('columns.duration'),
        sortable: 'duration',
        defaultVisible: true,
        numeric: true,
        render: (f) => formatDuration(f.duration),
    },
    {
        id: 'distance',
        label: (t) => t('columns.distance'),
        sortable: 'distance',
        defaultVisible: true,
        numeric: true,
        render: (f, { metric }) => formatDistance(f.distance, metric),
    },
    {
        id: 'seat',
        label: (t) => t('columns.seat'),
        sortable: 'seat',
        defaultVisible: true,
        render: (f) => f.seat || dash,
    },
    {
        id: 'aircraftSide',
        label: (t) => t('columns.side'),
        defaultVisible: false,
        render: (f) => f.aircraftSide || dash,
    },
    {
        id: 'ticketClass',
        label: (t) => t('columns.class'),
        defaultVisible: true,
        render: (f) => f.ticketClass || dash,
    },
    {
        id: 'purpose',
        label: (t) => t('columns.purpose'),
        defaultVisible: false,
        render: (f) => f.purpose || dash,
    },
    {
        id: 'airline',
        label: (t) => t('columns.airline'),
        defaultVisible: true,
        render: (f) => (f.airline ? f.airline.iata || f.airline.icao : dash),
    },
    {
        id: 'airplane',
        label: (t) => t('columns.airplane'),
        defaultVisible: false,
        render: (f) => f.airplane || dash,
    },
    {
        id: 'tailNumber',
        label: (t) => t('columns.tailNumber'),
        defaultVisible: false,
        render: (f) => f.tailNumber || dash,
    },
    {
        id: 'flightNumber',
        label: (t) => t('columns.flightNumber'),
        defaultVisible: false,
        render: (f) => f.flightNumber || dash,
    },
    {
        id: 'username',
        label: (t) => t('columns.user'),
        defaultVisible: false,
        render: (f) => f.username || dash,
    },
    {
        id: 'notes',
        label: (t) => t('columns.notes'),
        defaultVisible: false,
        render: (f) => f.notes || dash,
    },
    {
        id: 'connection',
        label: (t) => t('columns.connection'),
        defaultVisible: false,
        numeric: true,
        render: (f) => (f.connection ? `#${f.connection}` : dash),
    },
    {
        id: 'id',
        label: (t) => t('columns.flightId'),
        defaultVisible: false,
        numeric: true,
        render: (f) => `#${f.id}`,
    },
]

export const COLUMN_INDEX = Object.fromEntries(FLIGHT_COLUMNS.map((c) => [c.id, c]))

export const REQUIRED_COLUMN_IDS = FLIGHT_COLUMNS.filter((c) => c.required).map((c) => c.id)
