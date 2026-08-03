import datetime

from server.internal.flight_utils import classify_duplicate, find_existing_flight
from server.models import FlightModel
from server.tests.helpers import insert_flight


def make_flight(**overrides) -> FlightModel:
    values = {
        "date": datetime.date(2024, 5, 1),
        "origin": "EDDF",
        "destination": "EGLL",
        "departure_time": "08:30",
        "arrival_time": "09:45",
        "flight_number": "LH123",
        "notes": "old",
        **overrides,
    }
    return FlightModel(**values)


class TestClassifyDuplicate:
    def test_identical(self):
        status, conflicts, gaps = classify_duplicate(make_flight(), make_flight())
        assert status == "identical"
        assert conflicts == []
        assert gaps == []

    def test_mergeable_fills_gaps(self):
        existing = make_flight(notes=None, tail_number=None)
        incoming = make_flight(notes="hello", tail_number="D-AIUA")
        status, conflicts, gaps = classify_duplicate(existing, incoming)
        assert status == "mergeable"
        assert conflicts == []
        assert set(gaps) == {"notes", "tail_number"}

    def test_conflict(self):
        status, conflicts, gaps = classify_duplicate(make_flight(notes="a"), make_flight(notes="b"))
        assert status == "conflict"
        assert conflicts == ["notes"]
        assert gaps == []

    def test_incoming_with_less_info_keeps_existing(self):
        existing = make_flight(notes="a", tail_number="D-AIUA")
        incoming = make_flight(notes=None, tail_number=None)
        status, conflicts, gaps = classify_duplicate(existing, incoming)
        assert status == "identical"
        assert conflicts == []

    def test_ambiguous_is_conflict_even_when_fields_match(self):
        status, conflicts, gaps = classify_duplicate(make_flight(), make_flight(), ambiguous=True)
        assert status == "conflict"
        assert conflicts == []


class TestFindExistingFlight:
    def test_matches_by_flight_number(self):
        existing_id = insert_flight(flight_number="LH123")
        existing, ambiguous = find_existing_flight(make_flight(flight_number="LH123"), "admin")
        assert existing is not None
        assert existing.id == existing_id
        assert ambiguous is False

    def test_flight_number_mismatch_is_no_match(self):
        insert_flight(flight_number="LH123")
        existing, ambiguous = find_existing_flight(make_flight(flight_number="LH456"), "admin")
        assert existing is None
        assert ambiguous is False

    def test_no_flight_number_matches_on_time(self):
        insert_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:00",
            arrival_time="21:15",
            notes=None,
        )
        incoming = make_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:10",
            arrival_time="21:25",
            notes=None,
        )
        existing, ambiguous = find_existing_flight(incoming, "admin")
        assert existing is not None
        assert ambiguous is False

    def test_both_times_require_both_to_match(self):
        insert_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:00",
            arrival_time="21:15",
            notes=None,
        )
        incoming = make_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:10",
            arrival_time="23:00",
            notes=None,
        )
        existing, ambiguous = find_existing_flight(incoming, "admin")
        assert existing is None

    def test_time_match_across_midnight(self):
        insert_flight(
            flight_number=None,
            departure_time="23:55",
            arrival_time="00:15",
            notes=None,
        )
        incoming = make_flight(
            flight_number=None,
            departure_time="00:05",
            arrival_time="00:25",
            notes=None,
        )
        existing, ambiguous = find_existing_flight(incoming, "admin")
        assert existing is not None
        assert ambiguous is False

    def test_single_candidate_without_time_is_ambiguous(self):
        insert_flight(flight_number=None, departure_time=None, arrival_time=None, notes=None)
        incoming = make_flight(flight_number=None, departure_time=None, arrival_time=None, notes=None)
        existing, ambiguous = find_existing_flight(incoming, "admin")
        assert existing is not None
        assert ambiguous is True

    def test_no_candidate_returns_none(self):
        existing, ambiguous = find_existing_flight(
            make_flight(date=datetime.date(2024, 9, 9), flight_number="XX999"),
            "admin",
        )
        assert existing is None
        assert ambiguous is False

    def test_multiple_time_matches_are_ambiguous(self):
        insert_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:00",
            arrival_time="21:15",
            notes=None,
        )
        insert_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:30",
            arrival_time="21:45",
            notes=None,
        )
        incoming = make_flight(
            flight_number=None,
            date=datetime.date(2024, 5, 2),
            origin="EGLL",
            destination="EDDF",
            departure_time="20:15",
            arrival_time="21:30",
            notes=None,
        )
        existing, ambiguous = find_existing_flight(incoming, "admin")
        assert existing is not None
        assert ambiguous is True
