import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Heading, Label, Button, Input, Select } from '../components/Elements'
import AirportInput from '../components/AirportInput';

import API from '../api';
import { Airport, Flight } from '../models';

export default function New() {
    return (
    <>
        <Heading text="New Flight" />
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

        API.post("/flights", flight, () => navigate("/"))
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-start">

                <div className="container">
                    <Label text="Origin" required />
                    <AirportInput onSelected={(airport: Airport ) => setAirport(airport, "origin")} />
                    <br />
                    <Label text="Destination" required />
                    <AirportInput onSelected={(airport: Airport ) => setAirport(airport, "destination")} />
                    <br />
                    <Label text="Date" required />
                    <Input type="date"
                           name="date"
                           value={flight.date}
                           onChange={handleChange}
                           required />
                </div>

                <div className="container">
                    <Label text="Departure Time" />
                    <Input type="time"
                           name="departureTime"
                           value={flight.departureTime}
                           onChange={handleChange} />
                    <br />
                    <Label text="Arrival Time"/>
                    <Input type="time"
                           name="arrivalTime"
                           value={flight.arrivalTime}
                           onChange={handleChange}/>
                </div>

                <div className="container">
                    <Label text="Seat Type"/>
                    <Select name="seat"
                            value={flight.seat}
                            onChange={handleChange}
                            options={[
                                { text: "Choose", value: "" },
                                { text: "Aisle", value: "aisle" },
                                { text: "Middle", value: "middle" },
                                { text: "Window", value: "window" }
                            ]} />
                    <br />
                    <Label text="Airplane"/>
                    <Input type="text"
                           name="airplane"
                           value={flight.airplane}
                           placeholder="B738"
                           onChange={handleChange} />
                </div>

            </div>

            <Button text="Done"
                    level="success"
                    submit
                    disabled={!flight.origin || !flight.destination || !flight.date} />
        </form>
    );
}
