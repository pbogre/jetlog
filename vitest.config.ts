import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'client'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./client/test/setup.ts'],
        clearMocks: true,
    },
})
