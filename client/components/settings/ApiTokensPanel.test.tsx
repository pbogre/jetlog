import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApiToken, CreatedApiToken } from '@/models'


const mocks = vi.hoisted(() => ({
    activeOnly: true,
    tokens: [] as ApiToken[],
    create: vi.fn(),
    revoke: vi.fn(),
    useApiTokens: vi.fn(),
}))

vi.mock('@/api', () => ({
    default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    ENABLE_EXTERNAL_APIS: false,
}))

vi.mock('@/lib/queries', () => ({
    useApiTokens: (activeOnly: boolean) => {
        mocks.activeOnly = activeOnly
        mocks.useApiTokens(activeOnly)
        return { data: mocks.tokens, isLoading: false }
    },
    useCreateApiToken: () => ({ mutateAsync: mocks.create, isPending: false }),
    useRevokeApiToken: () => ({ mutateAsync: mocks.revoke, isPending: false }),
    useCurrentUser: vi.fn(),
    useUsernames: vi.fn(),
}))

import { ApiTokensPanel } from '@/pages/Settings'


describe('ApiTokensPanel', () => {
    beforeEach(() => {
        mocks.tokens = []
        mocks.activeOnly = true
        mocks.create.mockReset()
        mocks.revoke.mockReset()
        mocks.useApiTokens.mockReset()
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        })
    })

    it('defaults to active tokens and can show token history', async () => {
        const user = userEvent.setup()
        render(<ApiTokensPanel />)

        expect(mocks.useApiTokens).toHaveBeenCalledWith(true)
        await user.click(screen.getByRole('switch', { name: 'Active only' }))
        expect(mocks.useApiTokens).toHaveBeenLastCalledWith(false)
        expect(screen.getByText('No API token history.')).toBeInTheDocument()
    })

    it('validates scopes and reveals a newly created secret once', async () => {
        const created: CreatedApiToken = {
            id: 1,
            name: 'Mobile app',
            token: 'jl_pat_once-only-secret',
            scopes: ['flights:read'],
            expiresAt: null,
            lastUsedAt: null,
            createdAt: '2026-07-31T12:00:00Z',
            revokedAt: null,
            status: 'active',
        }
        mocks.create.mockResolvedValue(created)
        const user = userEvent.setup()
        render(<ApiTokensPanel />)

        await user.click(screen.getByRole('button', { name: /create token/i }))
        expect(screen.getByRole('checkbox', { name: /read metadata/i })).toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: /create flights/i })).toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: /edit flights/i })).toBeInTheDocument()
        await user.type(screen.getByLabelText(/token name/i), 'Mobile app')
        await user.click(screen.getByRole('button', { name: /generate token/i }))
        expect(screen.getByText('Select at least one scope.')).toBeInTheDocument()

        await user.click(screen.getByRole('checkbox', { name: /read flights/i }))
        await user.selectOptions(screen.getByLabelText(/expiration/i), 'never')
        expect(screen.getByText(/remain valid until explicitly revoked/i)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /generate token/i }))

        await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({
            name: 'Mobile app',
            scopes: ['flights:read'],
            expiresInDays: null,
        }))
        expect(screen.getByDisplayValue(created.token)).toBeInTheDocument()

        const writeText = vi.spyOn(navigator.clipboard, 'writeText')
        await user.click(screen.getByRole('button', { name: /copy api token/i }))
        expect(writeText).toHaveBeenCalledWith(created.token)
        await user.click(screen.getByRole('button', { name: /i have saved it/i }))
        expect(screen.queryByDisplayValue(created.token)).not.toBeInTheDocument()
    })

    it('confirms before revoking an active token', async () => {
        mocks.tokens = [{
            id: 7,
            name: 'Script',
            scopes: ['flights:write'],
            expiresAt: '2026-12-31T00:00:00Z',
            lastUsedAt: null,
            createdAt: '2026-07-31T12:00:00Z',
            revokedAt: null,
            status: 'active',
        }]
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        render(<ApiTokensPanel />)

        await user.click(screen.getByRole('button', { name: /revoke/i }))
        expect(window.confirm).toHaveBeenCalled()
        expect(mocks.revoke).toHaveBeenCalledWith(7)
    })
})
