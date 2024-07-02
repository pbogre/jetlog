from server.database import airports_database
from server.models import AirportModel
from fastapi import APIRouter

router = APIRouter(
    prefix="/airports",
    redirect_slashes=True
)

@router.get("/{query}", status_code=200)
async def get_airports(query: str) -> list[AirportModel]:
    results = airports_database.execute_read_query("""
    SELECT * FROM airports WHERE 
    LOWER(iata) LIKE LOWER(?) OR 
    LOWER(icao) LIKE LOWER(?) OR 
    LOWER(city) LIKE LOWER(?);
    """, [f"%{query}%", f"%{query}%", f"%{query}%"])

    airports = [ AirportModel.from_database(db_airport) for db_airport in results ]
    return [ AirportModel.model_validate(airport) for airport in airports ]
