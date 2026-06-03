/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
                    300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6',
                    600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95',
                },
                violet: {
                    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
                    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed',
                },
                surface: '#F5F5FA',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'card': '0 2px 16px rgba(0,0,0,0.06)',
                'balance': '0 8px 32px rgba(109,40,217,0.25)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
