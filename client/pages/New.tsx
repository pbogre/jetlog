import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plane, Radio, Loader2 } from 'lucide-react'

import API, { ENABLE_EXTERNAL_APIS } from '@/api'
import {
    searchAirports,
    searchAirlines,
    useCurrentUser,
    useUsernames,
} from '@/lib/queries'
import type { Airline, Airport } from '@/models'
import ConfigStorage from '@/storage/configStorage'

import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { Badge } from '@/components/ui/Badge'

const SEAT_OPTIONS = ['', 'aisle', 'middle', 'window']
const AIRCRAFT_SIDES = ['', 'left', 'right', 'center']
const CLASSES = ['', 'private', 'first', 'business', 'economy+', 'economy']
const PURPOSES = ['', 'leisure', 'business', 'crew', 'other']

interface TravelerExtras {
    seat: string
    aircraftSide: string
    ticketClass: string
    purpose: string
    notes: string
}
const emptyExtras = (): TravelerExtras => ({
    seat: '',
    aircraftSide: '',
    ticketClass: '',
    purpose: '',
    notes: '',
})

interface SharedFields {
    origin?: Airport
    destination?: Airport
    airline?: Airline
    date: string
    departureTime: string
    arrivalTime: string
    arrivalDate: string
    airplane: string
    tailNumber: string
    flightNumber: string
}

export default function NewFlight() {
    const navigate = useNavigate()
    const qc = useQueryClient()
    const localAirportTime = ConfigStorage.getSetting('localAirportTime') === 'true'

    const { data: me } = useCurrentUser()
    const { data: allUsers } = useUsernames()

    const [shared, setShared] = useState<SharedFields>({
        date: new Date().toISOString().slice(0, 10),
        departureTime: '',
        arrivalTime: '',
        arrivalDate: '',
        airplane: '',
        tailNumber: '',
        flightNumber: '',
    })

    const [travelers, setTravelers] = useState<Record<string, TravelerExtras>>({})
    const [submitting, setSubmitting] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initialize traveler list when current user loads
    useEffect(() => {
        if (me && !travelers[me.username]) {
            setTravelers({ [me.username]: emptyExtras() })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me?.username])

    const setShared_ = <K extends keyof SharedFields>(k: K, v: SharedFields[K]) =>
        setShared((s) => ({ ...s, [k]: v }))

    const updateTraveler = (
        username: string,
        patch: Partial<TravelerExtras>,
    ) =>
        setTravelers((t) => ({
            ...t,
            [username]: { ...t[username], ...patch },
        }))

    const toggleTraveler = (username: string) => {
        setTravelers((t) => {
            if (t[username]) {
                const { [username]: _, ...rest } = t
                return rest
            }
            return { ...t, [username]: emptyExtras() }
        })
    }

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

    const attemptFetchByCallsign = async () => {
        if (!ENABLE_EXTERNAL_APIS || !shared.flightNumber) return
        setFetching(true)
        setError(null)
        try {
            const data = await API.getRemote(
                `https://api.adsbdb.com/v0/callsign/${shared.flightNumber}`,
            )
            const route = data?.response?.flightroute
            if (!route) {
                setError('No route found for that flight number.')
                return
            }
            const [origin, destination, airline] = await Promise.all([
                API.get(`/airports/${route.origin.icao_code}`),
                API.get(`/airports/${route.destination.icao_code}`),
                API.get(`/airlines/${route.airline.icao}`),
            ])
            setShared((s) => ({ ...s, origin, destination, airline }))
        } catch {
            setError('Failed to fetch flight info.')
        } finally {
            setFetching(false)
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!shared.origin || !shared.destination) {
            setError('Origin and destination are required.')
            return
        }
        const usernames = Object.keys(travelers)
        if (usernames.length === 0) {
            setError('At least one traveler is required.')
            return
        }

        setSubmitting(true)
        try {
            const sharedPayload = {
                origin: shared.origin.icao,
                destination: shared.destination.icao,
                airline: shared.airline?.icao,
                date: shared.date,
                departureTime: shared.departureTime || undefined,
                arrivalTime: shared.arrivalTime || undefined,
                arrivalDate: shared.arrivalDate || undefined,
                airplane: shared.airplane || undefined,
                tailNumber: shared.tailNumber || undefined,
                flightNumber: shared.flightNumber || undefined,
            }

            const payload = usernames.map((u) => {
                const extras = travelers[u]
                const filteredExtras: Record<string, string> = {}
                for (const [k, v] of Object.entries(extras)) {
                    if (v) filteredExtras[k] = v
                }
                return { username: u, ...sharedPayload, ...filteredExtras }
            })

            const endpoint =
                payload.length === 1
                    ? `/flights?timezones=${localAirportTime}`
                    : `/flights/many?timezones=${localAirportTime}`
            const body = payload.length === 1 ? payload[0] : payload
            const flightId = await API.post(endpoint, body)
            qc.invalidateQueries({ queryKey: ['flights'] })
            navigate(`/flights?id=${flightId}`)
        } catch {
            setError('Failed to save flight.')
        } finally {
            setSubmitting(false)
        }
    }

    const isAdmin = me?.isAdmin
    const otherUsers = allUsers?.filter((u) => u !== me?.username) ?? []

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-mono uppercase tracking-board text-base">New flight</h1>
                <Badge variant="muted">
                    <Plane size={11} className="mr-1" />
                    Manual entry
                </Badge>
            </div>

            {/* Fetch by callsign — prominent at top */}
            {ENABLE_EXTERNAL_APIS && (
                <Panel className="border-ink/20">
                    <PanelBody className="!py-4">
                        <Label>Flight number</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. FR2460"
                                value={shared.flightNumber}
                                maxLength={7}
                                onChange={(e) =>
                                    setShared_('flightNumber', e.target.value.toUpperCase())
                                }
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="accent"
                                onClick={attemptFetchByCallsign}
                                disabled={!shared.flightNumber || fetching}
                                className="h-10 shrink-0"
                            >
                                {fetching ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Radio size={14} />
                                )}
                                {fetching ? 'Fetching…' : 'Fetch'}
                            </Button>
                        </div>
                        <p className="text-xs text-ink-muted font-mono mt-1.5">
                            Enter a callsign and we'll pre-fill origin, destination & airline.
                        </p>
                    </PanelBody>
                </Panel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Route */}
                <Panel>
                    <PanelHeader>
                        <PanelTitle>Route</PanelTitle>
                    </PanelHeader>
                    <PanelBody className="space-y-3">
                        <div>
                            <Label required>Origin</Label>
                            <Combobox<Airport>
                                placeholder="Search airports..."
                                displayValue={
                                    shared.origin
                                        ? `${shared.origin.iata || shared.origin.icao} · ${shared.origin.municipality}`
                                        : undefined
                                }
                                onSearch={onAirportSearch}
                                onSelect={(o) => setShared_('origin', o.raw as Airport)}
                            />
                        </div>
                        <div>
                            <Label required>Destination</Label>
                            <Combobox<Airport>
                                placeholder="Search airports..."
                                displayValue={
                                    shared.destination
                                        ? `${shared.destination.iata || shared.destination.icao} · ${shared.destination.municipality}`
                                        : undefined
                                }
                                onSearch={onAirportSearch}
                                onSelect={(o) => setShared_('destination', o.raw as Airport)}
                            />
                        </div>
                        <div>
                            <Label>Airline</Label>
                            <Combobox<Airline>
                                placeholder="Search airlines..."
                                displayValue={
                                    shared.airline
                                        ? `${shared.airline.iata || shared.airline.icao} · ${shared.airline.name}`
                                        : undefined
                                }
                                onSearch={onAirlineSearch}
                                onSelect={(o) => setShared_('airline', o.raw as Airline)}
                            />
                        </div>
                    </PanelBody>
                </Panel>

                {/* Schedule + aircraft */}
                <Panel>
                    <PanelHeader>
                        <PanelTitle>Schedule & aircraft</PanelTitle>
                    </PanelHeader>
                    <PanelBody className="space-y-3">
                        <div>
                            <Label required>Date</Label>
                            <Input
                                type="date"
                                value={shared.date}
                                onChange={(e) => setShared_('date', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Departure</Label>
                                <Input
                                    type="time"
                                    value={shared.departureTime}
                                    onChange={(e) => setShared_('departureTime', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Arrival</Label>
                                <Input
                                    type="time"
                                    value={shared.arrivalTime}
                                    onChange={(e) => setShared_('arrivalTime', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Arrival date</Label>
                            <Input
                                type="date"
                                value={shared.arrivalDate}
                                onChange={(e) => setShared_('arrivalDate', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Airplane</Label>
                                <Input
                                    placeholder="B738"
                                    maxLength={16}
                                    value={shared.airplane}
                                    onChange={(e) => setShared_('airplane', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Tail number</Label>
                                <Input
                                    placeholder="EI-DCL"
                                    maxLength={16}
                                    value={shared.tailNumber}
                                    onChange={(e) => setShared_('tailNumber', e.target.value)}
                                />
                            </div>
                        </div>
                    </PanelBody>
                </Panel>
            </div>

            {/* Travelers */}
            <Panel>
                <PanelHeader>
                    <PanelTitle>
                        {isAdmin ? 'Travelers' : 'Your details'}
                    </PanelTitle>
                    {isAdmin && (
                        <span className="board-label text-ink-muted">
                            {Object.keys(travelers).length} selected
                        </span>
                    )}
                </PanelHeader>
                <PanelBody className="space-y-4">
                    {isAdmin && otherUsers.length > 0 && (
                        <div>
                            <Label>Log this flight for</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {me && (
                                    <Badge variant="accent">
                                        {me.username} (you)
                                    </Badge>
                                )}
                                {otherUsers.map((u) => {
                                    const selected = !!travelers[u]
                                    return (
                                        <button
                                            type="button"
                                            key={u}
                                            onClick={() => toggleTraveler(u)}
                                            className={
                                                selected
                                                    ? 'inline-flex items-center px-2 py-0.5 font-mono uppercase tracking-board text-[10px] border bg-accent-soft border-accent-deep text-ink hover:bg-accent'
                                                    : 'inline-flex items-center px-2 py-0.5 font-mono uppercase tracking-board text-[10px] border bg-paper border-rule text-ink-muted hover:border-ink hover:text-ink'
                                            }
                                        >
                                            {u}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {Object.entries(travelers).map(([username, extras]) => (
                            <div key={username} className="border border-rule p-4">
                                <div className="board-label mb-3">
                                    Traveler: <span className="text-ink">{username}</span>
                                </div>
                                <TravelerForm
                                    extras={extras}
                                    onChange={(p) => updateTraveler(username, p)}
                                />
                            </div>
                        ))}
                    </div>
                </PanelBody>
            </Panel>

            {error && (
                <div className="border border-danger bg-danger-soft/40 text-danger px-3 py-2 text-sm font-mono">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-paper/95 backdrop-blur border-t border-rule -mx-4 md:-mx-6 px-4 md:px-6 py-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button type="submit" variant="accent" size="lg" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save flight'}
                </Button>
            </div>
        </form>
    )
}

function TravelerForm({
    extras,
    onChange,
}: {
    extras: TravelerExtras
    onChange: (p: Partial<TravelerExtras>) => void
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                    <Label>Seat</Label>
                    <Select
                        value={extras.seat}
                        onChange={(e) => onChange({ seat: e.target.value })}
                    >
                        {SEAT_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                                {o || 'Choose'}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label>Side</Label>
                    <Select
                        value={extras.aircraftSide}
                        onChange={(e) => onChange({ aircraftSide: e.target.value })}
                    >
                        {AIRCRAFT_SIDES.map((o) => (
                            <option key={o} value={o}>
                                {o || 'Choose'}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label>Class</Label>
                    <Select
                        value={extras.ticketClass}
                        onChange={(e) => onChange({ ticketClass: e.target.value })}
                    >
                        {CLASSES.map((o) => (
                            <option key={o} value={o}>
                                {o || 'Choose'}
                            </option>
                        ))}
                    </Select>
                </div>
                <div>
                    <Label>Purpose</Label>
                    <Select
                        value={extras.purpose}
                        onChange={(e) => onChange({ purpose: e.target.value })}
                    >
                        {PURPOSES.map((o) => (
                            <option key={o} value={o}>
                                {o || 'Choose'}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>
            <div>
                <Label>Notes</Label>
                <textarea
                    rows={2}
                    maxLength={150}
                    placeholder="Type here..."
                    value={extras.notes}
                    onChange={(e) => onChange({ notes: e.target.value })}
                    className="w-full bg-paper border border-rule px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
                />
            </div>
        </div>
    )
}
