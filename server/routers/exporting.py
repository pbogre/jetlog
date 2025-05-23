from server.models import AirportModel, FlightModel, User
from server.routers.flights import get_flights
from server.auth.users import get_current_user

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os
import datetime

router = APIRouter(
    prefix="/exporting",
    tags=["importing/exporting"],
    redirect_slashes=True
)

def cleanup(file_path: str):
    os.remove(file_path)

def stringify_airport(airport: AirportModel) -> str:
    code = airport.iata if airport.iata else airport.icao
    return f"{code} - {airport.municipality}/{airport.country}"

@router.post("/csv", status_code=200)
async def export_to_CSV(user: User = Depends(get_current_user)) -> FileResponse:
    import csv

    flights = await get_flights(limit=-1, user=user)
    assert type(flights) == list # make linter happy

    file = open("/tmp/jetlog.csv", 'w', newline='')
    csv_writer = csv.writer(file, quotechar='"', delimiter=',')
    columns = FlightModel.get_attributes(ignore=["id", "username", "connection"])

    csv_writer.writerow(columns)

    for flight in flights:
        values = [ str(val).replace("\n", "\\n") if val != None else '' for val in flight.get_values(ignore=["id", "username", "connection"]) ]
        csv_writer.writerow(values)

    file.close()
    return FileResponse("/tmp/jetlog.csv", 
                        background=BackgroundTask(cleanup, "/tmp/jetlog.csv"),
                        filename="jetlog.csv")

@router.post("/ical", status_code=200)
async def export_to_iCal(user: User = Depends(get_current_user)) -> FileResponse:
    flights = await get_flights(limit=-1, user=user)
    assert type(flights) == list # make linter happy

    file = open("/tmp/jetlog.ics", "a")

    file.write("BEGIN:VCALENDAR\n")
    file.write("CALSCALE:GREGORIAN\n")
    file.write("VERSION:2.0\n\n")

    for flight in flights:
        assert type(flight.origin) == AirportModel
        assert type(flight.destination) == AirportModel

        file.write("BEGIN:VEVENT\n")
        file.write(f"SUMMARY:Flight from {flight.origin.municipality} to {flight.destination.municipality}\n")
        file.write(f"DESCRIPTION:Origin: {stringify_airport(flight.origin)}\\n" +
                               f"Destination: {stringify_airport(flight.destination)}" +
                               (f"\\n\\nNotes: {flight.notes}" if flight.notes else "") +
                                "\n")

        if flight.departure_time and flight.duration:
            departure = datetime.datetime.strptime(f"{flight.date} {flight.departure_time}", "%Y-%m-%d %H:%M")
            arrival = departure + datetime.timedelta(minutes=flight.duration)

            file.write(f"DTSTART:{departure.strftime('%Y%m%dT%H%M00')}\n")
            file.write(f"DTEND:{arrival.strftime('%Y%m%dT%H%M00')}\n")
        elif flight.date:
            date = flight.date.strftime('%Y%m%d')
            file.write(f"DTSTART;VALUE=DATE:{date}\n")
            file.write(f"DTEND;VALUE=DATE:{date}\n")

        file.write("END:VEVENT\n\n")

    file.write("END:VCALENDAR")

    file.close()
    return FileResponse("/tmp/jetlog.ics", 
                        background=BackgroundTask(cleanup, "/tmp/jetlog.ics"),
                        filename="jetlog.ics")
