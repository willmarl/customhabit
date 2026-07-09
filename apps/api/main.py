import os

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from modules.api import router

app = FastAPI()
app.include_router(router)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"Warning: static directory not found at {static_dir}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8005))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
