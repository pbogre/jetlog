from server.database import database
from server.models import AirportModel, StatisticsModel
from fastapi import APIRouter
import datetime

router = APIRouter(
    prefix="/statistics",
    tags=["statistics"],
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_statistics(start: datetime.date|None = None, end: datetime.date|None = None) -> StatisticsModel:    
    date_filter_start = "WHERE" if start or end else ""

    date_filter = ""
    date_filter += f"JULIANDAY(date) > JULIANDAY('{start}')" if start else ""
    date_filter += " AND " if start and end else ""
    date_filter += f"JULIANDAY(date) < JULIANDAY('{end}')" if end else ""

    res = database.execute_read_query(f"""
        SELECT  COUNT(*) AS amount, 

                SUM(duration) AS total_time,

                SUM(distance) AS total_distance,

                ROUND(
                    ( ( SELECT JULIANDAY(date) FROM flights {date_filter_start} {date_filter} ORDER BY date DESC LIMIT 1 ) -
                      ( SELECT JULIANDAY(date) FROM flights {date_filter_start} {date_filter} ORDER BY date ASC LIMIT 1 ) 
                        * 1.0 
                    ) / ( ( SELECT COUNT(*) FROM flights {date_filter_start} {date_filter} ) * 1.0 )
                    , 2) AS days_per_flight,

                ( SELECT COUNT(DISTINCT ap) FROM (
                    SELECT origin AS ap FROM flights {date_filter_start} {date_filter}
                    UNION ALL
                    SELECT destination as ap FROM flights {date_filter_start} {date_filter}
                    )
                ) AS unique_airports,

                ( SELECT seat FROM flights 
                    WHERE seat NOT NULL
                    {"AND" if start or end else ""} {date_filter}
                    GROUP BY seat
                    ORDER BY COUNT(*) DESC
                    LIMIT 1 
                ) AS common_seat,

                common_airport.*

        FROM flights 

        JOIN airports AS common_airport 
        ON icao = (
            SELECT ap
            FROM (
                SELECT origin AS ap FROM flights {date_filter_start} {date_filter}
                UNION ALL
                SELECT destination AS ap FROM flights {date_filter_start} {date_filter}
            )
            GROUP BY ap
            ORDER BY COUNT(*) DESC
            LIMIT 1
        )

        {date_filter_start} {date_filter};
    """)[0]

    begin_airport = len(StatisticsModel.get_attributes()) - 1

    airport_db = res[begin_airport:]
    airport = AirportModel.from_database(airport_db)

    stats = StatisticsModel.from_database(res[:begin_airport], { "common_airport": airport })
    return StatisticsModel.model_validate(stats)
