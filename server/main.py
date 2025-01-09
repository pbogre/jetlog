from server.environment import PATH_PREFIX
from server.routers import flights, airports, statistics, geography, importing, exporting
from server.auth import users, auth
from fastapi import FastAPI, Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

tags_metadata=[
    { "name": "flights" },
    { "name": "airports" },
    { "name": "statistics" },
    { "name": "geography" },
    { "name": "importing/exporting" },
    { "name": "users" },
    { "name": "authentication" }
]

assert type(PATH_PREFIX) == str

app = FastAPI(openapi_tags=tags_metadata, 
              docs_url=PATH_PREFIX + '/docs', 
              openapi_url=PATH_PREFIX + '/openapi.json')
build_path = Path(__file__).parent.parent / 'dist'

auth_dependency = [Depends(users.get_current_user)]

router_prefix = PATH_PREFIX + "/api"
app.include_router(flights.router, prefix=router_prefix, dependencies=auth_dependency)
app.include_router(airports.router, prefix=router_prefix, dependencies=auth_dependency)
app.include_router(statistics.router, prefix=router_prefix, dependencies=auth_dependency)
app.include_router(geography.router, prefix=router_prefix, dependencies=auth_dependency)
app.include_router(importing.router, prefix=router_prefix, dependencies=auth_dependency)
app.include_router(exporting.router, prefix=router_prefix, dependencies=auth_dependency)

app.include_router(users.router, prefix=router_prefix)
app.include_router(auth.router, prefix=router_prefix)

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

app.mount(PATH_PREFIX, StaticFiles(directory=build_path), name="app")
