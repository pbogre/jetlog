import datetime

from server.database import database
from server.models import FlightModel

# Requests authenticate through the AUTH_HEADER flow (no JWT needed).
AUTH_HEADERS = {"X-Test-User": "admin"}


def insert_flight(**overrides) -> int:
    """Insert a flight row directly into the test database."""
    values = {
        "username": "admin",
        "date": datetime.date(2024, 5, 1),
        "origin": "EDDF",
        "destination": "EGLL",
        "departure_time": "08:30",
        "arrival_time": "09:45",
        "duration": 75,
        "notes": "old",
        **overrides,
    }
    flight = FlightModel(**values)
    columns = FlightModel.get_attributes(ignore=["id"])
    query = (
        "INSERT INTO flights (" + ", ".join(columns) + ") VALUES ("
        + ", ".join("?" for _ in columns) + ") RETURNING id;"
    )
    return database.execute_query(query, flight.get_values(ignore=["id"]))[0]
