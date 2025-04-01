from server.database import database
from server.models import FlightModel

def flight_already_exists(flight: FlightModel, username: str) -> bool:
    result = database.execute_read_query(
        """
        SELECT 1 FROM flights
        WHERE username = ? AND date = ? AND origin = ? AND destination = ? AND flight_number = ?
        LIMIT 1;
        """,
        [username, flight.date, flight.origin, flight.destination, flight.flight_number]
    )
    return len(result) > 0
