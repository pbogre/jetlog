import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { PlaneTakeoff } from 'lucide-react'

import API from '@/api'
import TokenStorage from '@/storage/tokenStorage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'

export default function Login() {
    const navigate = useNavigate()
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = useMutation({
        mutationFn: (formData: FormData) => API.post('/auth/token', formData),
        onSuccess: (data) => {
            TokenStorage.storeToken(data.access_token, remember)
            navigate('/')
        },
        onError: (err: any) => {
            if (err?.response?.status === 401) {
                setError('Incorrect username or password')
            } else {
                setError('Unable to log in. Please try again.')
            }
        },
    })

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)
        login.mutate(new FormData(event.currentTarget))
    }

    return (
        <div className="min-h-full flex flex-col">
            {/* Top board strip */}
            <div className="border-b border-rule px-4 md:px-6 h-12 flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                    <span className="font-mono font-bold uppercase tracking-board">
                        Jet<span className="text-accent-deep">log</span>
                    </span>
                    <span className="board-label hidden sm:inline">Sign in</span>
                </div>
                <span className="board-label hidden sm:inline">Authorized access</span>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 border border-ink flex items-center justify-center bg-accent">
                            <PlaneTakeoff size={20} strokeWidth={2} className="text-ink" />
                        </div>
                        <div>
                            <h1 className="font-mono uppercase tracking-board text-base text-ink">
                                Boarding pass
                            </h1>
                            <p className="text-xs text-ink-muted font-mono">
                                Identify yourself to continue
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label
                                htmlFor="remember"
                                className="flex items-center gap-2 cursor-pointer board-label"
                            >
                                <Switch
                                    id="remember"
                                    checked={remember}
                                    onCheckedChange={setRemember}
                                />
                                Remember me
                            </label>
                        </div>

                        {error && (
                            <div className="border border-danger bg-danger-soft/40 text-danger px-3 py-2 text-xs font-mono">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="accent"
                            size="lg"
                            className="w-full"
                            disabled={login.isPending}
                        >
                            {login.isPending ? 'Authenticating…' : 'Sign in'}
                        </Button>
                    </form>
                </div>
            </div>

            <div className="border-t border-rule px-4 md:px-6 h-10 flex items-center justify-between">
                <span className="board-label text-ink-faint">Jetlog · Flight log</span>
                <span className="board-label text-ink-faint hidden sm:inline">v1.1</span>
            </div>
        </div>
    )
}
