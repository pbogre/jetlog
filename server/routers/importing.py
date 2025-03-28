from server.models import FlightModel, FlightPurpose, SeatType, ClassType, User
from server.routers.flights import add_flight
from server.internal.airport_utils import get_icao_from_iata
from server.internal.flight_utils import flight_already_exists
from server.auth.users import get_current_user

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from enum import Enum
import datetime
import csv
import io

router = APIRouter(
    prefix="/importing",
    tags=["importing/exporting"],
    redirect_slashes=True
)

class CSVType(str, Enum):
    MYFLIGHTRADAR24 = "myflightradar24"
    FLIGHTY = "flighty"
    CUSTOM = "custom"

@router.post("", status_code=202)
async def import_CSV(csv_type: CSVType,
                     file: UploadFile,
                     user: User = Depends(get_current_user)):
    imported_flights: list[FlightModel] = []
    fail_count = 0

    csv_data = io.TextIOWrapper(file.file, encoding='utf-8', newline='')
    reader = csv.reader(csv_data, quotechar='"', delimiter=',')

    print(f"Parsing CSV into flights...")
    if csv_type == CSVType.MYFLIGHTRADAR24:
        import re
        count = 0

        for row in reader:
            # check for empty rows
            if not row or all(col.strip() == "" for col in row):
                continue

            # check that columns are valid
            if count == 0:
                columns = [ col.replace('"', '').rstrip('\r\n') for col in row ]
                try:
                    expected = ["Date", "Flight number", "From", "To", "Dep time", "Arr time",
                                "Duration", "Airline", "Aircraft", "Registration", "Seat number",
                                "Seat type", "Flight class", "Flight reason", "Note", "Dep_id",
                                "Arr_id", "Airline_id", "Aircraft_id"]

                    for i in range(len(columns)):
                        assert columns[i] == expected[i], f"Expected column '{expected[i]}', got '{columns[i]}'"

                except AssertionError as e:
                    print("Importing aborted")
                    raise HTTPException(status_code=400, detail=f"Invalid MyFlightRadar24 CSV: {e}")

                count += 1
                continue

            ticket_class_conversion = {
                "1": ClassType.ECONOMY,
                "4": ClassType.ECONOMYPLUS,
                "2": ClassType.BUSINESS,
                "3": ClassType.FIRST,
                "5": ClassType.PRIVATE
            }

            values = row
            values_dict = {}
            try:
                values_dict['date'] = datetime.date.fromisoformat(values[0])
                values_dict['origin'] = values[2][-5:-1] if values[2] else None
                values_dict['destination'] = values[3][-5:-1] if values[3] else None
                values_dict['departure_time'] = values[4][:5] if values[4][:5] != "00:00" else None
                values_dict['arrival_time'] = values[5][:5] if values[4][:5] != "00:00" else None
                # from myflightradar24, 0=none, 1=window, 2=middle, 3=aisle
                values_dict['seat'] = list(SeatType)[int(values[11]) - 1] if int(values[11]) > 0 else None
                values_dict['ticket_class'] = ticket_class_conversion[values[12]] if int(values[12]) > 0 else None
                # from myflightradar24, 0=none, 1=leisure, 2=business, 3=crew, 4=other
                values_dict['purpose'] = list(FlightPurpose)[int(values[13]) - 1] if int(values[13]) > 0 else None
                # conversion from hh:mm:ss to minutes
                values_dict['duration'] = int(values[6][:2]) * 60 + int(values[6][3:5]) 
                values_dict['airline'] = values[7][-4:-1] if values[7] != " (/)" else None
                values_dict['airplane'] = values[8] if values[8] != " ()" else None

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
        for row in reader:
            if not row or all(col.strip() == "" for col in row):
                continue

            if count == 0:
                columns = [ col.strip() for col in row]

                for i in range(len(columns)):
                    col = columns[i]

                    if col not in expected:
                        print("Importing aborted")
                        raise HTTPException(status_code=400, detail=f"Invalid column name '{col}'")

                    if col in present_columns:
                        print("Importing aborted")
                        raise HTTPException(status_code=400, detail=f"Duplicate column name '{col}'")

                    present_columns[col] = i

                print(f"Detected columns: {present_columns}")
                count += 1
                continue

            if "username" in present_columns and not user.is_admin:
                raise HTTPException(status_code=403, detail=f"Only admins can specify the 'username' column")

            values = row
            values = [ val.rstrip('\r\n').replace("\\n", "\n") if val != '' else None for val in values ] 
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

    elif csv_type == CSVType.FLIGHTY:
        count = 0
        header = []
        for row in reader:
            if not row or all(col.strip() == "" for col in row):
                continue

            if count == 0:
                header = [col.strip() for col in row]
                expected = ["Date", "Airline", "Flight", "From", "To", "Dep Terminal", "Dep Gate", "Arr Terminal", "Arr Gate", "Canceled", "Diverted To", "Gate Departure (Scheduled)", "Gate Departure (Actual)", "Take off (Scheduled)", "Take off (Actual)", "Landing (Scheduled)", "Landing (Actual)", "Gate Arrival (Scheduled)", "Gate Arrival (Actual)", "Aircraft Type Name", "Tail Number", "PNR", "Seat", "Seat Type", "Cabin Class", "Flight Reason", "Notes", "Flight Flighty ID", "Airline Flighty ID", "Departure Airport Flighty ID", "Arrival Airport Flighty ID", "Diverted To Airport Flighty ID", "Aircraft Type Flighty ID"]
                if header != expected:
                    raise HTTPException(status_code=400, detail="Flighty CSV columns do not match expected structure")
                count += 1
                continue

            row_data = dict(zip(header, row))

            if row_data["Canceled"].strip().lower() == "true":
                print(f"[{count}] Skipped cancelled flight.")
                count += 1
                continue
            arrival_str = row_data["Gate Arrival (Actual)"].strip()
            if not arrival_str:
                print(f"[{count}] Skipped flight with no actual arrival time.")
                count += 1
                continue

            try:
                values_dict = {}

                values_dict['date'] = datetime.date.fromisoformat(row_data["Date"])
                values_dict['airline'] = row_data["Airline"]
                values_dict['flight_number'] = row_data["Flight"]

                # ICAO code conversion
                origin_icao = get_icao_from_iata(row_data["From"])
                destination_icao = get_icao_from_iata(row_data["To"])
                if not origin_icao or not destination_icao:
                    raise ValueError(f"Unknown IATA code(s): origin='{row_data['From']}', destination='{row_data['To']}'")
                values_dict['origin'] = origin_icao
                values_dict['destination'] = destination_icao

                # Times
                values_dict['departure_time'] = row_data["Gate Departure (Actual)"][11:16] if row_data["Gate Departure (Actual)"] else None
                values_dict['arrival_time'] = row_data["Gate Arrival (Actual)"][11:16] if row_data["Gate Arrival (Actual)"] else None

                # Plane & tail number
                values_dict['airplane'] = row_data["Aircraft Type Name"] if row_data["Aircraft Type Name"] else None
                values_dict['tail_number'] = row_data["Tail Number"] if row_data["Tail Number"] else None

                # Seat type (window/middle/aisle)
                seat_type_map = {
                    "window": SeatType.WINDOW,
                    "middle": SeatType.MIDDLE,
                    "aisle": SeatType.AISLE
                }
                seat_raw = row_data["Seat Type"].strip().lower()
                if seat_raw in seat_type_map:
                    values_dict['seat'] = seat_type_map[seat_raw]

                ticket_class_conversion = {
                    "BUSINESS": ClassType.BUSINESS,
                    "FIRST": ClassType.FIRST,
                    "ECONOMY": ClassType.ECONOMY,
                    "PREMIUM_ECONOMY": ClassType.ECONOMYPLUS,
                    "PRIVATE": ClassType.PRIVATE
                }

                class_raw = row_data["Cabin Class"].strip().upper()
                if class_raw in ticket_class_conversion:
                    values_dict['ticket_class'] = ticket_class_conversion[class_raw]

                if row_data["Flight Reason"] and row_data["Flight Reason"].isdigit():
                    values_dict['purpose'] = list(FlightPurpose)[int(row_data["Flight Reason"]) - 1]

                # Notes + append other flighty data
                notes = row_data["Notes"].strip() if row_data["Notes"] else ""
                seat_number = row_data["Seat"].strip() if row_data["Seat"] else ""

                append_lines = []

                if seat_number:
                   append_lines.append(f"Seat: {seat_number}")

                if row_data["Dep Terminal"]:
                    append_lines.append(f"Dep Terminal: {row_data['Dep Terminal']}")
                if row_data["Dep Gate"]:
                    append_lines.append(f"Dep Gate: {row_data['Dep Gate']}")
                if row_data["Arr Terminal"]:
                    append_lines.append(f"Arr Terminal: {row_data['Arr Terminal']}")
                if row_data["Arr Gate"]:
                    append_lines.append(f"Arr Gate: {row_data['Arr Gate']}")

                if append_lines:
                    notes += ("\n" if notes else "") + "\n".join(append_lines)

                values_dict['notes'] = notes if notes else None

                flight = FlightModel(**values_dict)
                if flight_already_exists(flight, user.username):
                    print(f"[{count}] Skipped duplicate flight.")
                    count += 1
                    continue

                imported_flights.append(flight)

            except Exception as e:
                print(f"[{count}] Failed to parse: '{e}'")
                fail_count += 1

    print(f"Parsing process complete with {fail_count} failures")


    print(f"Importing {len(imported_flights)} flights...")
    for i in range(len(imported_flights)):
        progress = f"[{i+1}/{len(imported_flights)}]" 
        try:
            res = await add_flight(imported_flights[i], user=user)
            print(f"{progress} Successfully added flight (id: {res})")
        except HTTPException as e:
            print(f"{progress} Failed import: {e.detail}")
            fail_count += 1

    print(f"Importing process complete with {fail_count} total failures")
