# Atlas

Atlas is a modern travel planning web app for saving places discovered on TikTok, Instagram Reels, and YouTube.

## Architecture

- Frontend: React + TypeScript + Tailwind + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (planned)
- Authentication: Google login (planned)
- Map integration: Mapbox / Google Maps (planned)

## Workspace structure

- `frontend/` - React UI, reusable components, pages, mock data.
- `backend/` - Express API, routes, sample endpoints.

## Local development

```bash
npm install
npm run dev
```

The frontend dev server runs at **http://localhost:4173/** (homepage is `/`; dashboard is `/dashboard`).

> **Note:** UI changes in `frontend/` apply to the **web app** only. The Expo app in `mobile/` is a separate codebase and will not reflect web homepage updates.

If you do not see changes, stop any old dev server, run `npm run dev` again from the project root, and open http://localhost:4173/ (not port 5173). Hard-refresh the browser (Cmd+Shift+R).
