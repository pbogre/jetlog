import datetime

from server.database import database
from server.tests.helpers import AUTH_HEADERS, insert_flight


CUSTOM_CSV = """date,origin,destination,departure_time,arrival_time,flight_number,duration,notes,tail_number
2024-05-01,EDDF,EGLL,08:30,09:45,LH123,75,old,
2024-05-01,EDDF,EGLL,08:30,09:45,LH123,75,new note,
2024-05-04,EDDF,EGLL,09:00,10:00,LH789,60,,D-ABCD
2024-05-02,EGLL,EDDF,20:00,21:15,,75,,
2024-05-03,EDDF,EGLL,12:00,13:00,LH456,60,,
"""


def _seed_flights():
    insert_flight(flight_number="LH123", notes="old")
    insert_flight(
        flight_number="LH789",
        notes=None,
        tail_number=None,
        date=datetime.date(2024, 5, 4),
        departure_time="09:00",
        arrival_time="10:00",
        duration=60,
    )
    insert_flight(
        flight_number=None,
        notes=None,
        tail_number=None,
        date=datetime.date(2024, 5, 2),
        origin="EGLL",
        destination="EDDF",
        departure_time="20:00",
        arrival_time="21:15",
        duration=75,
    )


def _preview(client):
    return client.post(
        "/api/importing?csv_type=custom",
        headers=AUTH_HEADERS,
        files={"file": ("flights.csv", CUSTOM_CSV, "text/csv")},
    )


def test_custom_csv_preview_classifies_rows(client):
    _seed_flights()

    res = _preview(client)
    assert res.status_code == 200
    body = res.json()
    assert body["failed"] == 0
    assert body["counts"] == {"new": 1, "identical": 2, "mergeable": 1, "conflict": 1}

    by_index = {row["index"]: row for row in body["rows"]}
    assert by_index[1]["status"] == "identical"
    assert by_index[2]["status"] == "conflict"
    assert by_index[2]["conflicts"] == ["notes"]
    assert by_index[3]["status"] == "mergeable"
    assert by_index[3]["gaps"] == ["tail_number"]
    assert by_index[4]["status"] == "identical"
    assert by_index[5]["status"] == "new"


def test_apply_import_executes_decisions(client):
    _seed_flights()
    preview = _preview(client).json()

    actions = {1: "ignore", 2: "overwrite", 3: "merge", 4: "ignore", 5: "insert"}
    payload = {
        "rows": [
            {
                "index": row["index"],
                "flight": row["flight"],
                "match_id": row["match_id"],
                "action": actions[row["index"]],
            }
            for row in preview["rows"]
        ]
    }

    res = client.post("/api/importing/apply", headers=AUTH_HEADERS, json=payload)
    assert res.status_code == 200
    assert res.json() == {"imported": 1, "merged": 1, "overwritten": 1, "ignored": 2, "failed": 0}

    rows = database.execute_read_query(
        "SELECT flight_number, notes, tail_number, duration FROM flights ORDER BY id;"
    )
    by_number = {row[0]: row for row in rows}
    assert len(rows) == 4  # 3 seeded + 1 inserted
    assert by_number["LH123"][1] == "new note"  # overwritten
    assert by_number["LH123"][2] is None  # overwrite replaced the other fields
    assert by_number["LH789"][2] == "D-ABCD"  # merged into existing gap
    assert by_number["LH456"] is not None  # inserted

    owner = database.execute_read_query(
        "SELECT username FROM flights WHERE flight_number = 'LH456';"
    )
    assert owner[0][0] == "admin"


MFR24_CSV = """Date,Flight number,From,To,Dep time,Arr time,Duration,Airline,Aircraft,Registration,Seat number,Seat type,Flight class,Flight reason,Note,Dep_id,Arr_id,Airline_id,Aircraft_id
2024-06-01,LH321,Frankfurt (EDDF),Paris CDG (LFPG),00:00:00,01:10:00,01:10:00,Lufthansa (LH),Airbus A320 (A320),D-AIUA,12A,1,1,1,note,,,,,
2024-06-02,LH322,Frankfurt (EDDF),Paris CDG (LFPG),10:00:00,11:05:00,01:05:00,Lufthansa (LH),Airbus A320 (A320),D-AIUA,10A,2,1,2,note2,,,,,
"""


def test_myflightradar24_preview_parses_rows(client):
    res = client.post(
        "/api/importing?csv_type=myflightradar24",
        headers=AUTH_HEADERS,
        files={"file": ("flights.csv", MFR24_CSV, "text/csv")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["failed"] == 0
    assert body["counts"] == {"new": 2, "identical": 0, "mergeable": 0, "conflict": 0}

    first = body["rows"][0]["flight"]
    assert first["origin"] == "EDDF"
    assert first["destination"] == "LFPG"
    assert first["airline"] == "DLH"  # resolved from IATA "LH"
    assert first["departure_time"] is None  # 00:00 treated as missing
    assert first["arrival_time"] == "01:10"  # arrival kept even without departure
    assert first["seat"] == "window"
    assert first["ticket_class"] == "economy"
    assert first["purpose"] == "leisure"
    assert first["duration"] == 70

    second = body["rows"][1]["flight"]
    assert second["seat"] == "middle"
    assert second["purpose"] == "business"
    assert second["arrival_time"] == "11:05"


FLIGHTY_HEADER = [
    "Date", "Airline", "Flight", "From", "To", "Dep Terminal", "Dep Gate",
    "Arr Terminal", "Arr Gate", "Canceled", "Diverted To", "Gate Departure (Scheduled)",
    "Gate Departure (Actual)", "Take off (Scheduled)", "Take off (Actual)", "Landing (Scheduled)",
    "Landing (Actual)", "Gate Arrival (Scheduled)", "Gate Arrival (Actual)", "Aircraft Type Name",
    "Tail Number", "PNR", "Seat", "Seat Type", "Cabin Class", "Flight Reason", "Notes",
    "Flight Flighty ID", "Airline Flighty ID", "Departure Airport Flighty ID",
    "Arrival Airport Flighty ID", "Diverted To Airport Flighty ID", "Aircraft Type Flighty ID",
]


def test_flighty_preview_parses_row(client):
    row = [
        "2024-07-01", "Lufthansa", "LH999", "FRA", "CDG", "", "", "", "", "false", "",
        "2024-07-01 09:00:00", "2024-07-01 10:00:00", "", "", "", "",
        "2024-07-01 11:05:00", "2024-07-01 11:05:00", "Airbus A320", "D-AIUA", "", "12A",
        "window", "ECONOMY", "", "hello", "", "", "", "", "", "",
    ]
    csv_content = ",".join(FLIGHTY_HEADER) + "\n" + ",".join(row)

    res = client.post(
        "/api/importing?csv_type=flighty",
        headers=AUTH_HEADERS,
        files={"file": ("flights.csv", csv_content, "text/csv")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["failed"] == 0
    assert body["counts"] == {"new": 1, "identical": 0, "mergeable": 0, "conflict": 0}

    flight = body["rows"][0]["flight"]
    assert flight["origin"] == "EDDF"  # FRA resolved via IATA lookup
    assert flight["destination"] == "LFPG"
    assert flight["flight_number"] == "LH999"
    assert flight["airline"] == "DLH"  # resolved from airline name
    assert flight["departure_time"] == "10:00"
    assert flight["arrival_time"] == "11:05"
    assert flight["seat"] == "window"
    assert flight["ticket_class"] == "economy"
    assert flight["notes"] == "hello\nSeat: 12A"  # seat info is appended to notes
