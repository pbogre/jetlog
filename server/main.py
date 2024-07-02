from server.routers import flights, airports
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()
build_path = Path(__file__).parent.parent / 'client' / 'build'

app.include_router(flights.router, prefix="/api")
app.include_router(airports.router, prefix="/api")

@app.get("/", include_in_schema=False)
async def root():
    with open(build_path / 'index.html', "r") as file:
        html = file.read()
    return HTMLResponse(content=html)

# enables static files (bundled js, css, html)
# which are generated when building docker image
app.mount("/", StaticFiles(directory=build_path), name="static")
