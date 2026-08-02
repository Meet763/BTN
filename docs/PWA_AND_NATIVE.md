# PWA and native migration

## PWA (current)

The React app uses `vite-plugin-pwa` with:

- Installable manifest (`Business Trust Network`)
- Auto-updating service worker
- Network-only caching for `/api/*` (authenticated data is never cached)

Add PNG icons at `frontend/public/pwa-192.png` and `frontend/public/pwa-512.png` for store-quality install prompts.

## Responsive layout

- Ant Design `Grid.useBreakpoint()` collapses the sidebar on tablet/mobile
- Tables use `scroll={{ x: true }}` for horizontal scroll on small screens

## Future native apps

1. Keep using the same REST API (`BTN.API`) — no mobile-specific backend required initially.
2. **Capacitor** or **React Native** can wrap the production PWA URL or reimplement screens against the API.
3. Move push notifications to a dedicated `device_subscriptions` table and FCM/APNs when native ships.
4. Enable API versioning (`/api/v1`) before publishing app store builds.
