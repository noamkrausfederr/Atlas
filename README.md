# Atlas

Atlas is a travel planning project with separate web, backend, and Expo mobile apps for saving places discovered on TikTok, Instagram Reels, and YouTube.

## Architecture

- Frontend: React + TypeScript + Tailwind + Vite
- Backend: Node.js + Express + TypeScript
- Mobile: Expo + React Native
- Database: PostgreSQL (planned)
- Authentication: Google login (planned)
- Map integration: Mapbox / Google Maps (planned)

## Workspace structure

- `frontend/` - React UI, reusable components, pages, mock data.
- `backend/` - Express API for recommendations, geocoding, and deployment health checks.
- `mobile/` - Expo mobile app with its own screens, data layer, and backend integration.

## Current backend API

- `GET /api/health` - deployment and provider configuration status
- `GET /api/geocode/autocomplete` - accommodation autocomplete
- `POST /api/recommendations` - live recommendation pipeline

## Local development

```bash
npm install
npm run dev
```

The frontend dev server runs at **http://localhost:4173/** (homepage is `/`; dashboard is `/dashboard`).

> **Note:** UI changes in `frontend/` apply to the **web app** only. The Expo app in `mobile/` is a separate codebase and will not reflect web homepage updates.

## Mobile development

```bash
cd mobile
npm start
```

During development, the mobile app prefers a local backend on port `5005` and falls back to `EXPO_PUBLIC_API_BASE_URL` when local is unavailable.

If you do not see changes, stop any old dev server, run `npm run dev` again from the project root, and open http://localhost:4173/ (not port 5173). Hard-refresh the browser (Cmd+Shift+R).
