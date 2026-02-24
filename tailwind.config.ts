/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f1117',
                canvas: '#141824',
                node: '#1e2433',
                'node-border': '#2a3347',
                'cisco-blue': '#1ba0d7',
                'terminal-green': '#00ff88',
                'core-accent': '#f5a623',
            },
        },
    },
    plugins: [],
}
