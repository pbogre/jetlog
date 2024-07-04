import React, {useState} from 'react';
import { useEffect } from 'react';

import { Statistics } from '../models';
import { flightsAPI } from '../api'

import '../css/statistics.css'

export default function Stats() {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics())
    
    useEffect(() => {
        flightsAPI.get("statistics")
        .then((data) => setStatistics(data));
    }, []);

    return (
        <>
            <div className="container center">
                You flew <span className="stat">{statistics.amount || "loading..."}</span> times!
            </div>

            <div className="container center">
                You spent <span className="stat">{statistics.time?.toLocaleString()  || "loading..."}</span> minutes in the air!
            </div>

            <div className="container center">
                You travelled <span className="stat">{statistics.distance?.toLocaleString() || "loading..."}</span> kilometers!
            </div>

            <div className="container center">
                You boarded a plane every <span className="stat">{statistics.dpf?.toLocaleString() || "loading..."}</span> days!
            </div>

            <div className="container center">
                You visited <span className="stat">{statistics.uniqueAirports || "loading..."}</span> airports!
            </div>

            <div className="container center">
                Your favorite airport is
                <span className="stat">
                { statistics.commonAirport ? 
                    (statistics.commonAirport.iata || statistics.commonAirport.icao) + " (" + statistics.commonAirport.city + ")" :
                    "loading..."
                }
                </span>
            </div>

            <div className="container center">
                Your favorite seat is <span className="stat">{statistics.commonSeat || "loading..."}</span>
            </div>
        </>
    );
}
