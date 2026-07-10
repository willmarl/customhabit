# customhabit

A personal habit tracker inspired by Obsidian tally markers. Track Core habits and optional sub-category tables with drag-and-drop reordering, a click-to-tally date grid, and markdown notes per table.

![preview](./image.jpg)

## Features

- **Core table** — your main habit list; always present
- **Sub-categories** — optional grouped tables; each one auto-adds a linked row in Core
- **Linked rows** — Core row checks off when all habits in that sub-category are done for the day
- **Tally grid** — click a date cell to toggle completion (default: last 7 days; configurable in Settings)
- **Drag-and-drop** — reorder habits within any table
- **Markdown notes** — optional notes under each table with live preview; auto-saved
- **Day-run bar** — normal, loop, and tap-out modes with finish-time estimates
- **Stats** — activity heatmap and streak tracking
- **Board snapshots** — save and restore habit layouts
- **Retired habits** — remove from active boards without losing history
- **Settings** — lookback window, day timing, and other preferences
- **Light/dark theme**

## Architecture
You get one **Core** table plus optional **sub-category** tables. Sub-categories auto-add a linked row in Core, so you can see the big picture and drill into groups (work, health, chores, etc.) without duplicating habits.

Click date cells to tally completions, drag habits to reorder, and jot markdown notes under each table. Stats, snapshots, and day-run timing are built in — but at its core it's a tally grid with SQLite behind it.

```
browser → :8005
           ├── /api/*   → FastAPI route handlers
           └── /*       → React SPA (built static files served by FastAPI)
```

## Install/setup

Have Docker installed.

```bash
docker run -d -p 1234:8005 willmarl/customhabit:latest
```

Open a browser and go to `http://<your-pc-ip>:1234/` (e.g. `http://192.168.0.230:1234/`).

SQLite creates itself on first run — no setup step. Data lives at `/app/database.db` inside the container.

To keep habits across container restarts/upgrades, mount a volume:

```bash
docker run -d -p 1234:8005 -v customhabit-data:/app willmarl/customhabit:latest
```





## Tech stack

- (Backend) FastAPI
  - SQLite DB
- (Frontend) Vite + React
