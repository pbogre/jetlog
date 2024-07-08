import React from 'react';

import { Statistics } from '../models';

import '../css/statistics.css'

interface StatisticsProps {
    statistics: Statistics;
}

export default function Stats({ statistics }: StatisticsProps) {
    return (
        <>
            <div className="container center">
                You flew <span className="stat">{statistics.amount || 0}</span> times!
            </div>

            <div className="container center">
                You spent <span className="stat">{((statistics.time || 0) / 60)?.toLocaleString()}</span> hours in the air!
            </div>

            <div className="container center">
                You travelled <span className="stat">{statistics.distance?.toLocaleString() || 0}</span> kilometers!
            </div>

            <div className="container center">
                You boarded a plane every <span className="stat">{statistics.dpf?.toLocaleString() || 0}</span> days!
            </div>

            <div className="container center">
                You visited <span className="stat">{statistics.uniqueAirports || 0}</span> airports!
            </div>

            <div className="container center">
                Your favorite airport is
                <span className="stat">
                { statistics.commonAirport ? 
                    (statistics.commonAirport.iata || statistics.commonAirport.icao) + " (" + statistics.commonAirport.city + ")" :
                    "unknown"
                }
                </span>
            </div>

            <div className="container center">
                Your favorite seat is <span className="stat">{statistics.commonSeat || "unknown"}</span>
            </div>
        </>
    );
}
