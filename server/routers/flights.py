from server.database import database
from server.models import AirportModel, FlightModel
from fastapi import APIRouter, HTTPException
from enum import Enum
import datetime

router = APIRouter(
    prefix="/flights",
    tags=["flights"],
    redirect_slashes=True
)

class Order(str, Enum):
    asc = "ASC"
    desc = "DESC"

def check_date(date: str):
    try:
        datetime.date.fromisoformat(date)
    except:
        raise HTTPException(status_code=400, 
                            detail="Incorrect date format, should be 'YYYY-mm-dd'")

def check_airport(airport: str|AirportModel):
    icao = airport.icao if type(airport) == AirportModel else airport
    res = database.execute_read_query(f"SELECT icao FROM airports WHERE LOWER(icao) = LOWER(?);", [icao]);

    if len(res) < 1:
        raise HTTPException(status_code=400,
                            detail=f"Provided airport has invalid ICAO code: '{icao}'")

@router.post("", status_code=201)
async def add_flight(flight: FlightModel) -> int:
    if not (flight.date and flight.origin and flight.destination):
        raise HTTPException(status_code=404, 
                            detail="Insufficient flight data. Date, Origin, and Destination are required")

    check_date(flight.date)
    check_airport(flight.origin)
    check_airport(flight.destination)

    columns = FlightModel.get_attributes(False)

    query = "INSERT INTO flights ("
    for attr in columns:
        query += f"{attr},"
    query = query[:-1]
    query += ") VALUES (" + ('?,' * len(columns))
    query = query[:-1]
    query += ") RETURNING id;"

    values = flight.get_values()

    return database.execute_query(query, values)

@router.patch("", status_code=200)
async def update_flight(id: int, new_flight: FlightModel) -> int:
    query = "UPDATE flights SET "
 
    for attr in FlightModel.get_attributes(False):
        value = getattr(new_flight, attr)
        if value:
            query += f"{attr}=?," if value else ""

            if attr == "date":
                check_date(value)
            if attr == "origin" or attr == "destination":
                check_airport(value)

    if query[-1] == ',':
        query = query[:-1]

    query += f" WHERE id = {str(id)} RETURNING id;"

    values = new_flight.get_values()

    return database.execute_query(query, values)

@router.delete("", status_code=200)
async def delete_flight(id: int) -> int:
    return database.execute_query(
        """
        DELETE FROM flights WHERE id = ? RETURNING id;
        """,
        [id]
    )

@router.get("", status_code=200)
async def get_flights(id: int|None = None, 
                      limit: int = 50, 
                      offset: int = 0, 
                      order: Order = Order.desc,
                      start: str|None = None,
                      end: str|None = None) -> list[FlightModel]|FlightModel:
    try:
        if start:
            datetime.date.fromisoformat(start)
        if end:
            datetime.date.fromisoformat(end)
    except:
        raise HTTPException(status_code=400, 
                            detail="Incorrect date format for start or end parameters, should be 'YYYY-mm-dd'")

    id_filter = f"WHERE f.id = {str(id)}" if id else ""

    date_filter_start = "WHERE" if not id and (start or end) else "AND" if start or end else ""

    date_filter = ""
    date_filter += f"JULIANDAY(date) > JULIANDAY('{start}')" if start else ""
    date_filter += " AND " if start and end else ""
    date_filter += f"JULIANDAY(date) < JULIANDAY('{end}')" if end else ""

    query = f"""
        SELECT 
            f.id, 
            f.date, 
            f.departure_time, 
            f.arrival_time, 
            f.seat,
            f.duration, 
            f.distance, 
            f.airplane,
            o.*, 
            d.*
        FROM flights f 
        JOIN airports o ON LOWER(f.origin) = LOWER(o.icao) 
        JOIN airports d ON LOWER(f.destination) = LOWER(d.icao)
        {id_filter}
        {date_filter_start} {date_filter}
        ORDER BY f.date {order.value}
        LIMIT {limit}
        OFFSET {offset};"""

    res = database.execute_read_query(query);

    flights = []

    for db_flight in res:
        begin = len(FlightModel.get_attributes()) - 2
        length = len(AirportModel.get_attributes())

        db_origin = db_flight[begin:begin+ length]
        db_destination = db_flight[begin + length: begin + 2*length]

        origin = AirportModel.from_database(db_origin)
        destination = AirportModel.from_database(db_destination)

        flight = FlightModel.from_database(db_flight, { "origin": origin, "destination": destination } ) 
        flights.append(flight)

    if id and not flights:
        raise HTTPException(status_code=400, detail=f"Flight with id '{str(id)}' not found.")

    if id:
        return FlightModel.model_validate(flights[0])
    return [ FlightModel.model_validate(flight) for flight in flights ]
