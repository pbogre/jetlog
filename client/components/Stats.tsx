import React, {useState, useMemo, useEffect} from 'react';

import { Statistics } from '../models';
import { SettingsManager } from '../settingsManager';
import API from '../api';
import {stringifyAirport} from '../utils';

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
    const metricUnits = SettingsManager.getSetting("metricUnits");

    // runs before render
    useMemo(() => {
        API.get(`/statistics?metric=${metricUnits}`)
        .then((data) => {
            setStatistics(data);
        });

    }, []);

    return (
        <div className="flex mb-4 whitespace-nowrap overflow-x-auto ">
            <StatBox stat={statistics.amount || 0}
                     description="flights"/>

            <StatBox stat={((statistics.time || 0) / 60).toLocaleString()}
                     description="hours"/>

            <StatBox stat={statistics.distance?.toLocaleString() || 0}
                     description={metricUnits === "false" ? "miles" : "kilometers"}/>

            <StatBox stat={statistics.dpf?.toLocaleString() || 0}
                     description="days per flight"/>

            <StatBox stat={statistics.uniqueAirports || 0}
                     description="airports"/>
        </div>
    );
}

export function AllStats({ filters }) {
    const [statistics, setStatistics] = useState<Statistics>()
    const metricUnits = SettingsManager.getSetting("metricUnits");

    useEffect(() => {
        API.get(`/statistics?metric=${metricUnits}`, filters)
        .then((data) => {
            setStatistics(data);
            console.log(data);
        });
    }, [filters]);

    if (statistics === undefined) {
        return <p className="m-4">loading...</p>;
    }

    return (
        <>
            <div className="container">
                <p>Number of flights: <span>{statistics.amount || 0}</span></p>
                <p>Total (registered) time spent flying: <span>{statistics.time ? (statistics.time / 60).toLocaleString() : 0} hours</span></p>
                <p>Total distance travelled: <span>{statistics.distance ? statistics.distance.toLocaleString() : 0} {metricUnits === "false" ? "mi" : "km"}</span></p>
                <p>Average days between flights: <span>{statistics.dpf ? statistics.dpf.toLocaleString() : 0} d/f</span></p>
                <p>Total unique airports visited: <span>{statistics.uniqueAirports ? statistics.uniqueAirports : 0}</span></p>
                <p>Most common airport: <span>{stringifyAirport(statistics.commonAirport)}</span></p>
                <p>Most common seat: <span>{statistics.commonSeat ? statistics.commonSeat : "N/A"}</span></p>
                { Object.keys(statistics.ticketClassFrequency).map((ticketClass) => {
                    return <p>Frequency of class '{ticketClass}': <span>{statistics.ticketClassFrequency[ticketClass]}</span></p>
                })}
            </div>
        </>
    );
}
