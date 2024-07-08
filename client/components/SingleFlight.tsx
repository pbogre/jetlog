import React from 'react';

import { Flight } from '../models';
import API from '../api';

import '../css/form.css';
import {useNavigate} from 'react-router-dom';

interface FlightProps {
    flight: Flight|null;
}

export default function SingleFlight({ flight }: FlightProps) {
    if(!flight) {
        return (
            <p>Loading...</p>
        );
    }

    const navigate = useNavigate();

    const handleDeleteClick = () => {
        if(confirm("Are you sure?")) {
            API.delete(`/flights?id=${flight.id}`, () => navigate("/flights"));
        }
    }

    return (
        <>
            <h1>{flight.origin.iata || flight.origin.city } to {flight.destination.iata || flight.destination.city}</h1>
            <h2 className="subheading">{flight.date}</h2>

            <div className="container">
                <h3 className="container-heading">Timings</h3>

                <p>Date: <span>{flight.date}</span></p>
                <p>Departure Time: <span>{flight.departureTime || "N/A"}</span></p>
                <p>Arrival Time: <span>{flight.arrivalTime || "N/A"}</span></p>
                <p>Duration: <span>{flight.duration ? flight.duration + " min" : "N/A"}</span></p>
            </div>

            <div className="container">
                <h3 className="container-heading">Airports</h3>

                <p>Origin: <span>{flight.origin.iata || flight.origin.icao} ({flight.origin.city}/{flight.origin.country})</span></p>
                <p>Destination: <span>{flight.destination.iata || flight.destination.icao} ({flight.destination.city}/{flight.destination.country})</span></p>
                <p>Distance: <span>{flight.distance ? flight.distance + " km" : "N/A"}</span></p>
            </div>

            <div className="container">
                <h3 className="container-heading">Other</h3>

                <p>Seat: <span>{flight.seat || "N/A"}</span></p>
                <p>Airplane: <span>{flight.airplane || "N/A"}</span></p>
            </div>

            <br />

            <button className="danger" onClick={handleDeleteClick}>Delete</button>
        </>
    );
}
