from server.database import database
from server.auth.auth import get_current_user
from server.models import AirportModel, FlightModel, User

from fastapi import APIRouter, Depends, HTTPException
from enum import Enum
import datetime
import math

router = APIRouter(
    prefix="/flights",
    tags=["flights"],
    redirect_slashes=True
)

class Order(str, Enum):
    ASCENDING = "ASC"
    DESCENDING = "DESC"

class Sort(str, Enum):
    DATE = "date"
    SEAT = "seat"
    TICKET_CLASS = "ticket_class"
    DURATION = "duration"
    DISTANCE = "distance"

# https://en.wikipedia.org/wiki/Haversine_formula
def spherical_distance(origin: AirportModel, destination: AirportModel) -> int:
    if not origin.latitude or not origin.longitude or not destination.latitude or not destination.longitude:
        return 0

    #convert to radian
    origin_lat = origin.latitude * math.pi / 180.0;
    origin_lon = origin.longitude * math.pi / 180.0;
    destination_lat = destination.latitude * math.pi / 180.0;
    destination_lon = destination.longitude * math.pi / 180.0;

    # get deltas
    delta_lat = origin_lat - destination_lat;
    delta_lon = origin_lon - destination_lon;

    # apply Haversine formulas
    hav_delta_lat = math.sin(delta_lat / 2) ** 2;
    hav_delta_lon = math.sin(delta_lon / 2) ** 2;

    hav_theta = hav_delta_lat + (hav_delta_lon * math.cos(origin_lat) * math.cos(destination_lat))

    earth_radius = 6371; # km
    distance = 2 * earth_radius * math.asin(math.sqrt(hav_theta));

    return round(distance);

@router.post("", status_code=201)
async def add_flight(flight: FlightModel, user: User = Depends(get_current_user)) -> int:
    if not (flight.date and flight.origin and flight.destination):
        raise HTTPException(status_code=404, 
                            detail="Insufficient flight data. Date, Origin, and Destination are required")

    # if distance not given, calculate it
    if not flight.distance:
        # if only icao given, retrieve AirportModel
        if type(flight.origin) == str:
            res = database.execute_read_query(f"SELECT * FROM airports WHERE LOWER(icao) = LOWER(?);", [flight.origin])
            origin = AirportModel.from_database(res[0])

            flight.origin = origin

        if type(flight.destination) == str:
            res = database.execute_read_query(f"SELECT * FROM airports WHERE LOWER(icao) = LOWER(?);", [flight.destination])
            destination = AirportModel.from_database(res[0])

            flight.destination = destination

        # finally, calculate and set distance
        if type(flight.origin) == AirportModel and type(flight.destination) == AirportModel:
            flight.distance = spherical_distance(flight.origin, flight.destination)

    # if duration not given, calculate it
    if not flight.duration and flight.departure_time and flight.arrival_time:
        departure = datetime.datetime.strptime(f"{flight.date} {flight.departure_time}", "%Y-%m-%d %H:%M")
        arrival = datetime.datetime.strptime(f"{flight.date} {flight.arrival_time}", "%Y-%m-%d %H:%M")

        if flight.arrival_date:
            arrival_date = datetime.datetime.fromisoformat(f"{flight.arrival_date}")
            arrival = datetime.datetime.combine(arrival_date, arrival.time())
        elif arrival.time() <= departure.time():
            arrival_date = arrival.date() + datetime.timedelta(days=1)
            arrival = datetime.datetime.combine(arrival_date, arrival.time())
            flight.arrival_date = arrival_date

        delta = arrival - departure
        delta_minutes = delta.total_seconds() / 60

        flight.duration = round(delta_minutes)

    columns = FlightModel.get_attributes(ignore=["id"])

    query = "INSERT INTO flights ("
    for attr in columns:
        query += f"{attr},"
    query = query[:-1]
    query += ") VALUES (" + ('?,' * len(columns))
    query = query[:-1]
    query += ") RETURNING id;"

    values = flight.get_values()
    values[0] = user.id;

    return database.execute_query(query, values)

@router.patch("", status_code=200)
async def update_flight(id: int, new_flight: FlightModel) -> int:
    if new_flight.empty():
        return id

    query = "UPDATE flights SET "
 
    for attr in FlightModel.get_attributes(ignore=["id", "user_id"]):
        value = getattr(new_flight, attr)
        if value:
            query += f"{attr}=?," if value else ""

    if query[-1] == ',':
        query = query[:-1]

    query += f" WHERE id = {str(id)} RETURNING id;"

    values = [value for value in new_flight.get_values() if value is not None]

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
                      metric: bool = True,
                      limit: int = 50, 
                      offset: int = 0, 
                      order: Order = Order.DESCENDING,
                      sort: Sort = Sort.DATE,
                      start: datetime.date|None = None,
                      end: datetime.date|None = None,
                      ) -> list[FlightModel]|FlightModel:

    id_filter = f"WHERE f.id = {str(id)}" if id else ""

    date_filter_start = "WHERE" if id and (start or end) else "AND" if start or end else ""

    date_filter = ""
    date_filter += f"JULIANDAY(date) > JULIANDAY('{start}')" if start else ""
    date_filter += " AND " if start and end else ""
    date_filter += f"JULIANDAY(date) < JULIANDAY('{end}')" if end else ""

    query = f"""
        SELECT 
            f.*,
            o.*, 
            d.*
        FROM flights f 
        JOIN airports o ON LOWER(f.origin) = LOWER(o.icao) 
        JOIN airports d ON LOWER(f.destination) = LOWER(d.icao)
        {id_filter}
        {date_filter_start} {date_filter}
        ORDER BY f.{sort.value} {order.value}
        LIMIT {limit}
        OFFSET {offset};"""

    res = database.execute_read_query(query);

    # get rid of origin, destination ICAOs for proper conversion
    # after this, each flight_db is in the format:
    # [id, user_id, date, departure_time, ..., AirportModel, AirportModel]
    res = [ flight_db[:3] + flight_db[5:] for flight_db in res ]

    flights = []

    for db_flight in res:
        begin = len(FlightModel.get_attributes()) - 2
        length = len(AirportModel.get_attributes())

        db_origin = db_flight[begin:begin + length]
        db_destination = db_flight[begin + length: begin + 2*length]

        origin = AirportModel.from_database(db_origin)
        destination = AirportModel.from_database(db_destination)

        flight = FlightModel.from_database(db_flight, { "origin": origin, "destination": destination } )

        if not metric and flight.distance:
            flight.distance = round(flight.distance * 0.6213711922)

        flights.append(flight)

    if id and not flights:
        raise HTTPException(status_code=404, detail=f"Flight with id '{str(id)}' not found.")

    if id:
        return FlightModel.model_validate(flights[0])
    return [ FlightModel.model_validate(flight) for flight in flights ]
