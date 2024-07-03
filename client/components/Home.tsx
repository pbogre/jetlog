import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';

import { flightsAPI } from '../api';
import { Flight } from '../models';

import '../css/flights.css'

function FlightsTable({ flights }) {
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

    return (
        <table className="flights-table">
            <tr>
                <th>Date</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Departure Time</th>
                <th>Arrival Time</th>
                <th>Duration</th>
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
                <td>{flight.duration && new Date(flight.duration * 60 * 1000).toISOString().substring(11, 16) || "N/A"}</td>
                <td>{flight.seat || "N/A"}</td>
                <td>{flight.flightNumber || "N/A"}</td>
                <td>{flight.airplane || "N/A"}</td>
            </tr>
            ))}
        </table>
    );
}

FlightsTable.propTypes = {
    flights: PropTypes.arrayOf(PropTypes.instanceOf(Flight))
}

export default function Home() {
    const [flightsData, setFlightsData] = useState(null);

    useEffect(() => {
        flightsAPI.get(setFlightsData);
    }, []);

    return (
        <>
            <h1>Home</h1>
            <FlightsTable flights={flightsData} />
        </>
    );
}
