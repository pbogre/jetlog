import React, {useState, useMemo, useEffect} from 'react';

import { Whisper } from './Elements';
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

            <StatBox stat={(statistics.totalDuration / 60).toFixed(0)}
                     description="hours"/>

            <StatBox stat={statistics.totalDistance.toLocaleString()}
                     description={metricUnits === "false" ? "miles" : "kilometers"}/>

            <StatBox stat={statistics.daysRange != 0 ? 
                            (statistics.daysRange / (statistics.totalFlights)).toFixed(0)
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
    const [statistics, setStatistics] = useState<Statistics>();
    const [durationUnitIndex, setDurationUnitIndex] = useState(0);
    const [distanceUnitIndex, setDistanceUnitIndex] = useState(0);
    const metricUnits = ConfigStorage.getSetting('metricUnits');

    useEffect(() => {
        API.get(`/statistics?metric=${metricUnits}`, filters).then((data: Statistics) => {
        setStatistics(data);
        });
    }, [filters, metricUnits]);

    if (!statistics) {
        return <p className="m-4">loading...</p>;
    }

    // cycle through duration units
    const durationUnits = [
        { label: "hours", divisor: 60 },
        { label: "days",  divisor: 1440 },
        { label: "weeks", divisor: 10080 },
    ];

    const handleDurationClick = () => {
        setDurationUnitIndex((prev) => (prev + 1) % durationUnits.length);
    };

    // cycle through distance units
    const distanceUnits = [
        { label: metricUnits === 'false' ? 'mi' : 'km', divisor: 1 },
        { label: "times around Earth", divisor: metricUnits === 'false' ? 24900 : 40000 },
        { label: "times to Moon", divisor: metricUnits === 'false' ?  239000 : 385000 },
    ];

    const handleDistanceClick = () => {
        setDistanceUnitIndex((prev) => (prev + 1) % distanceUnits.length);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Generic</h3>

                <p className="mb-2">
                    Number of flights: <span className="font-medium">{statistics.totalFlights}</span>
                </p>
                <p className="mb-2">
                    Total (registered) time spent flying:{' '}
                    <span className="font-medium cursor-pointer" onClick={handleDurationClick}>
                        {(statistics.totalDuration / durationUnits[durationUnitIndex].divisor).toFixed(1)} {' '}
                        {durationUnits[durationUnitIndex].label}
                    </span>
                </p>
                <p className="mb-2">
                    Total distance travelled:{' '}
                    <span className="font-medium cursor-pointer" onClick={handleDistanceClick}>
                        {(statistics.totalDistance / distanceUnits[distanceUnitIndex].divisor).toFixed(1)} {' '}
                        {distanceUnits[distanceUnitIndex].label}
                    </span>
                </p>
                <p className="mb-2">
                    Total unique airports visited:{' '}
                    <span className="font-medium">{statistics.totalUniqueAirports}</span>
                </p>
                <p className="mb-2">
                    Range of days:{' '}
                    <span className="font-medium">{statistics.daysRange} days</span>
                </p>
            </div>

            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most visited airports</h3>
                <StatFrequency object={statistics.mostVisitedAirports} measure="visits" />
            </div>

            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common seat</h3>
                <StatFrequency object={statistics.seatFrequency} measure="flights" />
            </div>

            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common class</h3>
                <StatFrequency object={statistics.ticketClassFrequency} measure="flights" />
            </div>

            <div className="container">
                <h3 className="text-lg font-semibold mb-4">Most common airlines</h3>
                <StatFrequency object={statistics.mostCommonAirlines} measure="flights" />
            </div>

    </div>
  );
}

