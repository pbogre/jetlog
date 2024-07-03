from server.database import database
from server.models import AirportModel, FlightModel
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

    return database.execute_query(query, values)

@router.patch("/{flight_id}", status_code=200)
async def update_flight(flight_id: int, new_flight: FlightModel) -> int:
    query = "UPDATE flights SET "
 
    for attr in FlightModel.get_attributes(False):
        value = getattr(new_flight, attr)
        query += f"{attr}='{str(value)}'," if value else ""

    if query[-1] == ',':
        query = query[:-1]

    query += " WHERE id = " + str(flight_id) + " RETURNING id;"

    return database.execute_query(query)

@router.delete("/{flight_id}", status_code=200)
async def delete_flight(flight_id: int) -> int:
    return database.execute_query(
        """
        DELETE FROM flights WHERE id = ? RETURNING id;
        """,
        [flight_id]
    )

# TODO query fields (limit, offset, year, etc.)
@router.get("", status_code=200)
async def get_all_flights():
    res = database.execute_read_query("""
        SELECT f.*, o.*, d.*
        FROM flights f 
        JOIN airports o ON f.origin = o.icao 
        JOIN airports d ON f.destination = d.icao;""");

    flights = []

    for db_flight in res:
        start = len(FlightModel.get_attributes())
        length = len(AirportModel.get_attributes())

        db_origin = db_flight[start:start + length]
        db_destination = db_flight[start + length: start + 2 * length]

        origin = AirportModel.from_database(db_origin)
        destination = AirportModel.from_database(db_destination)

        flight = FlightModel.from_database(db_flight, origin, destination) 
        flights.append(flight)

    return [ FlightModel.model_validate(flight) for flight in flights ]

# todo GET single flight by id
