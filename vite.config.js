import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Insurer Admin portal. It calls its backend (ai-damage-assessment-service/admin-service)
// at the same-origin path /api: in dev/preview Vite proxies it to the local
// service, in production nginx does the same (see DEPLOYMENT.md).
const apiProxy = {
    '/api': { target: process.env.ADMIN_API_TARGET || 'http://127.0.0.1:8040', changeOrigin: false },
}

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5200,
        host: true,
        proxy: apiProxy,
    },
    preview: {
        port: 4200,
        proxy: apiProxy,
    },
})
