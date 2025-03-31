import React, {useState, useMemo, useEffect} from 'react';

import { Subheading, Whisper } from './Elements';
import { Statistics } from '../models';
import ConfigStorage from '../storage/configStorage';
import API from '../api';

function StatBox({stat, description}) {
    return (
        <div className="container bg-gray-100 text-center rounded-full">
            <span className="text-3xl block">{stat}</span>
            {description}
        </div>
    );
}

export function ShortStats() {
    const [statistics, setStatistics] = useState<Statistics>()
    const metricUnits = ConfigStorage.getSetting("metricUnits");

    // runs before render
    useMemo(() => {
        API.get(`/statistics?metric=${metricUnits}`)
        .then((data: Statistics) => {
            setStatistics(data);
        });
    }, []);

    if (statistics === undefined) {
        return <p className="m-4">loading...</p>;
    }

    return (
        <div className="flex mb-4 whitespace-nowrap overflow-x-auto ">
            <StatBox stat={statistics.totalFlights}
                     description="flights"/>

            <StatBox stat={statistics.totalUniqueAirports}
                     description="airports"/>

            <StatBox stat={(statistics.totalDuration / 60).toLocaleString()}
                     description="hours"/>

            <StatBox stat={statistics.totalDistance.toLocaleString()}
                     description={metricUnits === "false" ? "miles" : "kilometers"}/>

            <StatBox stat={statistics.daysRange != 0 ? 
                            (statistics.daysRange / (statistics.totalFlights)).toLocaleString()
                            : 0}
                     description="days per flight"/>
        </div>
    );
}

function StatFrequency({ object, measure }) {
    if (Object.keys(object).length === 0) {
        return <p>No records found</p>
    };

    return (
        <ol className="list-decimal ml-5">
        { Object.keys(object).map((key => {
            return (
                <li>
                    <div className="flex flex-wrap justify-between">
                        <span>{key}</span>
                        <div className="inline">
                            <Whisper text={`${object[key]} ${measure}`} />
                        </div>
                    </div>
                </li>
            )
        }))}
        </ol>
    )
}

export function AllStats({ filters }) {
    const [statistics, setStatistics] = useState<Statistics>()
    const metricUnits = ConfigStorage.getSetting("metricUnits");

    useEffect(() => {
        API.get(`/statistics?metric=${metricUnits}`, filters)
        .then((data: Statistics) => {
            setStatistics(data);
        });
    }, [filters]);

    if (statistics === undefined) {
        return <p className="m-4">loading...</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Generic</h3>
                
                <p className="mb-2">Number of flights: <span className="font-medium">{statistics.totalFlights}</span></p>
                <p className="mb-2">Total (registered) time spent flying: <span className="font-medium">{(statistics.totalDuration / 60).toLocaleString()} hours</span></p>
                <p className="mb-2">Total distance travelled: <span className="font-medium">{statistics.totalDistance.toLocaleString()} {metricUnits === "false" ? "mi" : "km"}</span></p>
                <p className="mb-2">Total unique airports visited: <span className="font-medium">{statistics.totalUniqueAirports}</span></p>
                <p className="mb-2">Range of days: <span className="font-medium">{statistics.daysRange} days</span></p>
            </div>
            
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most visited airports</h3>
                <StatFrequency object={statistics.mostVisitedAirports} measure="visits"/>
            </div>
            
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common seat</h3>
                <StatFrequency object={statistics.seatFrequency} measure="flights"/>
            </div>
            
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common class</h3>
                <StatFrequency object={statistics.ticketClassFrequency} measure="flights"/>
            </div>
            
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common airlines</h3>
                <StatFrequency object={statistics.mostCommonAirlines} measure="flights"/>
            </div>

            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Some more stats</h3>
                
                <p className="mb-2">Flight Time in hours: <span className="font-medium">{(statistics.totalDuration / 60).toLocaleString()}</span></p>
                <p className="mb-2">Flight Time in days: <span className="font-medium">{(statistics.totalDuration / 1440).toLocaleString()}</span></p>
                <p className="mb-2">Flight Time in weeks: <span className="font-medium">{(statistics.totalDuration / 10080).toLocaleString()}</span></p>
                <p className="mb-2">Flight Time in months: <span className="font-medium">{(statistics.totalDuration / 302400).toLocaleString()}</span></p>
                <p className="mb-2">Flight Time in years: <span className="font-medium">{(statistics.totalDuration / 525600).toLocaleString()}</span></p>

                <p className="mb-2">Times around the earth: <span className="font-medium">{statistics.totalDistance.toLocaleString() / 12700} </span></p>
                <p className="mb-2">Times to the moon: <span className="font-medium">{statistics.totalDistance.toLocaleString() / 385000} </span></p>
                <p className="mb-2">Times to the sun: <span className="font-medium">{statistics.totalDistance.toLocaleString() / 149600000} </span></p>

            </div>

        </div>
    );
}
