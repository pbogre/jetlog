const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
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
        },
    },
    plugins: []
}
