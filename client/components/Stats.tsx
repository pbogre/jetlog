import React, {useState, useMemo, useEffect} from 'react';

import { Statistics } from '../models';
import API from '../api';
import {Heading} from './Elements';

function StatBox({stat, description}) {
    return (
        <div className="container bg-gray-100 text-center rounded-full">
            <span className="text-3xl block">{stat}</span>
            {description}
        </div>
    );
}

export function ShortStats() {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics)

    // runs before render
    useMemo(() => {
        API.get("/statistics")
        .then((data) => setStatistics(data));
    }, []);

    return (
        <div className="flex mb-4 whitespace-nowrap overflow-x-auto ">
            <StatBox stat={statistics.amount || 0}
                     description="flights"/>

            <StatBox stat={((statistics.time || 0) / 60).toLocaleString()}
                     description="hours"/>

            <StatBox stat={statistics.distance?.toLocaleString() || 0}
                     description="kilometers"/>

            <StatBox stat={statistics.dpf?.toLocaleString() || 0}
                     description="days per flight"/>

            <StatBox stat={statistics.uniqueAirports || 0}
                     description="airports"/>
        </div>
    );
}

export function AllStats({ filters }) {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics)

    useEffect(() => {
        API.get("/statistics", filters)
        .then((data) => setStatistics(data));
    }, [filters]);

    return (
        <>
        { !statistics.commonAirport ?
        <p>loading...</p> :
        <div className="container">
            <p>Number of flights: <span>{statistics.amount}</span></p>
            <p>Total (registered) time spent flying: <span>{(statistics.time / 60).toLocaleString()} hours</span></p>
            <p>Total distance travelled: <span>{statistics.distance.toLocaleString()} km</span></p>
            <p>Average days between flights: <span>{statistics.dpf.toLocaleString()} d/f</span></p>
            <p>Total unique airports visited: <span>{statistics.uniqueAirports}</span></p>
            <p>Most common airport: <span>{statistics.commonAirport.iata || statistics.commonAirport.icao} - {statistics.commonAirport.name} ({statistics.commonAirport.city})</span></p>
            <p>Most common seat: <span>{statistics.commonSeat}</span></p>
        </div>
        }
        </>
    );
}
