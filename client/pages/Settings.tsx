import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    LogOut,
    Trash2,
    Pencil,
    Upload,
    Download,
    Plus,
    PlayCircle,
} from 'lucide-react'

import API, { ENABLE_EXTERNAL_APIS } from '@/api'
import { useCurrentUser, useUsernames } from '@/lib/queries'
import ConfigStorage, { type ConfigInterface } from '@/storage/configStorage'
import TokenStorage from '@/storage/tokenStorage'
import type { User } from '@/models'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Panel, PanelHeader, PanelTitle, PanelBody } from '@/components/ui/Panel'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { DataBlock } from '@/components/ui/DataBlock'
import { Spinner } from '@/components/ui/Spinner'

interface PrefDef {
    key: keyof ConfigInterface
    label: string
    description: string
}

const PREFS: PrefDef[] = [
    {
        key: 'metricUnits',
        label: 'Metric units',
        description: 'Use kilometers instead of miles for distance.',
    },
    {
        key: 'localAirportTime',
        label: 'Local airport timezone',
        description: 'Compute flight duration using each airport\'s local time.',
    },
    {
        key: 'showVisitedCountries',
        label: 'Highlight visited countries',
        description: 'Fill visited countries on the world map.',
    },
    {
        key: 'frequencyBasedMarker',
        label: 'Frequency-based markers',
        description: 'Scale airport markers on the map by visit count.',
    },
    {
        key: 'frequencyBasedLine',
        label: 'Frequency-based flight lines',
        description: 'Scale flight path thickness by trip frequency.',
    },
    {
        key: 'restrictWorldMap',
        label: 'Restrict map to visited areas',
        description: 'Auto-zoom the world map to your visited region.',
    },
]

export default function Settings() {
    const { data: me } = useCurrentUser()

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <h1 className="font-mono uppercase tracking-board text-base mb-4">Settings</h1>

            <Tabs defaultValue="preferences">
                <TabsList>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="data">Import / Export</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    {me?.isAdmin && (
                        <>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="jobs">Jobs</TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="preferences">
                    <PreferencesPanel />
                </TabsContent>
                <TabsContent value="data">
                    <DataPanel />
                </TabsContent>
                <TabsContent value="account">
                    <AccountPanel me={me} />
                </TabsContent>
                {me?.isAdmin && (
                    <>
                        <TabsContent value="users">
                            <UsersPanel me={me} />
                        </TabsContent>
                        <TabsContent value="jobs">
                            <JobsPanel />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    )
}

// ---------- Preferences ----------

function PreferencesPanel() {
    const [opts, setOpts] = useState<ConfigInterface>(() => ConfigStorage.getAllSettings())

    const toggle = (key: keyof ConfigInterface, value: boolean) => {
        const v = value.toString()
        ConfigStorage.setSetting(key, v)
        setOpts({ ...opts, [key]: v })
    }

    return (
        <Panel>
            <PanelBody className="divide-y divide-rule p-0">
                {PREFS.map((p) => (
                    <div
                        key={p.key}
                        className="flex items-start justify-between gap-4 px-4 py-4"
                    >
                        <div className="min-w-0">
                            <Label className="mb-0.5">{p.label}</Label>
                            <p className="text-xs text-ink-muted font-mono">
                                {p.description}
                            </p>
                        </div>
                        <Switch
                            checked={opts[p.key] === 'true'}
                            onCheckedChange={(v) => toggle(p.key, v)}
                            aria-label={p.label}
                        />
                    </div>
                ))}
            </PanelBody>
        </Panel>
    )
}

// ---------- Import / Export ----------

function DataPanel() {
    const navigate = useNavigate()
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const entries = Array.from(formData.entries()).filter(
            ([, v]) => v instanceof Blob && (v as Blob).size > 0,
        )
        if (entries.length === 0) {
            setError('Please choose at least one file.')
            return
        }
        setImporting(true)
        try {
            for (const [type, file] of entries) {
                const fd = new FormData()
                fd.append('file', file as Blob)
                await API.post(`/importing?csv_type=${type}`, fd)
            }
            navigate('/')
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel>
                <PanelHeader>
                    <PanelTitle>Import flights</PanelTitle>
                </PanelHeader>
                <PanelBody>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <Label>MyFlightRadar24</Label>
                            <Input type="file" name="myflightradar24" accept=".csv" />
                        </div>
                        <div>
                            <Label>Flighty</Label>
                            <Input type="file" name="flighty" accept=".csv" />
                        </div>
                        <div>
                            <Label>Custom CSV</Label>
                            <Input type="file" name="custom" accept=".csv" />
                        </div>
                        {error && (
                            <p className="text-xs font-mono text-danger">{error}</p>
                        )}
                        <Button type="submit" variant="accent" disabled={importing}>
                            <Upload size={13} />
                            {importing ? 'Importing…' : 'Import'}
                        </Button>
                    </form>
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader>
                    <PanelTitle>Export flights</PanelTitle>
                </PanelHeader>
                <PanelBody className="space-y-3">
                    <p className="text-xs text-ink-muted font-mono">
                        Download all your logged flights in one of the formats below.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => API.post('/exporting/csv', {}, true)}
                            className="flex-1"
                        >
                            <Download size={13} /> Export CSV
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => API.post('/exporting/ical', {}, true)}
                            className="flex-1"
                        >
                            <Download size={13} /> Export iCal
                        </Button>
                    </div>
                </PanelBody>
            </Panel>
        </div>
    )
}

// ---------- Account ----------

function AccountPanel({ me }: { me?: User }) {
    const [editOpen, setEditOpen] = useState(false)
    if (!me) return <Spinner />

    const logout = () => {
        TokenStorage.clearToken()
        window.location.href = '/login'
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel>
                <PanelHeader>
                    <PanelTitle>Your account</PanelTitle>
                    {me.isAdmin && <Badge variant="accent">Admin</Badge>}
                </PanelHeader>
                <PanelBody className="grid grid-cols-2 gap-4">
                    <DataBlock label="Username" value={me.username} />
                    <DataBlock label="Admin" value={me.isAdmin ? 'Yes' : 'No'} />
                    <DataBlock label="Last login" value={me.lastLogin || '—'} />
                    <DataBlock label="Created" value={me.createdOn || '—'} />
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader>
                    <PanelTitle>Actions</PanelTitle>
                </PanelHeader>
                <PanelBody className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil size={13} /> Edit account
                    </Button>
                    <Button
                        variant="danger"
                        className="w-full justify-start"
                        onClick={logout}
                    >
                        <LogOut size={13} /> Log out
                    </Button>
                </PanelBody>
            </Panel>

            <EditUserDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                user={me}
                isSelf
            />
        </div>
    )
}

// ---------- Users (admin) ----------

function useAllUserDetails(usernames: string[] | undefined, selfUsername?: string) {
    return useQuery({
        queryKey: ['users', 'details', usernames, selfUsername],
        queryFn: async () => {
            if (!usernames) return []
            const others = usernames.filter((u) => u !== selfUsername)
            return Promise.all(others.map((u) => API.get(`/users/${u}/details`) as Promise<User>))
        },
        enabled: !!usernames,
    })
}

function UsersPanel({ me }: { me: User }) {
    const { data: usernames } = useUsernames()
    const { data: users, isLoading } = useAllUserDetails(usernames, me.username)
    const [createOpen, setCreateOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="board-label text-ink-muted">
                    {users?.length ?? 0} other users
                </p>
                <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus size={13} /> New user
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : !users || users.length === 0 ? (
                <Panel>
                    <PanelBody className="text-center text-ink-muted text-sm py-10 font-mono">
                        No other users.
                    </PanelBody>
                </Panel>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map((u) => (
                        <UserCard key={u.username} user={u} />
                    ))}
                </div>
            )}

            <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    )
}

function UserCard({ user }: { user: User }) {
    const qc = useQueryClient()
    const [editOpen, setEditOpen] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Delete user "${user.username}" and all their flights?`)) return
        await API.delete(`/users/${user.username}`)
        qc.invalidateQueries({ queryKey: ['users'] })
    }

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{user.username}</PanelTitle>
                {user.isAdmin && <Badge variant="accent">Admin</Badge>}
            </PanelHeader>
            <PanelBody className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <DataBlock label="Last login" value={user.lastLogin || '—'} />
                    <DataBlock label="Created" value={user.createdOn || '—'} />
                </div>
                <div className="flex gap-2 pt-2 border-t border-rule">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil size={13} /> Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={handleDelete}
                    >
                        <Trash2 size={13} /> Delete
                    </Button>
                </div>
            </PanelBody>
            <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
        </Panel>
    )
}

interface EditUserDialogProps {
    user: User
    open: boolean
    onOpenChange: (o: boolean) => void
    isSelf?: boolean
}

function EditUserDialog({ user, open, onOpenChange, isSelf }: EditUserDialogProps) {
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = Object.fromEntries(new FormData(e.currentTarget))
        const patch: Record<string, string> = {}
        for (const [k, v] of Object.entries(fd)) {
            if (typeof v !== 'string' || !v) continue
            patch[k] = v
        }
        if (patch.isAdmin === user.isAdmin.toString()) delete patch.isAdmin
        if (Object.keys(patch).length === 0) {
            onOpenChange(false)
            return
        }
        await API.patch(`/users/${user.username}`, patch)
        window.location.reload()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} title={`Edit ${user.username}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Label>New username</Label>
                    <Input name="username" placeholder={user.username} />
                </div>
                {!isSelf && (
                    <div>
                        <Label>Admin</Label>
                        <Select name="isAdmin" defaultValue={user.isAdmin.toString()}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </Select>
                    </div>
                )}
                <div>
                    <Label>New password</Label>
                    <Input name="password" type="password" placeholder="Leave blank to keep current" />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-rule">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="accent" size="sm">
                        Save
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

function CreateUserDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (o: boolean) => void
}) {
    const qc = useQueryClient()
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.currentTarget))
        await API.post('/users', data)
        qc.invalidateQueries({ queryKey: ['users'] })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} title="Create user">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Label required>Username</Label>
                    <Input name="username" required />
                </div>
                <div>
                    <Label required>Admin</Label>
                    <Select name="isAdmin" defaultValue="false">
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </Select>
                </div>
                <div>
                    <Label required>Password</Label>
                    <Input name="password" type="password" required />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-rule">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="accent" size="sm">
                        Create
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

// ---------- Jobs (admin) ----------

function JobsPanel() {
    const [running, setRunning] = useState<string | null>(null)
    const [result, setResult] = useState<string | null>(null)

    const run = async (job: 'connections' | 'airlines', label: string) => {
        setRunning(label)
        setResult(null)
        try {
            const endpoint =
                job === 'connections'
                    ? '/flights/connections'
                    : '/flights/airlines_from_callsigns'
            const data = await API.post(endpoint, {})
            setResult(
                `${label}: ${data?.amountUpdated ?? 0} updated, ${
                    data?.amountSkipped ?? 0
                } skipped`,
            )
        } finally {
            setRunning(null)
        }
    }

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>Maintenance jobs</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
                <JobRow
                    label="Compute flight connections"
                    description="Find return/onward connections between existing flights."
                    onRun={() => run('connections', 'Connections')}
                    running={running === 'Connections'}
                    disabled={!!running}
                />
                {ENABLE_EXTERNAL_APIS && (
                    <JobRow
                        label="Fetch missing airlines"
                        description="Look up airlines for flights with a callsign but no airline."
                        onRun={() => run('airlines', 'Airlines')}
                        running={running === 'Airlines'}
                        disabled={!!running}
                    />
                )}
                {result && (
                    <div className="mt-2 border border-ok bg-paper-soft/40 text-ok px-3 py-2 text-xs font-mono">
                        {result}
                    </div>
                )}
            </PanelBody>
        </Panel>
    )
}

interface JobRowProps {
    label: string
    description: string
    onRun: () => void
    running: boolean
    disabled: boolean
}
function JobRow({ label, description, onRun, running, disabled }: JobRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-rule last:border-b-0">
            <div className="min-w-0 flex-1">
                <Label className="mb-0.5">{label}</Label>
                <p className="text-xs text-ink-muted font-mono">{description}</p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onRun}
                disabled={disabled}
            >
                <PlayCircle size={13} />
                {running ? 'Running…' : 'Run'}
            </Button>
        </div>
    )
}
