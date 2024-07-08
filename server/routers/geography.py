from server.database import database
from models import CustomModel 
from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(
    prefix="/geography",
    tags=["geography"],
    redirect_slashes=True
)

class Coord(CustomModel):
    latitude: float|None = None
    longitude: float|None = None

    def __eq__(self, other) -> bool:
        return self.latitude == other.latitude and self.longitude == other.longitude

class Trajectory(CustomModel):
    first: Coord|None = None
    second: Coord|None = None

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
async def get_airport_markers() -> list[Coord]:
    query = """
        SELECT o.latitude, o.longitude, d.latitude, d.longitude
        FROM flights f
        JOIN airports o ON f.origin = o.icao 
        JOIN airports d ON f.destination = d.icao"""

    res = database.execute_read_query(query);

    coordinates = []

    for airport_pair in res:
        origin_data = airport_pair[:2]
        origin_coords = Coord.from_database(origin_data)
        origin_coords = Coord.model_validate(origin_coords)

        if origin_coords not in coordinates:
            coordinates.append(origin_coords)

        destination_coords= airport_pair[2:]
        destination_coords = Coord.from_database(destination_coords)
        destination_coords = Coord.model_validate(destination_coords)

        if destination_coords not in coordinates:
            coordinates.append(destination_coords)

    return coordinates

@router.get("/lines", status_code=200)
async def get_flight_trajectories() -> list[Trajectory]:
    query = """
        SELECT DISTINCT o.latitude, o.longitude, d.latitude, d.longitude
        FROM flights f
        JOIN airports o ON f.origin = o.icao 
        JOIN airports d ON f.destination = d.icao"""

    res = database.execute_read_query(query);

    lines = []

    for airport_pair in res:
        origin_data = airport_pair[:2]
        origin_coords = Coord.from_database(origin_data)
        origin_coords = Coord.model_validate(origin_coords)

        destination_coords= airport_pair[2:]
        destination_coords = Coord.from_database(destination_coords)
        destination_coords = Coord.model_validate(destination_coords)

        line = Trajectory(first=origin_coords, second=destination_coords)
        
        unique = True
        for l in lines:
            if l == line:
                unique = False
                break

        if unique:
            lines.append(line)

    return lines
