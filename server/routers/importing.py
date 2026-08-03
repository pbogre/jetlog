from pydantic import BaseModel
from server.models import FlightModel, FlightPurpose, SeatType, ClassType, User
from server.routers.flights import add_flight, complete_flight_metrics
from server.internal.airport_utils import get_icao_from_iata
from server.internal.flight_utils import (
    COMPARE_FIELDS,
    classify_duplicate,
    find_existing_flight,
)
from server.auth.users import get_current_user
from server.database import database

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

class ImportRowStatus(str, Enum):
    NEW = "new"
    IDENTICAL = "identical"
    MERGEABLE = "mergeable"
    CONFLICT = "conflict"

class ImportAction(str, Enum):
    INSERT = "insert"
    MERGE = "merge"
    OVERWRITE = "overwrite"
    IGNORE = "ignore"

class ImportRow(BaseModel):
    index: int
    status: ImportRowStatus
    flight: dict
    match_id: int | None = None
    ambiguous: bool = False
    conflicts: list[str] = []
    gaps: list[str] = []
    existing: dict | None = None

class ImportApplyRow(BaseModel):
    index: int
    action: ImportAction
    flight: dict
    match_id: int | None = None

class ImportApplyRequest(BaseModel):
    rows: list[ImportApplyRow]


def _parse_myflightradar24(reader) -> tuple[list[tuple[int, FlightModel]], int]:
    imported_flights: list[tuple[int, FlightModel]] = []
    fail_count = 0
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
            values_dict['arrival_time'] = values[5][:5] if values[5][:5] != "00:00" else None
            # from myflightradar24, 0=none, 1=window, 2=middle, 3=aisle
            values_dict['seat'] = list(SeatType)[int(values[11]) - 1] if int(values[11]) > 0 else None
            values_dict['ticket_class'] = ticket_class_conversion[values[12]] if int(values[12]) > 0 else None
            # from myflightradar24, 0=none, 1=leisure, 2=business, 3=crew, 4=other
            values_dict['purpose'] = list(FlightPurpose)[int(values[13]) - 1] if int(values[13]) > 0 else None
            # conversion from hh:mm:ss to minutes
            values_dict['duration'] = int(values[6][:2]) * 60 + int(values[6][3:5])
            # MyFlightRadar24 writes airlines as "Name (IATA)"; the flight model
            # stores ICAO codes, so resolve the code and fall back gracefully.
            airline_code = None
            if values[7]:
                code_start = values[7].rfind("(")
                code_end = values[7].rfind(")")
                if code_start != -1 and code_end > code_start:
                    airline_code = values[7][code_start + 1:code_end].strip()
            if airline_code:
                found = database.execute_read_query(
                    "SELECT icao FROM airlines WHERE LOWER(icao) = LOWER(?) OR LOWER(iata) = LOWER(?);",
                    [airline_code, airline_code],
                )
                values_dict['airline'] = found[0][0] if found else None
            else:
                values_dict['airline'] = None
            values_dict['airplane'] = values[8] if values[8] != " ()" else None
            values_dict['flight_number'] = values[1] if values[1] else None

            flight = FlightModel(**values_dict)
            imported_flights.append((count, flight))
        except Exception as e:
            print(f"[{count}] Failed to parse: '{e}'")
            fail_count += 1

        count += 1

    return imported_flights, fail_count


def _parse_custom(reader, user: User) -> tuple[list[tuple[int, FlightModel]], int]:
    imported_flights: list[tuple[int, FlightModel]] = []
    fail_count = 0
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

        if "connection" in present_columns:
            raise HTTPException(status_code=400, detail="Connection field can only be set after importing flights")

        values = row
        values = [ val.rstrip('\r\n').replace("\\n", "\n") if val != '' else None for val in values ]
        values_dict = {}
        try:
            assert len(values) == len(present_columns), f"Expected {len(present_columns)} entries, got {len(values)}"

            for key in present_columns:
                attr_index = present_columns[key]
                values_dict[key] = values[attr_index]

            flight = FlightModel(**values_dict)
            imported_flights.append((count, flight))

        except Exception as e:
            print(f"[{count}] Failed to parse: '{e}'")
            fail_count += 1

        count += 1

    return imported_flights, fail_count


def _parse_flighty(reader) -> tuple[list[tuple[int, FlightModel]], int]:
    imported_flights: list[tuple[int, FlightModel]] = []
    fail_count = 0
    count = 0
    header = []

    for row in reader:
        if not row or all(col.strip() == "" for col in row):
            continue

        if count == 0:
            header = [col.strip() for col in row]
            expected = ["Date", "Airline", "Flight", "From", "To", "Dep Terminal", "Dep Gate",
                        "Arr Terminal", "Arr Gate", "Canceled", "Diverted To", "Gate Departure (Scheduled)",
                        "Gate Departure (Actual)", "Take off (Scheduled)", "Take off (Actual)", "Landing (Scheduled)",
                        "Landing (Actual)", "Gate Arrival (Scheduled)", "Gate Arrival (Actual)", "Aircraft Type Name",
                        "Tail Number", "PNR", "Seat", "Seat Type", "Cabin Class", "Flight Reason", "Notes",
                        "Flight Flighty ID", "Airline Flighty ID", "Departure Airport Flighty ID",
                        "Arrival Airport Flighty ID", "Diverted To Airport Flighty ID", "Aircraft Type Flighty ID"]
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
            # Flighty exports airline names; the flight model stores ICAO codes.
            airline_name = row_data["Airline"].strip()
            if airline_name:
                found = database.execute_read_query(
                    "SELECT icao FROM airlines WHERE LOWER(name) = LOWER(?) LIMIT 1;",
                    [airline_name],
                )
                values_dict['airline'] = found[0][0] if found else None
            else:
                values_dict['airline'] = None
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
            imported_flights.append((count, flight))

        except Exception as e:
            print(f"[{count}] Failed to parse: '{e}'")
            fail_count += 1

        count += 1

    return imported_flights, fail_count


@router.post("", status_code=200)
async def import_CSV_preview(csv_type: CSVType,
                             file: UploadFile,
                             user: User = Depends(get_current_user)) -> dict:
    """Parse a CSV file and classify each row against existing flights.

    No data is written here; the client reviews the preview (and resolves any
    conflicting rows) before calling ``POST /importing/apply``.
    """
    csv_data = io.TextIOWrapper(file.file, encoding='utf-8', newline='')
    reader = csv.reader(csv_data, quotechar='"', delimiter=',')

    if csv_type == CSVType.MYFLIGHTRADAR24:
        parsed_flights, fail_count = _parse_myflightradar24(reader)
    elif csv_type == CSVType.CUSTOM:
        parsed_flights, fail_count = _parse_custom(reader, user)
    elif csv_type == CSVType.FLIGHTY:
        parsed_flights, fail_count = _parse_flighty(reader)
    else:
        raise HTTPException(status_code=400, detail="Unknown CSV type")

    rows: list[dict] = []
    counts = {status.value: 0 for status in ImportRowStatus}

    for index, flight in parsed_flights:
        existing, ambiguous = find_existing_flight(flight, user.username)

        if existing is None:
            row = ImportRow(
                index=index,
                status=ImportRowStatus.NEW,
                flight=flight.model_dump(mode="json"),
            )
        else:
            status, conflicts, gaps = classify_duplicate(existing, flight, ambiguous)
            row = ImportRow(
                index=index,
                status=status,
                flight=flight.model_dump(mode="json"),
                match_id=existing.id,
                ambiguous=ambiguous,
                conflicts=conflicts,
                gaps=gaps,
                existing=existing.model_dump(mode="json"),
            )

        rows.append(row.model_dump())
        counts[row.status.value] += 1

    print(f"Import preview: {counts}, {fail_count} parse failures")
    return {"rows": rows, "counts": counts, "failed": fail_count}


def _get_existing_flight(flight_id: int | None, user: User) -> FlightModel:
    if flight_id is None:
        raise HTTPException(status_code=400, detail="Missing matched flight id")

    rows = database.execute_read_query(
        "SELECT * FROM flights WHERE id = ? AND (username = ? OR ? = 1);",
        [flight_id, user.username, int(user.is_admin)]
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Matched flight {flight_id} not found")

    return FlightModel.from_database(rows[0])


async def _merge_into_existing(flight_id: int | None, incoming: FlightModel, user: User) -> None:
    """Fill the existing flight's empty fields with incoming values."""
    existing = _get_existing_flight(flight_id, user)
    _, _, gaps = classify_duplicate(existing, incoming)

    if not gaps:
        return

    incoming_values = dict(zip(FlightModel.get_attributes(), incoming.get_values()))
    query = "UPDATE flights SET " + ", ".join(f"{field}=?" for field in gaps) + " WHERE id = ? RETURNING id;"
    values = [incoming_values[field] for field in gaps] + [existing.id]
    database.execute_query(query, values)


async def _overwrite_existing(flight_id: int | None, incoming: FlightModel, user: User) -> None:
    """Replace the existing flight entirely with the incoming one."""
    _get_existing_flight(flight_id, user)  # authorization + existence check
    await complete_flight_metrics(incoming)

    incoming_values = dict(zip(FlightModel.get_attributes(), incoming.get_values()))
    query = "UPDATE flights SET " + ", ".join(f"{field}=?" for field in COMPARE_FIELDS) + " WHERE id = ? RETURNING id;"
    values = [incoming_values[field] for field in COMPARE_FIELDS] + [flight_id]
    database.execute_query(query, values)


@router.post("/apply", status_code=200)
async def apply_import(payload: ImportApplyRequest,
                       user: User = Depends(get_current_user)) -> dict:
    """Apply the reviewed import: insert new rows and execute per-row decisions."""
    imported = 0
    merged = 0
    overwritten = 0
    ignored = 0
    failed = 0

    for item in payload.rows:
        try:
            flight = FlightModel(**item.flight)
        except Exception as e:
            print(f"[{item.index}] Invalid flight data: '{e}'")
            failed += 1
            continue

        try:
            if item.action == ImportAction.INSERT:
                await add_flight(flight, user=user)
                imported += 1
            elif item.action == ImportAction.MERGE:
                await _merge_into_existing(item.match_id, flight, user)
                merged += 1
            elif item.action == ImportAction.OVERWRITE:
                await _overwrite_existing(item.match_id, flight, user)
                overwritten += 1
            else:
                ignored += 1
        except HTTPException as e:
            print(f"[{item.index}] Failed: {e.detail}")
            failed += 1

    print(f"Import complete: {imported} imported, {merged} merged, {overwritten} overwritten, "
          f"{ignored} ignored, {failed} failed")
    return {
        "imported": imported,
        "merged": merged,
        "overwritten": overwritten,
        "ignored": ignored,
        "failed": failed,
    }
