const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    darkMode: 'class',
    content: [
        "./client/**/*.{html,js,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: colors.yellow,
                gray: colors.neutral,
                danger: colors.red,
                // Refined dark mode colors
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                }
            },
            backgroundColor: theme => ({
                ...theme('colors'),
                'dark-default': '#121212',
                'dark-paper': '#1e1e1e',
                'dark-elevated': '#242424'
            }),
            // Add transition durations and timing
            transitionDuration: {
                'default': '200ms'
            },
            transitionTimingFunction: {
                'default': 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        },
    },
    plugins: []
}
