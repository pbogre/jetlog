from server.database import database
from server.models import AirportModel
from fastapi import APIRouter

router = APIRouter(
    prefix="/airports",
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_airports(q: str) -> list[AirportModel]:
    results = database.execute_read_query(f"\
    SELECT * FROM airports WHERE \
    LOWER(iata) LIKE LOWER('%{q}%') OR \
    LOWER(name) LIKE LOWER('%{q}%') OR \
    LOWER(city) LIKE LOWER('%{q}%') OR \
    LOWER(icao) LIKE LOWER('%{q}%') \
    ORDER BY LOWER(iata) = LOWER('{q}') DESC,\
             LOWER(name) = LOWER('{q}') DESC,\
             LOWER(city) = LOWER('{q}') DESC,\
             LOWER(icao) = LOWER('{q}') \
    LIMIT 5;")

    airports = [ AirportModel.from_database(db_airport) for db_airport in results ]
    return [ AirportModel.model_validate(airport) for airport in airports ]
