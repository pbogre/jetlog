from server.database import database
from server.models import AirportModel
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/airports",
    tags=["airports"],
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_airports(q: str) -> list[AirportModel]:
    results = database.execute_read_query(f"""
    SELECT * FROM airports WHERE 
    LOWER(iata) LIKE LOWER('%{q}%') OR 
    LOWER(name) LIKE LOWER('%{q}%') OR 
    LOWER(municipality) LIKE LOWER('%{q}%') OR 
    LOWER(region) LIKE LOWER('%{q}%') OR 
    LOWER(icao) LIKE LOWER('%{q}%') 
    ORDER BY LOWER(iata) = LOWER('{q}') DESC,
             LOWER(name) = LOWER('{q}') DESC,
             LOWER(municipality) = LOWER('{q}') DESC,
             LOWER(region) LIKE LOWER('%{q}%') DESC,
             LOWER(icao) = LOWER('{q}') 
    LIMIT 5;""")

    airports = [ AirportModel.from_database(db_airport) for db_airport in results ]
    return [ AirportModel.model_validate(airport) for airport in airports ]

@router.get("/{icao}", status_code=200)
async def get_airport_from_icao(icao: str) -> AirportModel:
    result = database.execute_read_query("SELECT * FROM airports WHERE LOWER(icao) = LOWER(?);", [icao])

    if not result:
        raise HTTPException(status_code=404, detail=f"No airport with ICAO '{icao}' found")

    airport = AirportModel.from_database(result[0])
    return AirportModel.model_validate(airport)
