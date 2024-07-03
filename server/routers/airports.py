from server.database import database
from server.models import AirportModel
from fastapi import APIRouter

router = APIRouter(
    prefix="/airports",
    redirect_slashes=True
)

@router.get("/{query}", status_code=200)
async def get_airports(query: str) -> list[AirportModel]:
    results = database.execute_read_query(f"\
    SELECT * FROM airports WHERE \
    LOWER(iata) LIKE LOWER('%{query}%') OR \
    LOWER(name) LIKE LOWER('%{query}%') OR \
    LOWER(city) LIKE LOWER('%{query}%') OR \
    LOWER(icao) LIKE LOWER('%{query}%') \
    ORDER BY LOWER(iata) = LOWER('{query}') DESC,\
             LOWER(name) = LOWER('{query}') DESC,\
             LOWER(city) = LOWER('{query}') DESC,\
             LOWER(icao) = LOWER('{query}') \
    LIMIT 5;")

    airports = [ AirportModel.from_database(db_airport) for db_airport in results ]
    return [ AirportModel.model_validate(airport) for airport in airports ]
