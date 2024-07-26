import datetime
from server.models import FlightModel, SeatType
from server.routers.flights import add_flight
from fastapi import APIRouter, HTTPException, UploadFile
from enum import Enum

router = APIRouter(
    prefix="/importing",
    tags=["importing"],
    redirect_slashes=True
)

class CSVType(str, Enum):
    MYFLIGHTRADAR24 = "myflightradar24"
    CUSTOM = "custom"

@router.post("", status_code=202)
async def import_csv(csv_type: CSVType, file: UploadFile):
    imported_flights: list[FlightModel] = []
    failed_imports: dict[int, Exception] = {}

    if csv_type == CSVType.MYFLIGHTRADAR24:
        count = 0
        for line in file.file:
            line = line.decode()

            if line == '\n':
                continue

            # check that columns are valid
            if count == 0:
                columns = line.split(',')
                columns = [ col.replace('"', '').replace('\n', '') for col in columns ]
                try:
                    expected = ["Date", "Flight number", "From", "To", "Dep time", "Arr time",
                                "Duration", "Airline", "Aircraft", "Registration", "Seat number",
                                "Seat type", "Flight class", "Flight reason", "Note", "Dep_id",
                                "Arr_id", "Airline_id", "Aircraft_id"]

                    for i in range(len(columns)):
                        assert columns[i] == expected[i], f"Expected column '{expected[i]}', got '{columns[i]}'"

                except AssertionError as e:
                    raise HTTPException(status_code=400, detail=f"Invalid MyFlightRadar24 CSV: {e}")

                count += 1
                continue

            values = line.split(',')
            try:
                flight = FlightModel()
                flight.date = datetime.date.fromisoformat(values[0])
                flight.origin = values[2][-6:-2]
                flight.destination = values[3][-6:-2]
                flight.departure_time = values[4][:5] if values[4][:5] != "00:00" else None
                flight.arrival_time = values[5][:5] if values[4][:5] != "00:00" else None
                # from myflightradar24, 0=none, 1=window, 2=middle, 3=aisle
                flight.seat = list(SeatType)[int(values[11]) - 1] if int(values[11]) > 0 else None
                # conversion from hh:mm:ss to minutes
                flight.duration = int(values[6][:2]) * 60 + int(values[6][3:5]) 
                flight.distance = None # would need longitude and latitude
                flight.airplane = values[8].replace('"', '') if values[8] != '" ()"' else None

                imported_flights.append(flight)
            except Exception as e:
                failed_imports[count] = e

            count += 1

    if failed_imports:
        print(f"Import failures: {failed_imports}")

    for flight in imported_flights:
        res = await add_flight(flight)
        print(f"Successfully added flight, id={res}")
