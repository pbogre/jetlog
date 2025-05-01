from server.database import database
from server.models import AirlineModel
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/airlines",
    tags=["airlines"],
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_airlines(q: str) -> list[AirlineModel]:
    results = database.execute_read_query(f"""
        SELECT * FROM airlines WHERE
        LOWER(name) LIKE LOWER(?) OR
        LOWER(icao) LIKE LOWER(?) OR
        LOWER(iata) LIKE LOWER(?)
        ORDER BY LOWER(name) = LOWER(?) DESC,
                 LENGTH(name) ASC,
                 LOWER(icao) = LOWER(?) DESC,
                 LOWER(iata) = LOWER(?)
        LIMIT 5;
        """, [f"%{q}%"] * 3 + ["q"] * 3)

    airlines = [ AirlineModel.from_database(db_airline) for db_airline in results ]
    return [ AirlineModel.model_validate(airline) for airline in airlines ]

@router.get("/{icao}", status_code=200)
async def get_airline_from_icao(icao: str) -> AirlineModel:
    result = database.execute_read_query("SELECT * FROM airlines WHERE LOWER(icao) = LOWER(?);", [icao])

    if not result:
        raise HTTPException(status_code=404, detail=f"No airline with ICAO '{icao}' found")

    airline = AirlineModel.from_database(result[0])
    return AirlineModel.model_validate(airline)
