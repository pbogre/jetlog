from server.database import database
from server.models import User
from server.auth.users import get_current_user

from models import CustomModel
from fastapi import APIRouter, Depends
from pathlib import Path
import json

router = APIRouter(
    prefix="/geography",
    tags=["geography"],
    redirect_slashes=True
)

class Coord(CustomModel):
    latitude: float
    longitude: float
    frequency: int

    def __eq__(self, other) -> bool:
        return self.latitude == other.latitude and self.longitude == other.longitude

class Trajectory(CustomModel):
    first: Coord
    second: Coord
    frequency: int

    def __eq__(self, other) -> bool:
        if self.first == other.first and self.second == other.second:
            return True

        return self.first == other.second and self.second == other.first

@router.get("/world", status_code=200)
async def get_world_geojson(visited: bool = False, user: User = Depends(get_current_user)) -> object:
    geojson_path = Path(__file__).parent.parent.parent / 'data' / 'world.geo.json'
    geojson_content = geojson_path.read_text()
    geojson = json.loads(geojson_content)

    if visited:
        # compute and add 'visited' property to countries
        # this query selects all airports that:
        #   - are the destination of a flight without connection; or
        #   - are the origin of a flight which is not a connection of another flight
        query = """
            WITH visited_airports AS (
                SELECT destination AS icao
                FROM flights
                WHERE connection IS NULL
                AND username = ?

                UNION

                SELECT origin AS icao
                FROM flights AS f
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM flights AS prev
                    WHERE prev.connection = f.id
                )
                AND username = ?
            )

            SELECT DISTINCT a.country
            FROM visited_airports AS va
            JOIN airports AS a ON a.icao = va.icao;"""

        res = database.execute_read_query(query, [user.username]*2)
        visited_countries = [ r[0] for r in res ]

        for feature in geojson.get("features", []):
            country_name = feature.get("properties", {}).get("subunit")
            feature["properties"]["visited"] = country_name in visited_countries

    return geojson

@router.get("/decorations", status_code=200)
async def get_flights_decorations(flight_id: int|None = None, user: User = Depends(get_current_user)) -> tuple[list[Trajectory], list[Coord]]:
    flight_filter = f" AND f.id = {flight_id}" if flight_id != None else ""

    query = f"""
        SELECT o.latitude, o.longitude,
               d.latitude, d.longitude,
               f.connection
        FROM flights f
        JOIN airports o ON UPPER(f.origin) = o.icao
        JOIN airports d ON UPPER(f.destination) = d.icao
        WHERE username = ?
        {flight_filter};"""

    res = database.execute_read_query(query, [user.username]);

    lines: list[Trajectory] = []
    coordinates: list[Coord] = []

    for row in res:
        # this is so that we don't count
        # connection airports twice in
        # marker frequencies
        has_connection = row[4] != None

        origin_data = row[:2]
        origin_coords = Coord.from_database(origin_data, explicit={'frequency': 1})
        origin_coords = Coord.model_validate(origin_coords)

        destination_coords= row[2:4]
        destination_coords = Coord.from_database(destination_coords, explicit={'frequency': 1})
        destination_coords = Coord.model_validate(destination_coords)

        line = Trajectory(first=origin_coords, second=destination_coords, frequency=1)

        # compute marker frequencies
        found_origin = False
        found_destination = False
        for coord in coordinates:
            if coord == origin_coords:
                found_origin = True
                if coord.frequency != None:
                    coord.frequency += 1
            if coord == destination_coords:
                found_destination = True
                if coord.frequency != None and not has_connection:
                    coord.frequency += 1

            if found_origin and found_destination:
                break

        if not found_origin:
            coordinates.append(origin_coords)
        if not found_destination:
            coordinates.append(destination_coords)

        # compute trajectory frequencies
        found = False
        for l in lines:
            if l == line:
                found = True
                if l.frequency != None:
                    l.frequency += 1
                break

        if not found:
            lines.append(line)

    return lines, coordinates
