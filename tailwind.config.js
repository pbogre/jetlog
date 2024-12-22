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
                danger: colors.red
            },
            backgroundColor: {
                dark: '#1a1a1a',
                light: '#ffffff'
            },
            textColor: {
                dark: '#ffffff',
                light: '#000000'
            }
        },
    },
    plugins: []
}
