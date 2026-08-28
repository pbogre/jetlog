import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { ColumnsManager } from '@/components/settings/ColumnsManager'
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
    labelKey: string
    descriptionKey: string
}

const PREFS: PrefDef[] = [
    {
        key: 'metricUnits',
        labelKey: 'settings.metricUnits',
        descriptionKey: 'settings.metricUnitsDesc',
    },
    {
        key: 'localAirportTime',
        labelKey: 'settings.localAirportTime',
        descriptionKey: 'settings.localAirportTimeDesc',
    },
    {
        key: 'showVisitedCountries',
        labelKey: 'settings.showVisitedCountries',
        descriptionKey: 'settings.showVisitedCountriesDesc',
    },
    {
        key: 'frequencyBasedMarker',
        labelKey: 'settings.frequencyBasedMarker',
        descriptionKey: 'settings.frequencyBasedMarkerDesc',
    },
    {
        key: 'frequencyBasedLine',
        labelKey: 'settings.frequencyBasedLine',
        descriptionKey: 'settings.frequencyBasedLineDesc',
    },
]

export default function Settings() {
    const { data: me } = useCurrentUser()
    const { t } = useTranslation()

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <h1 className="font-mono uppercase tracking-board text-base mb-4">{t('settings.title')}</h1>

            <Tabs defaultValue="preferences">
                <TabsList>
                    <TabsTrigger value="preferences">{t('settings.tabPreferences')}</TabsTrigger>
                    <TabsTrigger value="table">{t('settings.tabTable')}</TabsTrigger>
                    <TabsTrigger value="data">{t('settings.tabData')}</TabsTrigger>
                    <TabsTrigger value="account">{t('settings.tabAccount')}</TabsTrigger>
                    {me?.isAdmin && (
                        <>
                            <TabsTrigger value="users">{t('settings.tabUsers')}</TabsTrigger>
                            <TabsTrigger value="jobs">{t('settings.tabJobs')}</TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="preferences">
                    <PreferencesPanel />
                </TabsContent>
                <TabsContent value="table">
                    <Panel>
                        <PanelHeader>
                            <PanelTitle>{t('settings.columnsOnAllFlights')}</PanelTitle>
                        </PanelHeader>
                        <PanelBody>
                            <ColumnsManager />
                        </PanelBody>
                    </Panel>
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
    const { t } = useTranslation()

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
                            <Label className="mb-0.5">{t(p.labelKey)}</Label>
                            <p className="text-xs text-ink-muted font-mono">
                                {t(p.descriptionKey)}
                            </p>
                        </div>
                        <Switch
                            checked={opts[p.key] === 'true'}
                            onCheckedChange={(v) => toggle(p.key, v)}
                            aria-label={t(p.labelKey)}
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
    const { t } = useTranslation()

    const handleImport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const entries = Array.from(formData.entries()).filter(
            ([, v]) => v instanceof Blob && (v as Blob).size > 0,
        )
        if (entries.length === 0) {
            setError(t('settings.pleaseChooseFile'))
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
                    <PanelTitle>{t('settings.importFlights')}</PanelTitle>
                </PanelHeader>
                <PanelBody>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <Label>{t('settings.myFlightradar24')}</Label>
                            <Input type="file" name="myflightradar24" accept=".csv" />
                        </div>
                        <div>
                            <Label>{t('settings.flighty')}</Label>
                            <Input type="file" name="flighty" accept=".csv" />
                        </div>
                        <div>
                            <Label>{t('settings.customCsv')}</Label>
                            <Input type="file" name="custom" accept=".csv" />
                        </div>
                        {error && (
                            <p className="text-xs font-mono text-danger">{error}</p>
                        )}
                        <Button type="submit" variant="accent" disabled={importing}>
                            <Upload size={13} />
                            {importing ? t('settings.importing') : t('settings.import')}
                        </Button>
                    </form>
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader>
                    <PanelTitle>{t('settings.exportFlights')}</PanelTitle>
                </PanelHeader>
                <PanelBody className="space-y-3">
                    <p className="text-xs text-ink-muted font-mono">
                        {t('settings.exportDescription')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => API.post('/exporting/csv', {}, true)}
                            className="flex-1"
                        >
                            <Download size={13} /> {t('settings.exportCsv')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => API.post('/exporting/ical', {}, true)}
                            className="flex-1"
                        >
                            <Download size={13} /> {t('settings.exportIcal')}
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
    const { t } = useTranslation()
    if (!me) return <Spinner />

    const logout = () => {
        TokenStorage.clearToken()
        window.location.href = '/login'
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel>
                <PanelHeader>
                    <PanelTitle>{t('settings.yourAccount')}</PanelTitle>
                    {me.isAdmin && <Badge variant="accent">{t('common.admin')}</Badge>}
                </PanelHeader>
                <PanelBody className="grid grid-cols-2 gap-4">
                    <DataBlock label={t('settings.username')} value={me.username} />
                    <DataBlock label={t('common.admin')} value={me.isAdmin ? t('common.yes') : t('common.no')} />
                    <DataBlock label={t('settings.lastLogin')} value={me.lastLogin || '—'} />
                    <DataBlock label={t('settings.created')} value={me.createdOn || '—'} />
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader>
                    <PanelTitle>{t('settings.actions')}</PanelTitle>
                </PanelHeader>
                <PanelBody className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil size={13} /> {t('settings.editAccount')}
                    </Button>
                    <Button
                        variant="danger"
                        className="w-full justify-start"
                        onClick={logout}
                    >
                        <LogOut size={13} /> {t('settings.logOut')}
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
    const { t } = useTranslation()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="board-label text-ink-muted">
                    {t('settings.otherUsers', { count: users?.length ?? 0 })}
                </p>
                <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus size={13} /> {t('settings.newUser')}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner />
                </div>
            ) : !users || users.length === 0 ? (
                <Panel>
                    <PanelBody className="text-center text-ink-muted text-sm py-10 font-mono">
                        {t('settings.noOtherUsers')}
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
    const { t } = useTranslation()

    const handleDelete = async () => {
        if (!confirm(t('settings.deleteUserConfirm', { username: user.username }))) return
        await API.delete(`/users/${user.username}`)
        qc.invalidateQueries({ queryKey: ['users'] })
    }

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{user.username}</PanelTitle>
                {user.isAdmin && <Badge variant="accent">{t('common.admin')}</Badge>}
            </PanelHeader>
            <PanelBody className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <DataBlock label={t('settings.lastLogin')} value={user.lastLogin || '—'} />
                    <DataBlock label={t('settings.created')} value={user.createdOn || '—'} />
                </div>
                <div className="flex gap-2 pt-2 border-t border-rule">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil size={13} /> {t('common.edit')}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={handleDelete}
                    >
                        <Trash2 size={13} /> {t('common.delete')}
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
    const { t } = useTranslation()

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
        <Dialog open={open} onOpenChange={onOpenChange} title={t('settings.editUser', { username: user.username })}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Label>{t('settings.newUsername')}</Label>
                    <Input name="username" placeholder={user.username} />
                </div>
                {!isSelf && (
                    <div>
                        <Label>{t('common.admin')}</Label>
                        <Select name="isAdmin" defaultValue={user.isAdmin.toString()}>
                            <option value="false">{t('common.no')}</option>
                            <option value="true">{t('common.yes')}</option>
                        </Select>
                    </div>
                )}
                <div>
                    <Label>{t('settings.newPassword')}</Label>
                    <Input name="password" type="password" placeholder={t('settings.leaveBlank')} />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-rule">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="accent" size="sm">
                        {t('common.save')}
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
    const { t } = useTranslation()
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.currentTarget))
        await API.post('/users', data)
        qc.invalidateQueries({ queryKey: ['users'] })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} title={t('settings.createUser')}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Label required>{t('settings.username')}</Label>
                    <Input name="username" required />
                </div>
                <div>
                    <Label required>{t('common.admin')}</Label>
                    <Select name="isAdmin" defaultValue="false">
                        <option value="false">{t('common.no')}</option>
                        <option value="true">{t('common.yes')}</option>
                    </Select>
                </div>
                <div>
                    <Label required>{t('login.password')}</Label>
                    <Input name="password" type="password" required />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-rule">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="accent" size="sm">
                        {t('common.create')}
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
    const { t } = useTranslation()

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
                t('settings.jobResult', {
                    label,
                    updated: data?.amountUpdated ?? 0,
                    skipped: data?.amountSkipped ?? 0,
                }),
            )
        } finally {
            setRunning(null)
        }
    }

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>{t('settings.maintenanceJobs')}</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
                <JobRow
                    label={t('settings.computeConnections')}
                    description={t('settings.computeConnectionsDesc')}
                    onRun={() => run('connections', t('settings.connections'))}
                    running={running === t('settings.connections')}
                    disabled={!!running}
                />
                {ENABLE_EXTERNAL_APIS && (
                    <JobRow
                        label={t('settings.fetchMissingAirlines')}
                        description={t('settings.fetchMissingAirlinesDesc')}
                        onRun={() => run('airlines', t('settings.airlines'))}
                        running={running === t('settings.airlines')}
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
    const { t } = useTranslation()

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
                {running ? t('common.running') : t('common.run')}
            </Button>
        </div>
    )
}
