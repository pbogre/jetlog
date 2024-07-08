import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AirportInput from '../components/AirportInput';

import API from '../api';
import { Airport, Flight } from '../models';

import '../css/form.css'

export default function New() {
    return (
    <>
        <h1>New flight</h1>

        <FlightDetails />
    </>
    );
}

function FlightDetails() {
    var initalFlight = new Flight();
    initalFlight.date = new Date().toLocaleDateString('en-CA');

    const [flight, setFlight] = useState<Flight>(initalFlight);
    const navigate = useNavigate();

    const updateFlight = (key: string, value: any) => {
        setFlight({...flight, [key]: value});
    };

    const setAirport = (airport: Airport, type: "origin"|"destination") => {
        updateFlight(type, airport);
    }

    const handleChange = (event) => {
        const key = event.target.name;
        const value = event.target.value;

        updateFlight(key, value);
    }

    // https://en.wikipedia.org/wiki/Haversine_formula
    const sphericalDistance = (originLat: number, originLon: number, 
                               destinationLat: number, destinationLon: number) => {
        // convert to radian
        originLat *= Math.PI / 180.0;
        originLon *= Math.PI / 180.0;
        destinationLat *= Math.PI / 180.0;
        destinationLon *= Math.PI / 180.0;

        // get delta's
        const deltaLat = originLat - destinationLat;
        const deltaLon = originLon - destinationLon;

        // apply Haversine formulas
        const havDeltaLat = Math.pow(Math.sin(deltaLat / 2), 2);
        const havDeltaLon = Math.pow(Math.sin(deltaLon / 2), 2);

        const havTheta = havDeltaLat + 
                         havDeltaLon * Math.cos(originLat) * Math.cos(destinationLat)

        const earthRadius = 6371; // km
        const distance = 2 * earthRadius * Math.asin(Math.sqrt(havTheta));

        return Math.round(distance);
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        // calculate duration if possible
        if(flight.date && flight.departureTime && flight.arrivalTime) {
            const departure = new Date(flight.date + 'T' + flight.departureTime);
            const arrival = new Date(flight.date + 'T' + flight.arrivalTime);

            if(arrival.getTime() <= departure.getTime()) {
                arrival.setDate(arrival.getDate() + 1);
            }

            const duration_millis = arrival.getTime() - departure.getTime();
            const duration_minutes = Math.round(duration_millis / (60 * 1000));

            flight.duration = duration_minutes; // no time to lose
        };

        // calculate distance
        const distance = sphericalDistance(flight.origin.latitude,
                                           flight.origin.longitude,
                                           flight.destination.latitude,
                                           flight.destination.longitude);
        flight.distance = distance;

        API.post("/flights", flight, () => navigate("/"))
    }

    return (
        <form onSubmit={handleSubmit}>

            <div className="container">
                <AirportInput type="origin" callback={setAirport} />
                <br />
                <AirportInput type="destination" callback={setAirport} />
                <br />
                <label className="required">Date</label>
                <input type="date"
                       name="date"
                       value={flight.date}
                       onChange={handleChange}
                       required />
            </div>

            <div className="container">
                <label>Departure Time</label>
                <input type="time"
                       name="departureTime"
                       value={flight.departureTime || ''}
                       onChange={handleChange} />
                <br />
                <label>Arrival Time</label>
                <input type="time"
                       name="arrivalTime"
                       value={flight.arrivalTime || ''}
                       onChange={handleChange}/>
            </div>

            <div className="container">
                <label>Seat Type</label>
                <select name="seat"
                        value={flight.seat || ''}
                        onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="aisle">Aisle</option>
                    <option value="middle">Middle</option>
                    <option value="window">Window</option>
                </select>
                <br />
                <label>Airplane</label>
                <input type="text"
                       name="airplane"
                       value={flight.airplane || ''}
                       placeholder="B738"
                       onChange={handleChange} />
            </div>

            <br  />

            <button type="submit" 
                    className="primary" 
                    disabled={!flight.origin || !flight.destination || !flight.date}>
                    Done
            </button>
        </form>
    );
}
