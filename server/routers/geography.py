from server.database import database
from server.auth.auth import get_current_user

from models import CustomModel 
from fastapi import APIRouter, Depends
from pathlib import Path
import json

from server.models import User

router = APIRouter(
    prefix="/geography",
    tags=["geography"],
    redirect_slashes=True
)

class Coord(CustomModel):
    latitude: float
    longitude: float
    frequency: int|None = None

    def __eq__(self, other) -> bool:
        return self.latitude == other.latitude and self.longitude == other.longitude

class Trajectory(CustomModel):
    first: Coord
    second: Coord
    frequency: int|None = None

    def __eq__(self, other) -> bool:
        if self.first == other.first and self.second == other.second:
            return True

        return self.first == other.second and self.second == other.first

@router.get("/world", status_code=200)
async def get_world_geojson() -> object:
    geojson_path = Path(__file__).parent.parent.parent / 'data' / 'world.geo.json'
    geojson_content = geojson_path.read_text()
    
    return json.loads(geojson_content)

@router.get("/markers", status_code=200)
async def get_airport_markers(user: User = Depends(get_current_user)) -> list[Coord]:
    query = f"""
        SELECT o.latitude, o.longitude, d.latitude, d.longitude
        FROM flights f
        JOIN airports o ON UPPER(f.origin) = o.icao
        JOIN airports d ON UPPER(f.destination) = d.icao
        WHERE username = ?;"""

    res = database.execute_read_query(query, [user.username]);

    coordinates: list[Coord] = []

    for airport_pair in res:
        origin_data = airport_pair[:2]
        origin_coords = Coord.from_database(origin_data, explicit={'frequency': 1})
        origin_coords = Coord.model_validate(origin_coords)
 
        destination_coords= airport_pair[2:]
        destination_coords = Coord.from_database(destination_coords, explicit={'frequency': 1})
        destination_coords = Coord.model_validate(destination_coords)

        found_origin = False
        found_destination = False
        for coord in coordinates:
            if coord == origin_coords:
                found_origin = True
                if coord.frequency != None:
                    coord.frequency += 1
            if coord == destination_coords:
                found_destination = True
                if coord.frequency != None:
                    coord.frequency += 1

            if found_origin and found_destination:
                break

        if not found_origin:
            coordinates.append(origin_coords)
        if not found_destination:
            coordinates.append(destination_coords)

    return coordinates

@router.get("/lines", status_code=200)
async def get_flight_trajectories(user: User = Depends(get_current_user)) -> list[Trajectory]:
    query = f"""
        SELECT o.latitude, o.longitude, d.latitude, d.longitude
        FROM flights f
        JOIN airports o ON UPPER(f.origin) = o.icao 
        JOIN airports d ON UPPER(f.destination) = d.icao
        WHERE username = ?;"""

    res = database.execute_read_query(query, [user.username]);

    lines: list[Trajectory] = []

    for airport_pair in res:
        origin_data = airport_pair[:2]
        origin_coords = Coord.from_database(origin_data)
        origin_coords = Coord.model_validate(origin_coords)

        destination_coords= airport_pair[2:]
        destination_coords = Coord.from_database(destination_coords)
        destination_coords = Coord.model_validate(destination_coords)

        line = Trajectory(first=origin_coords, second=destination_coords, frequency=1)
 
        found = False
        for l in lines:
            if l == line:
                found = True
                if l.frequency != None:
                    l.frequency += 1
                break

        if not found:
            lines.append(line)

    return lines
