from pydantic import BaseModel
from enum     import Enum

#  camel case convertion
def camel_case(snake_case: str) -> str:
    segments = [segment for segment in snake_case.split('_')]
    return segments[0] + ''.join([segment.capitalize() for segment in segments[1:]])

class CamelableModel(BaseModel):
    class Config:
        alias_generator = camel_case
        populate_by_name = True
        from_attributes = True

class SeatType(str, Enum):
    AISLE = "aisle"
    MIDDLE = "middle"
    WINDOW = "window"

class CustomModel(CamelableModel):
    @classmethod
    def from_database(cls, db_flight: tuple):
        flight = cls()

        i = 0
        for attr in cls.get_attributes():
            value = db_flight[i] if db_flight[i] != None else None
            setattr(flight, attr, value)
            i += 1

        return flight

    @classmethod
    def get_attributes(cls, with_id: bool = True) -> list[str]:
        attributes = list(cls.__fields__.keys())

        if with_id:
            return attributes

        return attributes[1:]

# TODO distance travelled, etc.
class FlightModel(CustomModel):
    id:             int|None = None
    date:           str|None = None
    origin:         str|None = None
    destination:    str|None = None
    departure_time: str|None = None
    arrival_time:   str|None = None
    seat:           SeatType|None = None
    duration:       int|None = None
    airplane:       str|None = None
    flight_number:  str|None = None

class AirportModel(CustomModel):
    icao:      str|None = None
    iata:      str|None = None
    name:      str|None = None
    city:      str|None = None
    country:   str|None = None
    latitude:  float|None = None
    longitude: float|None = None
