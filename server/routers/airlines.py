from server.database import database
from server.models import AirlineModel
from fastapi import APIRouter

router = APIRouter(
    prefix="/airlines",
    tags=["airlines"],
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_airlines(q: str) -> list[AirlineModel]:
    results = database.execute_read_query(f"""
        SELECT * FROM airlines WHERE
        LOWER(name) LIKE LOWER('%{q}%') OR
        LOWER(icao) LIKE LOWER('%{q}%') OR
        LOWER(iata) LIKE LOWER('%{q}%')
        ORDER BY LOWER(name) = LOWER('{q}') DESC,
                 LOWER(icao) = LOWER('{q}') DESC,
                 LOWER(iata) = LOWER('{q}')
        LIMIT 5;
        """)
    if results:
        airlines = [ AirlineModel.from_database(db_airline) for db_airline in results ]
    else:
        return []
        
    return [ AirlineModel.model_validate(airline) for airline in airlines ]