# Velmont

A watch e-commerce storefront with an admin dashboard, built with React + Vite on the frontend and Express + SQLite on the backend.

## Features

- Browse, filter, and search watches by brand, gender, movement, and price
- Product pages, favourites, cart, and checkout with saved delivery locations
- Email/password auth with sessions, plus security-question-based password reset
- Admin dashboard (email allowlist) for managing inventory and viewing store analytics
- Google Places autocomplete for delivery addresses

## Getting started

```bash
npm install
cp .env.example .env   # fill in VITE_GOOGLE_MAPS_API_KEY and ADMIN_EMAILS
npm run dev             # runs the Vite dev server and the API concurrently
```

The app runs at `http://localhost:5173`, proxying `/api` to the Express server.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Vite client and Express API together with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build |
| `npm run server` | Run the API server standalone |

## Project structure

```
src/       React frontend (pages, components, contexts, lib)
server/    Express API, SQLite schema/migrations, routes
public/    Static assets and product images
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps/Places key for address autocomplete |
| `ADMIN_EMAILS` | Comma-separated emails granted admin access on signup/signin |
