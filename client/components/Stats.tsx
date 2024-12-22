import React, {useState, useMemo, useEffect} from 'react';

import { Subheading, Whisper } from './Elements';
import { Statistics } from '../models';
import ConfigStorage from '../storage/configStorage';
import API from '../api';

function StatBox({stat, description}) {
    return (
        <div className="container bg-gray-100 dark:bg-dark-800 text-center rounded-full">
            <span className="text-3xl block text-yellow-500">{stat}</span>
            <div className="text-gray-700 dark:text-gray-300">{description}</div>
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
        <div className="flex flex-wrap">
            <div className="container">
                <Subheading text="Generic" />
                
                <p>Number of flights: <span>{statistics.totalFlights}</span></p>
                <p>Total (registered) time spent flying: <span>{(statistics.totalDuration / 60).toLocaleString()} hours</span></p>
                <p>Total distance travelled: <span>{statistics.totalDistance.toLocaleString()} {metricUnits === "false" ? "mi" : "km"}</span></p>
                <p>Total unique airports visited: <span>{statistics.totalUniqueAirports}</span></p>
                <p>Range of days: <span>{statistics.daysRange} days</span></p>
            </div>

            <div className="container">
                <Subheading text="Most visited airports" />
                <StatFrequency object={statistics.mostVisitedAirports} measure="visits"/>
            </div>

            <div className="container">
                <Subheading text="Most common seat" />
                <StatFrequency object={statistics.seatFrequency} measure="flights"/>
            </div>

            <div className="container">
                <Subheading text="Most common class" />
                <StatFrequency object={statistics.ticketClassFrequency} measure="flights"/>
            </div>
        </div>
    );
}
