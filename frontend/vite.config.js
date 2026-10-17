import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Business Trust Network',
                short_name: 'BTN',
                description: 'BTN CRM, leads, wallet, and billing portal',
                theme_color: '#1677ff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                navigateFallback: '/index.html',
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/localhost.*\/api\/.*/i,
                        handler: 'NetworkOnly',
                    },
                ],
            },
        }),
    ],
});
