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
    def get_attributes(cls, ignore: list = []) -> list[str]:
        attributes = list(cls.__fields__.keys())

        for ignored_attr in ignore:
            attributes.remove(ignored_attr)

        return attributes 

    def get_values(self, ignore: list = [], explicit: dict = {}) -> list:
        values = []

        for attr in self.get_attributes(ignore):
            if attr in explicit:
                values.append(explicit[attr])
                continue

            value = getattr(self, attr)

            enum_classes = [SeatType, ClassType, AircraftSide, FlightPurpose]

            if type(value) == AirportModel or type(value) == AirlineModel:
                value = value.icao
            elif type(value) == datetime.date:
                value = value.isoformat()
            elif type(value) in enum_classes:
                value = value.value

            values.append(value)

        return values

    @classmethod
    def validate_single_field(cls, key, value):
        cls.__pydantic_validator__.validate_assignment(cls.model_construct(), key, value)

    def empty(self) -> bool:
        columns = self.get_attributes()

        for attr in columns:
            if getattr(self, attr) != None:
               return False

        return True

class User(CustomModel):
    id:            int
    username:      str
    password_hash: str
    is_admin:      bool
    last_login:    datetime.datetime|None
    created_on:    datetime.datetime

class SeatType(str, Enum):
    WINDOW = "window"
    MIDDLE = "middle"
    AISLE = "aisle"

class AircraftSide(str, Enum):
    LEFT = "left"
    RIGHT = "right"
    CENTER = "center"

class FlightPurpose(str, Enum):
    LEISURE = "leisure"
    BUSINESS = "business"
    CREW = "crew"
    OTHER = "other"

class ClassType(str, Enum):
    PRIVATE = "private"
    FIRST = "first"
    BUSINESS = "business"
    ECONOMYPLUS = "economy+"
    ECONOMY = "economy"

class AirportType(str, Enum):
    CLOSED = "closed"
    LARGE = "large_airport"
    MEDIUM = "medium_airport"
    SMALL = "small_airport"
    SEAPLANE = "seaplane_base"
    HELIPORT = "heliport"

class AirportModel(CustomModel):
    icao:         str
    iata:         str|None
    type:         AirportType
    name:         str
    municipality: str|None
    region:       str
    country:      str
    continent:    str
    latitude:     float
    longitude:    float
    timezone:     str

    @field_validator('icao')
    @classmethod
    def icao_must_exist(cls, v) -> str|None:
        from server.database import database

        if v == None:
            return None

        res = database.execute_read_query(f"SELECT icao FROM airports WHERE LOWER(icao) = LOWER(?);", [v]);

        if len(res) < 1:
            raise ValueError(f"must have valid ICAO code, got '{v}'")

        return v

class AirlineModel(CustomModel):
    icao: str
    iata: str|None=None
    name: str

    @field_validator('icao')
    @classmethod
    def icao_must_exist(cls, v) -> str|None:
        from server.database import database

        if v == None:
            return None

        res = database.execute_read_query(f"SELECT icao FROM airlines WHERE LOWER(icao) = LOWER(?);", [v])

        if len(res) < 1:
            raise ValueError(f"must have valid ICAO code, got '{v}'")

        return v


class FlightModel(CustomModel):
    id:               int|None = None
    username:         str|None = None
    date:             datetime.date
    origin:           AirportModel|str # API uses AirportModel/str, database uses str
    destination:      AirportModel|str
    departure_time:   str|None = None
    arrival_time:     str|None = None
    arrival_date:     datetime.date|None = None
    seat:             SeatType|None = None
    aircraft_side:    AircraftSide|None = None
    ticket_class:     ClassType|None = None
    purpose:          FlightPurpose|None = None
    duration:         int|None = None
    distance:         int|None = None
    airplane:         str|None = None
    airline:          AirlineModel|str|None = None
    tail_number:      str|None = None
    flight_number:    str|None = None
    notes:            str|None = None
    connection:       int|None = None
    layover_duration: int|None = None

    @field_validator('origin', 'destination')
    @classmethod
    def airport_must_exist(cls, v) -> str|AirportModel|None:
        if v == None:
            return None

        icao = v.icao if type(v) == AirportModel else v
        AirportModel.validate_single_field('icao', icao) 

        return v

    @field_validator('airline')
    @classmethod
    def airline_must_exist(cls, v) -> str|AirlineModel|None:
        if v == None:
            return None

        icao = v.icao if type(v) == AirlineModel else v
        AirlineModel.validate_single_field('icao', icao)

        return v

    @field_validator('departure_time', 'arrival_time')
    @classmethod
    def time_must_be_hh_mm(cls, v) -> str|None:
        if v == None:
            return None

        try:
            time.strptime(v, '%H:%M')
            assert len(v) == 5
        except:
            raise ValueError(f"must be in HH:MM format, got '{v}'")

        return v

    @field_validator('username')
    @classmethod
    def user_must_exist(cls, v) -> str|None:
        if v == None:
            return None

        from server.database import database

        res = database.execute_read_query("SELECT 1 FROM users WHERE username = ?;", [v])

        if len(res) < 1:
            raise ValueError(f"must have valid username, got '{v}'")

        return v

    #@field_validator('connection')
    #@classmethod
    #def connection_must_exist(cls, v) -> int|None:
    #    from server.database import database

    #    res = database.execute_read_query("SELECT 1 FROM flights WHERE id = ?;", [v])

    #    if len(res) < 1:
    #        raise ValueError(f"must have valid connection flight id, got '{v}'")

    #    return v

class StatisticsModel(CustomModel):
    total_flights:          int
    total_duration:         int
    total_distance:         int
    total_unique_airports:  int
    days_range:             int
    most_visited_airports:  dict
    seat_frequency:         dict
    ticket_class_frequency: dict
    most_common_airlines: dict
