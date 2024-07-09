const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./**/*.{html,js,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: colors.orange,
                gray: colors.neutral,
                danger: colors.red
            }
        },
    },
    plugins: []
}
