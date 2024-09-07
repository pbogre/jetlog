from server.database import database
from server.models import StatisticsModel
from fastapi import APIRouter
import datetime

router = APIRouter(
    prefix="/statistics",
    tags=["statistics"],
    redirect_slashes=True
)

@router.get("", status_code=200)
async def get_statistics(metric: bool = True,
                         start: datetime.date|None = None,
                         end: datetime.date|None = None):
    date_filter = "WHERE " if start or end else ""
    date_filter += f"JULIANDAY(f.date) > JULIANDAY('{start}')" if start else ""
    date_filter += " AND " if start and end else ""
    date_filter += f"JULIANDAY(f.date) < JULIANDAY('{end}')" if end else ""

    # get simple numerical stats
    res = database.execute_read_query(f"""
        SELECT COUNT(*) AS total_flights,
               COALESCE(SUM(duration), 0) AS total_duration,
               COALESCE(SUM(distance), 0) AS total_distance,

               ( SELECT COUNT(DISTINCT ap) FROM (
                    SELECT origin AS ap FROM flights f {date_filter}
                    UNION ALL
                    SELECT destination as ap FROM flights f {date_filter}
                    )
               ) 
               AS total_unique_airports,

               COALESCE(( SELECT JULIANDAY(date)
                 FROM flights f {date_filter}
                 ORDER BY date DESC LIMIT 1 ) 
               - 
               ( SELECT JULIANDAY(date)
                 FROM flights f {date_filter}
                 ORDER BY date ASC LIMIT 1 ), 0)
               AS days_range

               FROM flights f {date_filter};
    """)

    statistics_db = res[0]

    # get top 5 visited airports
    res = database.execute_read_query(f"""
        SELECT COUNT(f.origin) + COUNT(f.destination) AS visits,
               a.icao,
               a.iata,
               a.city,
               a.country
        FROM airports a
        LEFT JOIN flights f
        ON ( LOWER(a.icao) = LOWER(f.origin) OR LOWER(a.icao) = LOWER(f.destination) )
        {date_filter}
        GROUP BY a.icao
        ORDER BY visits DESC
        LIMIT 5;
    """)

    most_visited_airports = { }
    for airport in res:
        string = f"{airport[2] if airport[2] else airport[1]} - {airport[3]}/{airport[4]}"
        most_visited_airports[string] = airport[0]

    # get seats frequency
    res = database.execute_read_query(f"""
        SELECT seat, COUNT(*) AS freq
        FROM flights f
        {date_filter}
        GROUP BY seat
        ORDER BY freq DESC;
    """)
    seat_frequency = { pair[0]: pair[1] for pair in res }
    seat_frequency.pop(None, None) # ignore entries with no seat

    # get ticket class frequency
    res = database.execute_read_query(f"""
        SELECT ticket_class, COUNT(*) AS freq
        FROM flights f
        {date_filter}
        GROUP BY ticket_class
        ORDER BY freq DESC;
    """)
    ticket_class_frequency = { pair[0]: pair[1] for pair in res }
    ticket_class_frequency.pop(None, None) # ignore entries with no ticket class

    statistics = StatisticsModel.from_database(statistics_db, 
                                               explicit={ 
                                                         "most_visited_airports": most_visited_airports,
                                                         "seat_frequency": seat_frequency,
                                                         "ticket_class_frequency": ticket_class_frequency
                                                         })

    if not metric and statistics.total_distance:
        statistics.total_distance = round(statistics.total_distance * 0.6213711922)

    return StatisticsModel.model_validate(statistics)
