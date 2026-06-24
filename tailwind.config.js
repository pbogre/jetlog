/** @type {import('tailwindcss').Config} */
export default {
    content: ['./client/**/*.{html,js,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                paper: {
                    DEFAULT: '#FAF7F0',
                    soft: '#F3EFE3',
                    stripe: '#F0EBDC',
                },
                ink: {
                    DEFAULT: '#14130F',
                    soft: '#3B392F',
                    muted: '#76725F',
                    faint: '#A8A48F',
                },
                rule: '#D9D2BC',
                accent: {
                    DEFAULT: '#F5C518',
                    soft: '#FBE680',
                    deep: '#C99A00',
                },
                danger: {
                    DEFAULT: '#B23B2A',
                    soft: '#E8B8B0',
                },
                ok: {
                    DEFAULT: '#3E7A4F',
                },
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
                sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '2px',
                sm: '2px',
                md: '4px',
            },
            boxShadow: {
                paper: '0 1px 0 0 rgba(20, 19, 15, 0.06)',
            },
            letterSpacing: {
                board: '0.12em',
            },
            keyframes: {
                'flap-in': {
                    '0%': { transform: 'rotateX(-90deg)', opacity: '0' },
                    '60%': { transform: 'rotateX(10deg)', opacity: '1' },
                    '100%': { transform: 'rotateX(0deg)', opacity: '1' },
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'flap-in': 'flap-in 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                'fade-in': 'fade-in 180ms ease-out',
            },
        },
    },
    plugins: [],
}
