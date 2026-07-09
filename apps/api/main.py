import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from modules.api import router

app = FastAPI()
app.include_router(router)

FOO_DIR = Path(os.environ.get("FOO_DIR", "foos"))


@app.get("/api/hello")
def read_root():
    return {"message": "Hello!"}


@app.get("/api/foos")
def list_foos():
    if not FOO_DIR.exists():
        return {"error": f"Foo directory not found at {FOO_DIR}", "foos": []}

    try:
        foos = [f.name for f in FOO_DIR.iterdir() if f.is_file()]
        return {"foos": sorted(foos)}
    except Exception as e:
        return {"error": str(e), "foos": []}


@app.post("/api/create-file")
def create_file():
    try:
        file_path = FOO_DIR / "foo.txt"
        file_path.touch()
        return {"success": True, "message": f"Created {file_path}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/delete-file")
def delete_file():
    try:
        file_path = FOO_DIR / "foo.txt"
        if file_path.exists():
            file_path.unlink()
            return {"success": True, "message": f"Deleted {file_path}"}
        else:
            return {"success": False, "error": "File does not exist"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# Mount static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"Warning: static directory not found at {static_dir}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
