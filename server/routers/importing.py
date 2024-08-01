import datetime

from server.models import FlightModel, SeatType
from server.routers.flights import add_flight
from fastapi import APIRouter, HTTPException, UploadFile
from enum import Enum

router = APIRouter(
    prefix="/importing",
    tags=["importing/exporting"],
    redirect_slashes=True
)

class CSVType(str, Enum):
    MYFLIGHTRADAR24 = "myflightradar24"
    CUSTOM = "custom"

@router.post("", status_code=202)
async def import_CSV(csv_type: CSVType, file: UploadFile):
    imported_flights: list[FlightModel] = []
    fail_count = 0

    print(f"Parsing CSV into flights...")
    if csv_type == CSVType.MYFLIGHTRADAR24:
        count = 0
        for line in file.file:
            line = line.decode()

            if line == '\n':
                continue

            # check that columns are valid
            if count == 0:
                columns = line.split(',')
                columns = [ col.replace('"', '').rstrip('\r\n') for col in columns ]
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
            values_dict = {}
            try:
                flight = FlightModel()
                values_dict['date'] = datetime.date.fromisoformat(values[0])
                values_dict['origin'] = values[2][-6:-2]
                values_dict['destination'] = values[3][-6:-2]
                values_dict['departure_time'] = values[4][:5] if values[4][:5] != "00:00" else None
                values_dict['arrival_time'] = values[5][:5] if values[4][:5] != "00:00" else None
                # from myflightradar24, 0=none, 1=window, 2=middle, 3=aisle
                values_dict['seat'] = list(SeatType)[int(values[11]) - 1] if int(values[11]) > 0 else None
                # conversion from hh:mm:ss to minutes
                values_dict['duration'] = int(values[6][:2]) * 60 + int(values[6][3:5]) 
                values_dict['airplane'] = values[8].replace('"', '') if values[8] != '" ()"' else None

                flight = FlightModel(**values_dict)
                imported_flights.append(flight)
            except Exception as e:
                print(f"[{count}] Failed to parse: '{e}'")
                fail_count += 1

            count += 1

    elif csv_type == CSVType.CUSTOM:
        expected = FlightModel.get_attributes()
        present_columns: dict[str, int] = {}

        count = 0
        for line in file.file:
            line = line.decode()

            if line == '\n':
                continue

            if count == 0:
                columns = line.split(',')
                columns = [ col.rstrip('\r\n') for col in columns ]

                for i in range(len(columns)):
                    col = columns[i]

                    if col not in expected:
                        print(f"Unidentifiable column name '{col}', skipping column...")
                        continue

                    if col in present_columns:
                        print(f"Duplicate column name '{col}', using first instance...")
                        continue

                    present_columns[col] = i

                print(f"Detected columns: {present_columns}")
                count += 1
                continue

            values = line.split(',')
            values = [ val.rstrip('\r\n') if val != '' else None for val in values ] 
            values_dict = {}
            try:
                assert len(values) == len(present_columns), f"Expected {len(present_columns)} entries, got {len(values)}"

                for key in present_columns:
                    attr_index = present_columns[key]
                    values_dict[key] = values[attr_index]

                flight = FlightModel(**values_dict)
                imported_flights.append(flight)

            except Exception as e:
                print(f"[{count}] Failed to parse: '{e}'")
                fail_count += 1

            count += 1

    print(f"Parsing process complete with {fail_count} failures")


    print(f"Importing {len(imported_flights)} flights...")
    for i in range(len(imported_flights)):
        progress = f"[{i+1}/{len(imported_flights)}]" 
        try:
            res = await add_flight(imported_flights[i])
            print(f"{progress} Successfully added flight (id: {res})")
        except HTTPException as e:
            print(f"{progress} Failed import: {e.detail}")
            fail_count += 1

    print(f"Importing process complete with {fail_count} total failures")
