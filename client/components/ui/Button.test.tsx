import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'


describe('Button', () => {
    it('renders its label and handles clicks', async () => {
        const onClick = vi.fn()
        const user = userEvent.setup()

        render(<Button onClick={onClick}>Save</Button>)
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(onClick).toHaveBeenCalledOnce()
    })
})
