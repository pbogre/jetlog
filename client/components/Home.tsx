import React, {useEffect, useState} from 'react';

import Statistics from './Statistics';
import { flightsAPI } from '../api';
import { Flight } from '../models';

import '../css/flights.css'

interface FlightsTableProps {
    flights: Flight[];
}

function FlightsTable({ flights }: FlightsTableProps) {
    if(flights === null) {
        return (
            <p>Loading...</p>
        );
    }
    else if (flights.length === 0) {
        return (
            <p>No flights!</p>
        );
    }

    // TODO make this dynamic on attributes
    return (
        <table className="flights-table">
            <tr>
                <th>Date</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Departure Time</th>
                <th>Arrival Time</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Seat</th>
                <th>Flight Number</th>
                <th>Airplane</th>
            </tr>
            { flights.map((flight: Flight) => (
            <tr>
                <td>{flight.date}</td>
                <td>{flight.origin.city} ({flight.origin.iata || flight.origin.icao})</td>
                <td>{flight.destination.city} ({flight.destination.iata || flight.destination.icao})</td>
                <td>{flight.departureTime || "N/A"}</td>
                <td>{flight.arrivalTime || "N/A"}</td>
                <td>{flight.duration ? flight.duration + " m" : "N/A"}</td>
                <td>{flight.distance ? flight.distance + " km" : "N/A"}</td>
                <td>{flight.seat || "N/A"}</td>
                <td>{flight.flightNumber || "N/A"}</td>
                <td>{flight.airplane || "N/A"}</td>
            </tr>
            ))}
        </table>
    );
}

export default function Home() {
    const [flightsData, setFlightsData] = useState<Flight[]>([]);

    useEffect(() => {
        flightsAPI.get()
        .then((data) => setFlightsData(data));
    }, []);

    return (
        <>
            <h1>Home</h1>
            <Statistics />
            <FlightsTable flights={flightsData} />
        </>
    );
}
