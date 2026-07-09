# fastapi-react-docker

Boilerplate for FastAPI + React + Docker for homelab/local use.

![preview](./image.png)

## Architecture

Everything runs on a **single port**. In production (Docker), FastAPI serves both the API and the React frontend as static files — no separate frontend server needed.

```
browser → :8000
           ├── /api/*   → FastAPI route handlers
           └── /*       → React SPA (built static files served by FastAPI)
```

During **local dev**, Vite runs its own dev server (with HMR) and proxies `/api` requests to FastAPI on `:8000`:

```
browser → Vite :5173 → /api/* proxied → FastAPI :8000
```

## Dev setup

### Install

```bash
cd apps/api
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
# make foos folder in apps/api
mkdir foos
cd ../web
pnpm install
```

### Running app

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

## Docker Compose setup

```bash
docker compose up --build
```

Check if test folder made.
Then visit `http://localhost:1234`

## Docker image setup

```bash
docker build -t homelab-mono:latest .

docker run -p 1234:8000 -v ~/Downloads/test:/app/foos homelab-mono:latest
```

Check if test folder made.
Then visit `http://localhost:1234`

## Volume mount

The `-v host_path:/app/foos` flag bind-mounts a host directory into the container so files written by the app persist across container restarts. The container entrypoint automatically fixes directory ownership so no `sudo` is needed.
