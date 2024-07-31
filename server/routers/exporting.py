from server.models import FlightModel
from server.routers.flights import get_flights

from fastapi import APIRouter
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

router = APIRouter(
    prefix="/exporting",
    tags=["importing/exporting"],
    redirect_slashes=True
)

def cleanup(file_path: str):
    os.remove(file_path)

@router.post("", status_code=200)
async def export_to_CSV() -> FileResponse:
    flights = await get_flights()
    assert type(flights) == list # make linter happy

    file = open("/tmp/jetlog.csv", "a")
    columns = FlightModel.get_attributes(with_id=False)

    file.write(','.join(columns) + '\n')

    for flight in flights:
        values = [ str(val) if val != None else '' for val in flight.get_values() ]
        row = ','.join(values)
        file.write(row + '\n')

    file.close()
    return FileResponse("/tmp/jetlog.csv", background=BackgroundTask(cleanup, "/tmp/jetlog.csv"))
