from server.routers import flights, airports, airlines, statistics, geography, importing, exporting
from server.auth import users, auth, tokens
from server.environment import ENABLE_EXTERNAL_APIS
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

tags_metadata=[
    { "name": "flights" },
    { "name": "airports" },
    { "name": "airlines"},
    { "name": "statistics" },
    { "name": "geography" },
    { "name": "importing/exporting" },
    { "name": "users" },
    { "name": "authentication" }
]

app = FastAPI(openapi_tags=tags_metadata)
build_path = Path(__file__).parent.parent / 'dist'

app.include_router(flights.router, prefix="/api")
app.include_router(airports.router, prefix="/api")
app.include_router(airlines.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(geography.router, prefix="/api")
app.include_router(importing.router, prefix="/api")
app.include_router(exporting.router, prefix="/api")

app.include_router(users.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(tokens.router, prefix="/api")

@app.get("/config")
async def get_config(request: Request):
    config = {
            "BASE_URL": request.scope.get("root_path", "/"),
            "ENABLE_EXTERNAL_APIS": ENABLE_EXTERNAL_APIS
    }
    return JSONResponse(config)

@app.get("/", include_in_schema=False)
@app.get("/new", include_in_schema=False)
@app.get("/flights", include_in_schema=False)
@app.get("/statistics", include_in_schema=False)
@app.get("/settings", include_in_schema=False)
@app.get("/login", include_in_schema=False)
async def root():
    with open(build_path / 'index.html', "r") as file:
        html = file.read()
    return HTMLResponse(content=html)

app.mount("/", StaticFiles(directory=build_path), name="app")
