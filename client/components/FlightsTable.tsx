import React from 'react';
import { Link } from 'react-router-dom';

import { Flight } from '../models'

import '../css/flights-table.css'


function TableCell({ flightID, content }) {
    return (
        <td><Link to={`/flights?id=${flightID}`}>{content}</Link></td>
    );
}

interface FlightsTableProps {
    flights: Flight[];
}

export default function FlightsTable({ flights }: FlightsTableProps) {
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
                <th>Distance</th>
                <th>Seat</th>
                <th>Airplane</th>
            </tr>
            { flights.map((flight: Flight) => (
                <tr>
                    <TableCell flightID={flight.id} content={flight.date}/>
                    <TableCell flightID={flight.id} content={flight.origin.city + '(' + (flight.origin.iata || flight.origin.icao) + ')'}/>
                    <TableCell flightID={flight.id} content={flight.destination.city + '(' + (flight.destination.iata || flight.destination.icao) + ')'} />
                    <TableCell flightID={flight.id} content={flight.departureTime || "N/A"}/>
                    <TableCell flightID={flight.id} content={flight.arrivalTime || "N/A"}/>
                    <TableCell flightID={flight.id} content={flight.duration ? flight.duration + " min" : "N/A"}/>
                    <TableCell flightID={flight.id} content={flight.distance ? flight.distance.toLocaleString() + " km" : "N/A"}/>
                    <TableCell flightID={flight.id} content={flight.seat || "N/A"}/>
                    <TableCell flightID={flight.id} content={flight.airplane || "N/A"}/>
                </tr>
            ))}
        </table>
    );
}
