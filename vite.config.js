import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Insurer Admin portal. No backend yet -- all data lives in the browser
// (localStorage, see src/store/AdminStore.jsx).
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5200,
        host: true,
    },
    preview: {
        port: 4200,
    },
})
