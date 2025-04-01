from server.database import database

def get_icao_from_iata(iata: str) -> str | None:
    result = database.execute_read_query(
        "SELECT icao FROM airports WHERE LOWER(iata) = LOWER(?);",
        [iata.strip()]
    )
    return result[0][0] if result else None
