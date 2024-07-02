from server.database import jetlog_database
from server.models import FlightModel
from fastapi import APIRouter

router = APIRouter(
    prefix="/flights",
    redirect_slashes=True
)

@router.post("", status_code=201)
async def add_flight(flight: FlightModel) -> int:
    columns = FlightModel.get_attributes(False)

    query = "INSERT INTO flights ("
    for attr in columns:
        query += f"{attr},"
    query = query[:-1]
    query += ") VALUES (" + ('?,' * len(columns))
    query = query[:-1]
    query += ") RETURNING id;"
 
    values = [ getattr(flight, attr) for attr in columns ]

    return jetlog_database.execute_query(query, values)

@router.patch("/{flight_id}", status_code=200)
async def update_flight(flight_id: int, new_flight: FlightModel) -> int:
    query = "UPDATE flights SET "
 
    for attr in FlightModel.get_attributes(False):
        value = getattr(new_flight, attr)
        query += f"{attr}='{str(value)}'," if value else ""

    if query[-1] == ',':
        query = query[:-1]

    query += " WHERE id = " + str(flight_id) + " RETURNING id;"

    return jetlog_database.execute_query(query)

@router.delete("/{flight_id}", status_code=200)
async def delete_flight(flight_id: int) -> int:
    return jetlog_database.execute_query(
        """
        DELETE FROM flights WHERE id = ? RETURNING id;
        """,
        [flight_id]
    )

@router.get("", status_code=200)
async def get_all_flights() -> list[FlightModel]:
    results = jetlog_database.execute_read_query("SELECT * FROM flights;")

    flights = [ FlightModel.from_database(db_flight) for db_flight in results ]
    return [ FlightModel.model_validate(flight) for flight in flights ]

# todo GET flight by id
# todo GET flights (with query fields)
