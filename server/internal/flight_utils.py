import datetime

from server.database import database
from server.models import FlightModel

# Fields that participate in duplicate detection and merge comparison.
# `id`, `username` and `connection` are excluded: they are not part of an
# imported flight's identity (and `connection` is only set after import).
COMPARE_FIELDS = [
    "date",
    "origin",
    "destination",
    "departure_time",
    "arrival_time",
    "arrival_date",
    "seat",
    "aircraft_side",
    "ticket_class",
    "purpose",
    "duration",
    "distance",
    "airplane",
    "airline",
    "tail_number",
    "flight_number",
    "notes",
]

# Tolerance (in minutes) used to match flights that have no flight number
TIME_TOLERANCE_MINUTES = 60


def _normalize(value):
    """Normalize a value for comparison (unwrap enums, dates, strip strings)."""
    if hasattr(value, "value"):
        value = value.value
    if isinstance(value, datetime.date):
        value = value.isoformat()
    if isinstance(value, str):
        value = value.strip()
    return value


def _time_delta_minutes(a: str, b: str) -> int | None:
    try:
        ta = datetime.datetime.strptime(a, "%H:%M")
        tb = datetime.datetime.strptime(b, "%H:%M")
    except (ValueError, TypeError):
        return None

    delta = abs((ta - tb).total_seconds() / 60)
    # account for times crossing midnight (e.g. 23:55 vs 00:05)
    return int(min(delta, 24 * 60 - delta))


def find_existing_flight(flight: FlightModel, username: str) -> tuple[FlightModel | None, bool]:
    """Look up an existing flight matching the incoming one.

    Returns ``(existing, ambiguous)``. ``ambiguous`` is True when the match is
    weak (e.g. no flight number and no usable time was provided) and should be
    confirmed by the user before any change is applied.
    """
    candidates = database.execute_read_query(
        """
        SELECT * FROM flights
        WHERE username = ? AND date = ? AND origin = ? AND destination = ?;
        """,
        [username, _normalize(flight.date), _normalize(flight.origin), _normalize(flight.destination)]
    )
    if not candidates:
        return None, False

    flight_number = _normalize(flight.flight_number)
    if flight_number:
        for row in candidates:
            existing = FlightModel.from_database(row)
            if _normalize(existing.flight_number) == flight_number:
                return existing, False
        return None, False

    # No flight number: try to anchor the match on departure/arrival time.
    new_departure = _normalize(flight.departure_time)
    new_arrival = _normalize(flight.arrival_time)

    if not new_departure and not new_arrival:
        # Nothing to anchor on: only consider it a (weak) match when this
        # date + route has a single flight in the database.
        if len(candidates) == 1:
            return FlightModel.from_database(candidates[0]), True
        return None, False

    matches = []
    for row in candidates:
        existing = FlightModel.from_database(row)

        dep_match = arr_match = False
        if new_departure and existing.departure_time:
            delta = _time_delta_minutes(new_departure, _normalize(existing.departure_time))
            dep_match = delta is not None and delta <= TIME_TOLERANCE_MINUTES
        if new_arrival and existing.arrival_time:
            delta = _time_delta_minutes(new_arrival, _normalize(existing.arrival_time))
            arr_match = delta is not None and delta <= TIME_TOLERANCE_MINUTES

        # When both sides carry both times, require both to line up; otherwise
        # fall back to whichever times are available.
        if new_departure and new_arrival and existing.departure_time and existing.arrival_time:
            matched = dep_match and arr_match
        else:
            matched = dep_match or arr_match

        if matched:
            matches.append(existing)

    if len(matches) == 1:
        return matches[0], False
    if len(matches) > 1:
        return matches[0], True
    return None, False


def classify_duplicate(existing: FlightModel, incoming: FlightModel, ambiguous: bool = False) -> tuple[str, list[str], list[str]]:
    """Classify an incoming flight against an existing one.

    Returns ``(status, conflicts, gaps)``:
    - ``"identical"``: no new information -> skip the row
    - ``"mergeable"``: incoming fills empty fields of existing -> auto merge
    - ``"conflict"``: fields hold conflicting values (or the match is weak)
      -> ask the user to ignore / merge / overwrite
    """
    conflicts: list[str] = []
    gaps: list[str] = []

    for field in COMPARE_FIELDS:
        old = _normalize(getattr(existing, field, None))
        new = _normalize(getattr(incoming, field, None))

        if old is None and new is None:
            continue
        if old == new:
            continue
        if old is None:
            gaps.append(field)
        elif new is None:
            continue  # incoming carries less info -> keep existing value
        else:
            conflicts.append(field)

    if ambiguous or conflicts:
        return "conflict", conflicts, gaps
    if gaps:
        return "mergeable", [], gaps
    return "identical", [], []
