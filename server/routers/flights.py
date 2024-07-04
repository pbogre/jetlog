from server.database import database
from server.models import AirportModel, FlightModel, StatisticsModel
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/flights",
    redirect_slashes=True
)

@router.post("", status_code=201)
async def add_flight(flight: FlightModel) -> int:
    if not (flight.date and flight.origin and flight.destination):
        raise HTTPException(status_code=404, 
                            detail="Insufficient flight data. Date, Origin, and Destination are required")

    columns = FlightModel.get_attributes(False)

    query = "INSERT INTO flights ("
    for attr in columns:
        query += f"{attr},"
    query = query[:-1]
    query += ") VALUES (" + ('?,' * len(columns))
    query = query[:-1]
    query += ") RETURNING id;"

    values = flight.get_values()

    print(values)

    return database.execute_query(query, values)

# TODO fix with airportmodel as airport input
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

# TODO: ability to limit to a time period ( where date between x and y )
@router.get("/statistics", status_code=200)
async def get_statistics():
    # this is atrocious. i am so sorry.
    # TODO i should just fetch all flights and do this in python
    res = database.execute_read_query("""
        SELECT COUNT(*), 

                SUM(duration),

                SUM(distance),

                ROUND(
                    ( ( SELECT JULIANDAY(date) FROM flights ORDER BY date DESC LIMIT 1 ) -
                      ( SELECT JULIANDAY(date) FROM flights ORDER BY date ASC LIMIT 1 ) 
                        * 1.0 
                    ) / ( ( SELECT COUNT(*) FROM flights ) * 1.0 )
                    , 2),

                ( SELECT COUNT(DISTINCT ap) FROM (
                    SELECT origin AS ap FROM flights
                    UNION ALL
                    SELECT destination as ap FROM flights
                    )
                ),

                ( SELECT seat FROM flights 
                    WHERE seat NOT NULL
                    GROUP BY seat
                    ORDER BY COUNT(*) DESC
                    LIMIT 1 
                ),

                common_airport.*

        FROM flights

        JOIN airports AS common_airport 
        ON icao = (
            SELECT ap
            FROM (
                SELECT origin AS ap FROM flights
                UNION ALL
                SELECT destination AS ap FROM flights
            )
            GROUP BY ap
            ORDER BY COUNT(*) DESC
            LIMIT 1
        );
    """)[0]

    start_airport = len(StatisticsModel.get_attributes()) - 1

    airport_db = res[start_airport:]
    airport = AirportModel.from_database(airport_db)

    stats = StatisticsModel.from_database(res[:start_airport], airport)
    return StatisticsModel.model_validate(stats)

# TODO query fields (limit, offset, year, etc.)
@router.get("", status_code=200)
async def get_all_flights() -> list[FlightModel]:
    res = database.execute_read_query("""
        SELECT f.*, o.*, d.*
        FROM flights f 
        JOIN airports o ON f.origin = o.icao 
        JOIN airports d ON f.destination = d.icao
        ORDER BY f.date DESC;""");

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
