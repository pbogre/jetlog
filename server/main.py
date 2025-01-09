from server.environment import PATH_PREFIX
assert type(PATH_PREFIX) == str # for linter
from server.routers import flights, airports, statistics, geography, importing, exporting
from server.auth import users, auth
from fastapi import APIRouter, FastAPI, Depends
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

app = FastAPI(openapi_tags=tags_metadata, 
              docs_url=PATH_PREFIX + '/docs', 
              openapi_url=PATH_PREFIX + '/openapi.json')
build_path = Path(__file__).parent.parent / 'dist'
index_path = build_path / 'index.html'

router_prefix = PATH_PREFIX + "/api"
options = { "prefix": router_prefix, "dependencies": [Depends(users.get_current_user)]}
app.include_router(flights.router, **options)
app.include_router(airports.router, **options)
app.include_router(statistics.router, **options)
app.include_router(geography.router, **options)
app.include_router(importing.router, **options)
app.include_router(exporting.router, **options)

app.include_router(users.router, prefix=router_prefix)
app.include_router(auth.router, prefix=router_prefix)

main = APIRouter(prefix=PATH_PREFIX)

@main.get("")
@main.get("/new")
@main.get("/flights")
@main.get("/statistics")
@main.get("/settings")
@main.get("/login")
async def root():
    with open(index_path, "r") as file:
        html = file.read()
    return HTMLResponse(content=html)

app.include_router(main, include_in_schema=False)

# change base href in index.html if needed
if PATH_PREFIX:
    import re
    with open(index_path, "r") as file:
        html = file.read()
    
    updated_html = re.sub(r'(<base\s+href=")[^"]*(")', 
                     r"\1" + PATH_PREFIX + r"\2", 
                     html, 
                     flags=re.IGNORECASE)

    with open(index_path, "w") as file:
        file.write(updated_html)

app.mount(PATH_PREFIX, StaticFiles(directory=build_path), name="app")
