from server.database import database
from server.models import AirlineModel, AirportModel, ClassType, CustomModel, FlightModel, AircraftSide, FlightPurpose, SeatType, User
from server.auth.users import get_current_user

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
    AIRCRAFT_SIDE = "aircraft_side"
    TICKET_CLASS = "ticket_class"
    DURATION = "duration"
    DISTANCE = "distance"

async def check_flight_authorization(id: int, user: User) -> None:
    res = database.execute_read_query(f"SELECT username FROM flights WHERE id = ?;", [id])
    flight_username = res[0][0]

    if flight_username != user.username:
        raise HTTPException(status_code=403, detail="You are not authorized to modify this flight")

# https://en.wikipedia.org/wiki/Haversine_formula
async def spherical_distance(origin: AirportModel|str, destination: AirportModel|str) -> int:
    from server.routers.airports import get_airport_from_icao

    # make sure we have object types
    if type(origin) == str:
        origin = await get_airport_from_icao(origin)
    if type(destination) == str:
        destination = await get_airport_from_icao(destination)

    assert type(origin) == AirportModel and type(destination) == AirportModel

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
        flight.distance = await spherical_distance(flight.origin, flight.destination)

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

    # only admins may add flights for other users
    if flight.username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can add flights for other users")

    explicit = {"username": user.username} if not flight.username else {}
    values = flight.get_values(ignore=["id"], explicit=explicit)

    return database.execute_query(query, values)

class FlightPatchModel(CustomModel):
    date:           datetime.date|None = None
    origin:         AirportModel|str|None = None
    destination:    AirportModel|str|None = None
    departure_time: str|None = None
    arrival_time:   str|None = None
    arrival_date:   datetime.date|None = None
    seat:           SeatType|None = None
    aircraft_side:  AircraftSide|None = None
    ticket_class:   ClassType|None = None
    purpose:        FlightPurpose|None = None
    duration:       int|None = None
    distance:       int|None = None
    airplane:       str|None = None
    airline:        AirlineModel|str|None = None
    tail_number:    str|None = None
    flight_number:  str|None = None
    notes:          str|None = None

@router.patch("", status_code=200)
async def update_flight(id: int, 
                        new_flight: FlightPatchModel,
                        user: User = Depends(get_current_user)) -> int:
    await check_flight_authorization(id, user)

    if new_flight.empty():
        return id

    # if airports changed, update distance (unless specified)
    if new_flight.origin or new_flight.destination and not new_flight.distance:
        # first must have both airports 
        original_flight = await get_flights(id=id)
        assert type(original_flight) == FlightModel

        new_origin = new_flight.origin if new_flight.origin else original_flight.origin
        new_destination = new_flight.destination if new_flight.destination else original_flight.destination

        new_flight.distance = await spherical_distance(new_origin, new_destination)

    query = "UPDATE flights SET "
 
    for attr in FlightPatchModel.get_attributes():
        value = getattr(new_flight, attr)
        if value:
            query += f"{attr}=?," if value else ""

    if query[-1] == ',':
        query = query[:-1]

    query += f" WHERE id = {str(id)} RETURNING id;"

    values = [value for value in new_flight.get_values() if value is not None]

    return database.execute_query(query, values)

@router.delete("", status_code=200)
async def delete_flight(id: int, user: User = Depends(get_current_user)) -> int:
    await check_flight_authorization(id, user)

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
                      username: str|None = None,
                      user: User = Depends(get_current_user)) -> list[FlightModel]|FlightModel:

    user_filter = f"AND f.username = '{user.username}'" if not id else ""
    if username:
        user_filter = f"AND f.username = '{username}'"

    id_filter = f"AND f.id = {str(id)}" if id else ""

    date_filter = "AND" if start or end else ""
    date_filter += f"JULIANDAY(date) > JULIANDAY('{start}')" if start else ""
    date_filter += " AND " if start and end else ""
    date_filter += f"JULIANDAY(date) < JULIANDAY('{end}')" if end else ""

    query = f"""
        SELECT 
            f.*,
            o.*, 
            d.*,
            a.*
        FROM flights f
        JOIN airports o ON UPPER(f.origin) = o.icao
        JOIN airports d ON UPPER(f.destination) = d.icao
        LEFT JOIN airlines a ON UPPER(f.airline) = a.icao
        WHERE 1=1
        {user_filter}
        {id_filter}
        {date_filter}
        ORDER BY f.{sort.value} {order.value}
        LIMIT {limit}
        OFFSET {offset};"""

    res = database.execute_read_query(query);

    # get rid of origin, destination, and airline ICAOs for proper conversion
    # after this, each flight_db is in the format:
    # [id, username, date, departure_time, ..., AirportModel, AirportModel, AirlineModel]
    res = [ db_flight[:3] + db_flight[5:15] + db_flight[16:] for db_flight in res ]

    flights = []

    for db_flight in res:
        begin = len(FlightModel.get_attributes()) - 3
        airport_length = len(AirportModel.get_attributes())
        airline_length = len(AirlineModel.get_attributes())

        db_origin = db_flight[begin:begin + airport_length]
        db_destination = db_flight[begin + airport_length:begin + 2*airport_length]
        db_airline = db_flight[begin + 2*airport_length:begin + 2*airport_length + airline_length]

        origin = AirportModel.from_database(db_origin)
        destination = AirportModel.from_database(db_destination)
        airline = AirlineModel.from_database(db_airline) if db_airline[0] != None else None

        flight = FlightModel.from_database(db_flight, { "origin": origin, 
                                                        "destination": destination,
                                                        "airline": airline } )

        if not metric and flight.distance:
            flight.distance = round(flight.distance * 0.6213711922)

        flights.append(flight)

    if id and not flights:
        raise HTTPException(status_code=404, detail=f"Flight not found.")

    if id:
        return FlightModel.model_validate(flights[0])
    return [ FlightModel.model_validate(flight) for flight in flights ]
