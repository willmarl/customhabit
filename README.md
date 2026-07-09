# Custom Habit

A personal habit tracker inspired by Obsidian tally markers. Track Core habits and optional sub-category tables with drag-and-drop reordering, a click-to-tally date grid, and markdown notes per table.

![preview](./image.jpg)

## Features

- **Core table** — one main habit list; always present
- **Sub-categories** — 0 to N grouped tables; creating one auto-adds a linked row in Core
- **Drag-and-drop** — reorder habits within any table
- **Tally grid** — click a date cell to toggle completion (default: last 7 days)
- **Markdown notes** — optional notes under each table with live preview
- **Settings-ready** — lookback window stored in the backend for a future settings page

## Architecture

Everything runs on a **single port**. In production (Docker), FastAPI serves both the API and the React frontend as static files.

```
browser → :8005
           ├── /api/*   → FastAPI route handlers
           └── /*       → React SPA (built static files served by FastAPI)
```

During **local dev**, Vite runs its own dev server (with HMR) and proxies `/api` requests to FastAPI on `:8005`:

```
browser → Vite :5173 → /api/* proxied → FastAPI :8005
```

**Stack:** FastAPI + SQLModel (SQLite) · React 19 + Vite · shadcn/ui · TanStack Query · @dnd-kit

## Dev setup

### Install

```bash
cd apps/api
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

cd ../web
pnpm install
```

### Run

```bash
# terminal 1 — backend
cd apps/api
source .venv/bin/activate
python3 main.py

# terminal 2 — frontend
cd apps/web
pnpm run dev
```

Visit `http://localhost:5173`

## Docker Compose

```bash
docker compose up --build
```

Visit `http://localhost:1234`

## Docker image

```bash
docker build -t customhabit:latest .

docker run -p 1234:8005 customhabit:latest
```

Visit `http://localhost:1234`

Data is stored in `apps/api/database.db` (SQLite). In Docker, mount a volume to persist it across restarts.
