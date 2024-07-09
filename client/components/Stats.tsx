import React, {useState, useMemo} from 'react';

import { Statistics } from '../models';
import API from '../api'

function StatBox({first, stat, second = ""}) {
    return (
        <div className="container text-center">
            {first}
            <span className="text-2xl block">{stat}</span>
            {second}
        </div>
    );
}

//TODO UI elements to make use of query statistics
export default function Stats() {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics)

    // runs before render
    useMemo(() => {
        API.get("/statistics")
        .then((data) => setStatistics(data));
    }, []);

    return (
        <div className="flex">
            <StatBox first="You flew"
                     stat={statistics.amount || 0}
                     second="times!"/>

            <StatBox first="You spent"
                     stat={((statistics.time || 0) / 60).toLocaleString()}
                     second="hours in the air!"/>

            <StatBox first="You travelled"
                     stat={statistics.distance?.toLocaleString() || 0}
                     second="kilometers!"/>

            <StatBox first="You boarded a plane every"
                     stat={statistics.dpf?.toLocaleString() || 0}
                     second="days!"/>

            <StatBox first="You visited"
                     stat={statistics.uniqueAirports || 0}
                     second="airports!"/>

            <StatBox first="You favorite airport is"
                     stat={ statistics.commonAirport ? 
                            (statistics.commonAirport.iata || statistics.commonAirport.icao) + " (" + statistics.commonAirport.city + ")" :
                            "unknown"}/>

            <StatBox first="Your favorite seat is"
                     stat={statistics.commonSeat || "unknown"}/>
        </div>
    );
}
