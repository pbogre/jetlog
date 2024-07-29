import datetime
import time
from pydantic import BaseModel, field_validator
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
    def from_database(cls, db: tuple, explicit: dict|None = None):
        columns = cls.get_attributes()
        values = {}

        i = 0
        for attr in columns:
            if not explicit or attr not in explicit:
                value = db[i] if i < len(db) else None
                values[attr] = value
                i += 1

        if explicit:
            for attr in explicit:
                values[attr] = explicit[attr]

        instance = cls(**values)


        return instance

    @classmethod
    def get_attributes(cls, with_id: bool = True) -> list[str]:
        attributes = list(cls.__fields__.keys())

        if with_id:
            return attributes

        return attributes[1:]

    @classmethod
    def validate_single_field(cls, key, value):
        cls.__pydantic_validator__.validate_assignment(cls.model_construct(), key, value)

    def empty(self) -> bool:
        columns = self.get_attributes()

        for attr in columns:
            if getattr(self, attr) != None:
               return False

        return True

class SeatType(str, Enum):
    WINDOW = "window"
    MIDDLE = "middle"
    AISLE = "aisle"

class AirportModel(CustomModel):
    icao:      str
    iata:      str|None # some airports don't have a IATA
    name:      str
    city:      str
    country:   str
    latitude:  float
    longitude: float

    @field_validator('icao')
    @classmethod
    def icao_must_exist(cls, v) -> str|None:
        from server.database import database

        if not v:
            return None

        res = database.execute_read_query(f"SELECT icao FROM airports WHERE LOWER(icao) = LOWER(?);", [v]);

        if len(res) < 1:
            raise ValueError(f"must have valid ICAO code, got '{v}'")

        return v

# note: for airports, the database type
# is string (icao code), while the type
# returned by the API is AirportModel
class FlightModel(CustomModel):
    # all optional to accomodate patch
    id:             int|None = None
    date:           datetime.date|None = None
    origin:         AirportModel|str|None = None
    destination:    AirportModel|str|None = None
    departure_time: str|None = None
    arrival_time:   str|None = None
    seat:           SeatType|None = None
    duration:       int|None = None
    distance:       int|None = None
    airplane:       str|None = None
    flight_number:  str|None = None
    notes:          str|None = None

    @field_validator('origin', 'destination')
    @classmethod
    def airport_must_exist(cls, v) -> str|AirportModel|None:
        if not v:
            return None

        icao = v.icao if type(v) == AirportModel else v
        AirportModel.validate_single_field('icao', icao) 

        return v

    @field_validator('departure_time', 'arrival_time')
    @classmethod
    def time_must_be_hh_mm(cls, v) -> str|None:
        if not v:
            return None

        try:
            time.strptime(v, '%H:%M')
            assert len(v) == 5
        except:
            raise ValueError(f"must be in HH:MM format, got '{v}'")

        return v

    def get_values(self) -> list:
        values = []

        for attr in FlightModel.get_attributes(False):
            value = getattr(self, attr)

            if attr == "origin" or attr == "destination":
                if type(value) == AirportModel:
                    value = value.icao

            values.append(value)

        return values

class StatisticsModel(CustomModel):
    amount:                 int|None = None
    time:                   int|None = None
    distance:               int|None = None
    dpf:                    float|None = None
    unique_airports:        int|None = None
    common_airport:         AirportModel|None = None
    common_seat:            SeatType|None = None
