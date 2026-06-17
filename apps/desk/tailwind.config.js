/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6",
                "nav-bg": "#2C2E3E",
                "nav-hover": "#3D4054",
                "nav-active": "#3D4054",
                "background-light": "#f1f5f9",
                "background-dark": "#0f172a",
                "card-light": "#ffffff",
                "card-dark": "#1e293b",
                "border-light": "#e2e8f0",
                "border-dark": "#334155"
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
}
