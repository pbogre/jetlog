import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import API from '@/api'
import TokenStorage from '@/storage/tokenStorage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'

export default function Login() {
    const navigate = useNavigate()
    const qc = useQueryClient()
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = useMutation({
        mutationFn: (formData: FormData) => API.post('/auth/token', formData),
        onSuccess: (data) => {
            TokenStorage.storeToken(data.access_token, remember)
            qc.clear()
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
        <div className="min-h-full flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
                <h1 className="font-mono font-bold uppercase tracking-board text-2xl text-center mb-8">
                    Jet<span className="text-accent-deep">log</span>
                </h1>

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

                    <label
                        htmlFor="remember"
                        className="flex items-center gap-2 cursor-pointer board-label pt-1"
                    >
                        <Switch
                            id="remember"
                            checked={remember}
                            onCheckedChange={setRemember}
                        />
                        Remember me
                    </label>

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
                        {login.isPending ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
