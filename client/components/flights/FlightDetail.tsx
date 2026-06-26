import { useState, type FormEvent, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pencil, Trash2, X, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import API from '@/api'
import {
    useCurrentUser,
    useFlight,
    useDeleteFlight,
    searchAirports,
    searchAirlines,
} from '@/lib/queries'
import type { Airport, Airline, Flight } from '@/models'
import ConfigStorage from '@/storage/configStorage'

import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { DataBlock } from '@/components/ui/DataBlock'
const SingleFlightMap = lazy(() =>
    import('@/components/map/WorldMap').then((m) => ({ default: m.SingleFlightMap })),
)

import { formatDuration, formatDistance, formatTime, airportCode } from '@/lib/format'

interface FlightDetailProps {
    flightId: number
}

const SEAT_OPTIONS = ['', 'aisle', 'middle', 'window']
const AIRCRAFT_SIDES = ['', 'left', 'right', 'center']
const CLASSES = ['', 'private', 'first', 'business', 'economy+', 'economy']
const PURPOSES = ['', 'leisure', 'business', 'crew', 'other']

export function FlightDetail({ flightId }: FlightDetailProps) {
    const navigate = useNavigate()
    const metric = ConfigStorage.getSetting('metricUnits') !== 'false'
    const localAirportTime = ConfigStorage.getSetting('localAirportTime') === 'true'
    const { data: flight, isLoading } = useFlight(flightId)
    const { data: me } = useCurrentUser()

    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<Partial<Flight>>({})
    const [saving, setSaving] = useState(false)
    const qc = useQueryClient()

    const deleteMut = useDeleteFlight()

    if (isLoading || !flight) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        )
    }

    const isOwner = me?.username === flight.username

    const enterEdit = () => {
        setDraft({
            date: flight.date,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            arrivalDate: flight.arrivalDate,
            duration: flight.duration,
            origin: flight.origin,
            destination: flight.destination,
            distance: flight.distance,
            seat: flight.seat,
            aircraftSide: flight.aircraftSide,
            ticketClass: flight.ticketClass,
            purpose: flight.purpose,
            airplane: flight.airplane,
            airline: flight.airline,
            tailNumber: flight.tailNumber,
            flightNumber: flight.flightNumber,
            notes: flight.notes,
        })
        setEditing(true)
    }

    const handleSave = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const payload: any = {}
        for (const [k, v] of Object.entries(draft)) {
            if (v === '' || v === undefined || v === null) continue
            if (k === 'origin' || k === 'destination') {
                payload[k] = (v as Airport).icao
            } else if (k === 'airline') {
                payload[k] = (v as Airline).icao
            } else {
                payload[k] = v
            }
        }
        try {
            await API.patch(
                `/flights?id=${flightId}&timezones=${localAirportTime}`,
                payload,
            )
            await qc.invalidateQueries({ queryKey: ['flight', flightId] })
            await qc.invalidateQueries({ queryKey: ['flights'] })
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = () => {
        if (!confirm('Delete this flight?')) return
        deleteMut.mutate(flightId, {
            onSuccess: () => navigate('/flights'),
        })
    }

    return (
        <form onSubmit={handleSave} className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
            {/* Back + header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Link
                    to="/flights"
                    className="board-label flex items-center gap-1.5 text-ink-muted hover:text-ink"
                >
                    <ArrowLeft size={14} /> All flights
                </Link>
                <div className="flex items-center gap-2">
                    {isOwner && !editing && (
                        <>
                            <Button type="button" variant="outline" size="sm" onClick={enterEdit}>
                                <Pencil size={13} /> Edit
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleteMut.isPending}
                            >
                                <Trash2 size={13} /> Delete
                            </Button>
                        </>
                    )}
                    {editing && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(false)}
                            >
                                <X size={13} /> Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="accent"
                                size="sm"
                                disabled={saving}
                            >
                                <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Banner */}
            <Panel>
                <div className="px-4 md:px-6 py-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="muted">{flight.username}</Badge>
                        <Badge variant="default">{flight.date}</Badge>
                        {flight.flightNumber && <Badge variant="accent">{flight.flightNumber}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                        <div className="text-3xl md:text-5xl font-mono font-bold tracking-board">
                            {airportCode(flight.origin)}
                        </div>
                        <div className="flex flex-col items-center text-ink-muted">
                            <span className="board-label">
                                {formatDuration(flight.duration)}
                            </span>
                            <ArrowRight size={24} className="my-1" />
                            <span className="board-label">
                                {formatDistance(flight.distance, metric)}
                            </span>
                        </div>
                        <div className="text-3xl md:text-5xl font-mono font-bold tracking-board">
                            {airportCode(flight.destination)}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-rule">
                        <DataBlock
                            label="Departure"
                            value={formatTime(flight.departureTime)}
                            sub={flight.origin?.timezone}
                        />
                        <DataBlock
                            label="Arrival"
                            value={formatTime(flight.arrivalTime)}
                            sub={flight.arrivalDate || flight.destination?.timezone}
                        />
                        <DataBlock
                            label="Airline"
                            value={
                                flight.airline
                                    ? flight.airline.iata || flight.airline.icao
                                    : '—'
                            }
                            sub={flight.airline?.name}
                        />
                        <DataBlock
                            label="Aircraft"
                            value={flight.airplane || '—'}
                            sub={flight.tailNumber || undefined}
                        />
                    </div>
                </div>
            </Panel>

            {/* Airports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AirportPanel title="Departure airport" airport={flight.origin} />
                <AirportPanel title="Arrival airport" airport={flight.destination} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel>
                    <PanelHeader>
                        <PanelTitle>Route</PanelTitle>
                    </PanelHeader>
                    {flight.distance ? (
                        <Suspense
                            fallback={
                                <div className="flex justify-center py-12">
                                    <Spinner />
                                </div>
                            }
                        >
                            <SingleFlightMap
                                flightId={flightId}
                                distance={flight.distance}
                                className="bg-paper-soft/30"
                            />
                        </Suspense>
                    ) : (
                        <PanelBody className="text-center text-ink-muted text-sm">No route data</PanelBody>
                    )}
                </Panel>

                <Panel>
                    <PanelHeader>
                        <PanelTitle>{editing ? 'Edit details' : 'Details'}</PanelTitle>
                    </PanelHeader>
                    <PanelBody className="space-y-3">
                        {editing ? (
                            <EditFields draft={draft} setDraft={setDraft} />
                        ) : (
                            <ReadFields flight={flight} />
                        )}
                    </PanelBody>
                </Panel>
            </div>

            {flight.notes && !editing && (
                <Panel>
                    <PanelHeader>
                        <PanelTitle>Notes</PanelTitle>
                    </PanelHeader>
                    <PanelBody>
                        <p className="font-mono text-sm whitespace-pre-line text-ink-soft">
                            {flight.notes}
                        </p>
                    </PanelBody>
                </Panel>
            )}
        </form>
    )
}

function AirportPanel({ title, airport }: { title: string; airport: any }) {
    if (!airport || typeof airport === 'string') {
        return (
            <Panel>
                <PanelHeader>
                    <PanelTitle>{title}</PanelTitle>
                </PanelHeader>
                <PanelBody className="text-sm font-mono text-ink-muted">
                    {typeof airport === 'string' ? airport : 'No airport data'}
                </PanelBody>
            </Panel>
        )
    }
    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{title}</PanelTitle>
                <span className="font-mono font-semibold tracking-board text-ink">
                    {airport.iata || airport.icao}
                </span>
            </PanelHeader>
            <PanelBody className="grid grid-cols-2 gap-3">
                <DataBlock label="Name" value={airport.name || '—'} className="col-span-2" />
                <DataBlock label="City" value={airport.municipality || '—'} />
                <DataBlock label="Country" value={airport.country || '—'} />
                <DataBlock label="Region" value={airport.region || '—'} />
                <DataBlock label="Continent" value={airport.continent || '—'} />
                <DataBlock label="ICAO / IATA" value={`${airport.icao || '—'} / ${airport.iata || '—'}`} />
                <DataBlock label="Timezone" value={airport.timezone || '—'} />
            </PanelBody>
        </Panel>
    )
}

function ReadFields({ flight }: { flight: Flight }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <DataBlock label="Seat" value={flight.seat || '—'} valueClassName="capitalize" />
            <DataBlock
                label="Side"
                value={flight.aircraftSide || '—'}
                valueClassName="capitalize"
            />
            <DataBlock label="Class" value={flight.ticketClass || '—'} valueClassName="capitalize" />
            <DataBlock label="Purpose" value={flight.purpose || '—'} valueClassName="capitalize" />
            <DataBlock label="Tail number" value={flight.tailNumber || '—'} />
            <DataBlock label="Flight number" value={flight.flightNumber || '—'} />
            {flight.connection && (
                <div className="col-span-2">
                    <span className="board-label">Connection</span>
                    <Link
                        to={`/flights?id=${flight.connection}`}
                        className="block font-mono text-sm text-accent-deep underline mt-1"
                    >
                        Linked flight #{flight.connection}
                    </Link>
                </div>
            )}
        </div>
    )
}

interface EditFieldsProps {
    draft: Partial<Flight>
    setDraft: (d: Partial<Flight>) => void
}

function EditFields({ draft, setDraft }: EditFieldsProps) {
    const set = <K extends keyof Flight>(k: K, v: Flight[K] | undefined) =>
        setDraft({ ...draft, [k]: v as any })

    const onAirportSearch = async (q: string): Promise<ComboboxOption<Airport>[]> => {
        const res = await searchAirports(q)
        return res.map((a) => ({
            value: a.icao,
            label: `${a.iata || a.icao} · ${a.municipality}`,
            sub: `${a.name} · ${a.country}`,
            raw: a,
        }))
    }
    const onAirlineSearch = async (q: string): Promise<ComboboxOption<Airline>[]> => {
        const res = await searchAirlines(q)
        return res.map((a) => ({
            value: a.icao,
            label: `${a.iata || a.icao} · ${a.name}`,
            raw: a,
        }))
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
                <Label>Date</Label>
                <Input
                    type="date"
                    value={draft.date ?? ''}
                    onChange={(e) => set('date', e.target.value)}
                />
            </div>

            <div>
                <Label>Origin</Label>
                <Combobox<Airport>
                    displayValue={
                        draft.origin
                            ? `${draft.origin.iata || draft.origin.icao} · ${draft.origin.municipality}`
                            : undefined
                    }
                    onSearch={onAirportSearch}
                    onSelect={(o) => set('origin', o.raw as Airport)}
                />
            </div>
            <div>
                <Label>Destination</Label>
                <Combobox<Airport>
                    displayValue={
                        draft.destination
                            ? `${draft.destination.iata || draft.destination.icao} · ${draft.destination.municipality}`
                            : undefined
                    }
                    onSearch={onAirportSearch}
                    onSelect={(o) => set('destination', o.raw as Airport)}
                />
            </div>

            <div>
                <Label>Departure time</Label>
                <Input
                    type="time"
                    value={draft.departureTime ?? ''}
                    onChange={(e) => set('departureTime', e.target.value)}
                />
            </div>
            <div>
                <Label>Arrival time</Label>
                <Input
                    type="time"
                    value={draft.arrivalTime ?? ''}
                    onChange={(e) => set('arrivalTime', e.target.value)}
                />
            </div>

            <div>
                <Label>Arrival date</Label>
                <Input
                    type="date"
                    value={draft.arrivalDate ?? ''}
                    onChange={(e) => set('arrivalDate', e.target.value)}
                />
            </div>
            <div>
                <Label>Duration (min)</Label>
                <Input
                    type="number"
                    value={draft.duration ?? ''}
                    onChange={(e) =>
                        set('duration', e.target.value ? Number(e.target.value) : undefined)
                    }
                />
            </div>

            <div>
                <Label>Distance</Label>
                <Input
                    type="number"
                    value={draft.distance ?? ''}
                    onChange={(e) =>
                        set('distance', e.target.value ? Number(e.target.value) : undefined)
                    }
                />
            </div>
            <div>
                <Label>Airline</Label>
                <Combobox<Airline>
                    displayValue={
                        draft.airline
                            ? `${draft.airline.iata || draft.airline.icao} · ${draft.airline.name}`
                            : undefined
                    }
                    onSearch={onAirlineSearch}
                    onSelect={(o) => set('airline', o.raw as Airline)}
                />
            </div>

            <div>
                <Label>Seat</Label>
                <Select value={draft.seat ?? ''} onChange={(e) => set('seat', e.target.value)}>
                    {SEAT_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                            {o || '—'}
                        </option>
                    ))}
                </Select>
            </div>
            <div>
                <Label>Side</Label>
                <Select
                    value={draft.aircraftSide ?? ''}
                    onChange={(e) => set('aircraftSide', e.target.value)}
                >
                    {AIRCRAFT_SIDES.map((o) => (
                        <option key={o} value={o}>
                            {o || '—'}
                        </option>
                    ))}
                </Select>
            </div>

            <div>
                <Label>Class</Label>
                <Select
                    value={draft.ticketClass ?? ''}
                    onChange={(e) => set('ticketClass', e.target.value)}
                >
                    {CLASSES.map((o) => (
                        <option key={o} value={o}>
                            {o || '—'}
                        </option>
                    ))}
                </Select>
            </div>
            <div>
                <Label>Purpose</Label>
                <Select value={draft.purpose ?? ''} onChange={(e) => set('purpose', e.target.value)}>
                    {PURPOSES.map((o) => (
                        <option key={o} value={o}>
                            {o || '—'}
                        </option>
                    ))}
                </Select>
            </div>

            <div>
                <Label>Airplane</Label>
                <Input
                    value={draft.airplane ?? ''}
                    onChange={(e) => set('airplane', e.target.value)}
                />
            </div>
            <div>
                <Label>Tail number</Label>
                <Input
                    value={draft.tailNumber ?? ''}
                    onChange={(e) => set('tailNumber', e.target.value)}
                />
            </div>

            <div className="col-span-2">
                <Label>Flight number</Label>
                <Input
                    value={draft.flightNumber ?? ''}
                    onChange={(e) => set('flightNumber', e.target.value)}
                />
            </div>

            <div className="col-span-2">
                <Label>Notes</Label>
                <textarea
                    rows={3}
                    value={draft.notes ?? ''}
                    onChange={(e) => set('notes', e.target.value)}
                    className="w-full bg-paper border border-rule px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
                />
            </div>
        </div>
    )
}
