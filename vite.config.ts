import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    root: 'client',
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'client'),
        },
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'es2022',
    },
    server: {
        port: 5173,
        proxy: {
            '^/api/': 'http://localhost:3000',
            '/config': 'http://localhost:3000',
        },
    },
})
