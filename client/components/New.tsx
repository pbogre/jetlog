import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { flightsAPI } from '../api';
import { Flight } from '../models';

export default function New() {
    const [data, setData] = useState({
        flightNumber: null,
        submitted: false
    });

    return (
    <>
        { data.submitted ?
            <FlightDetails flightNumber={data.flightNumber}/> : 
            <ChooseMode data={data} setData={setData}/>
        }
    </>
    );
}

// TODO: autofill for airports, with city/country and whatnot
// TODO: if flightNumber isn't empty on submit, use some flight 
// tracker API to fetch flight data, and use that as initial state
// for the manual data insertion
function ChooseMode({ data, setData }) {
    const handleSubmit = (event) => {
        event.preventDefault();
    }

    const updateData = (flightNumber: string, submitted: boolean) => {
        setData({
            flightNumber,
            submitted
        })
    }

    return(
    <form onSubmit={handleSubmit}>
        <label>Flight Number
            <input type="text" 
                   value={data.flightNumber || ''}
                   onChange={(e) => updateData(e.target.value.toUpperCase(), data.submitted)}
            />
        </label>
        <br />
        <button onClick={() => updateData(data.flightNumber, true)} disabled={!data.flightNumber} className="primary">Next</button>
        <button onClick={() => updateData(data.flightNumber, true)}>Continue manually</button>
    </form>
    );
}

function FlightDetails({ flightNumber }) {
    var initalFlight = new Flight();
    initalFlight.flightNumber = flightNumber;

    const [flight, setFlight] = useState<Flight>(initalFlight);
    const navigate = useNavigate();

    const updateFlight = (key: string, value: string | number) => {
        setFlight({...flight, [key]: value});
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

        flightsAPI.post(flight);

        navigate("/");
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Departure Airport</label>
            <input type="text"
                   name="origin"
                   value={flight.origin || ''}
                   onChange={handleChange}
                   placeholder="BGY"
                   required
            />
            <br />
            <label>Arrival Airport</label>
            <input type="text"
                   name="destination"
                   value={flight.destination || ''}
                   onChange={handleChange}
                   placeholder="EIN"
                   required
            />
            <br />
            <label>Date</label>
            <input type="date"
                   name="date"
                   value={flight.date || new Date().toLocaleDateString('en-CA') }
                   onChange={handleChange}
                   required
            />
            <br />
            <hr />
            <label>Departure Time</label>
            <input type="time"
                   name="departureTime"
                   value={flight.departureTime || ''}
                   placeholder="HH:mm"
                   onChange={handleChange}
            />
            <br />
            <label>Arrival Time</label>
            <input type="time"
                   name="arrivalTime"
                   value={flight.arrivalTime || ''}
                   placeholder="HH:mm"
                   onChange={handleChange}
            />
            <br />
            <hr />
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
                   onChange={handleChange}
            />
            <br /><br />
            <button type="submit" className="primary">Done</button>
        </form>
    );
}
