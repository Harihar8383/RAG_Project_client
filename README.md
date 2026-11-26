# Second Brain client

React and Vite interface for Second Brain. Users sign in with Clerk, create projects, upload files and chat with them. The server lives in `RAG_Project_server`.

## Setup

1. Install Node 20 or newer, then run `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` (default `http://localhost:8000/api`).
3. Start the server, then run `npm run dev` and open http://localhost:5173.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm test` | Component tests with Vitest. No network or keys needed |
| `npm run lint` | ESLint |
| `npm run build` | Production build in `dist/` |
