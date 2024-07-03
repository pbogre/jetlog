from typing import overload
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

# abstract model
class CustomModel(CamelableModel):
    @classmethod
    def from_database(cls, db: tuple):
        flight = cls()

        i = 0
        for attr in cls.get_attributes():
            value = db[i] if db[i] != None else None
            setattr(flight, attr, value)
            i += 1

        return flight

    @classmethod
    def get_attributes(cls, with_id: bool = True) -> list[str]:
        attributes = list(cls.__fields__.keys())

        if with_id:
            return attributes

        return attributes[1:]

class SeatType(str, Enum):
    AISLE = "aisle"
    MIDDLE = "middle"
    WINDOW = "window"

class AirportModel(CustomModel):
    icao:      str|None = None
    iata:      str|None = None
    name:      str|None = None
    city:      str|None = None
    country:   str|None = None
    latitude:  float|None = None
    longitude: float|None = None

# TODO distance travelled, etc.
# note: for airports, the database type
# is string (icao code), while the type
# returned by the API is AirportModel
class FlightModel(CustomModel):
    id:             int|None = None
    date:           str|None = None
    origin:         str|AirportModel|None = None
    destination:    str|AirportModel|None = None
    departure_time: str|None = None
    arrival_time:   str|None = None
    seat:           SeatType|None = None
    duration:       int|None = None
    airplane:       str|None = None
    flight_number:  str|None = None

    @classmethod
    def from_database(cls, db: tuple, origin: AirportModel, destination: AirportModel):
        flight = cls()

        i = 0
        for attr in cls.get_attributes():
            value = db[i] if db[i] != None else None
            setattr(flight, attr, value)
            i += 1

        flight.origin = origin
        flight.destination = destination

        return flight
