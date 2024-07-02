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
        <label>Flight Number:
            <input type="text" 
                   value={data.flightNumber || ''}
                   onChange={(e) => updateData(e.target.value.toUpperCase(), data.submitted)}
            />
        </label>
        <br />
        {data.flightNumber === "" ? 
            <button onClick={() => updateData(data.flightNumber, true)}>Continue manually</button> : 
            <button onClick={() => updateData(data.flightNumber, true)}>Next</button>
        }
    </form>
    );
}

function FlightDetails({ flightNumber }) {
    var initalFlight = new Flight();
    initalFlight.flightNumber = flightNumber;

    const [flight, setFlight] = useState<Flight>(initalFlight);
    const navigate = useNavigate();

    const updateFlight = (key: string, value: string | number) => {
        setFlight(Object.defineProperty({
            id: null,
            flightNumber: flight.flightNumber,
            departedFrom: flight.departedFrom,
            departureDate: flight.departureDate,
            departureTime: flight.departureTime,
            arrivedAt: flight.arrivedAt,
            arrivalDate: flight.arrivalDate,
            arrivalTime: flight.arrivalTime,
            seat: flight.seat,
            duration: flight.duration,
            airplane: flight.airplane,
        }, key, { value: value }));
    }

    const handleChange = (event) => {
        const key = event.target.name;
        const value = event.target.value;
        updateFlight(key, value);
    }

    const handleSubmit = (event) => {
        event.preventDefault();
       
        // calculate duration if possible
        console.log(flight.departureDate + flight.departureTime + flight.arrivalTime);
        if(flight.departureDate && flight.departureTime && flight.arrivalTime) {
            const departure = new Date(flight.departureDate + 'T' + flight.departureTime);
            const arrival = flight.arrivalDate ? 
                            new Date(flight.arrivalDate + 'T' + flight.arrivalTime) :
                            new Date(flight.departureDate + 'T' + flight.arrivalTime);

            const duration_millis = arrival.getTime() - departure.getTime();
            const duration_minutes = Math.round(duration_millis / (60 * 1000));

            flight.duration = duration_minutes; // no time to lose
        };
        flightsAPI.post(flight);

        navigate("/");
    }

    return (
        <form onSubmit={handleSubmit}>
            <label> Departure Airport
                <input type="text"
                       name="departedFrom"
                       value={flight.departedFrom || ''}
                       onChange={handleChange}
                       required
                />
            </label>
            <br />
            <label> Arrival Airport
                <input type="text"
                       name="arrivedAt"
                       value={flight.arrivedAt || ''}
                       onChange={handleChange}
                       required
                />
            </label>
            <br /> <br />
            <label> Departure Time
                <input type="date"
                       name="departureDate"
                       value={flight.departureDate || ''}
                       onChange={handleChange}
                       required
                />
                <input type="time"
                       name="departureTime"
                       value={flight.departureTime || ''}
                       onChange={handleChange}
                />
            </label>
            <br />
            <label> Arrival Time
                <input type="date"
                       name="arrivalDate"
                       value={flight.arrivalDate || ''}
                       onChange={handleChange}
                />
                <input type="time"
                       name="arrivalTime"
                       value={flight.arrivalTime || ''}
                       onChange={handleChange}
                />
            </label>
            <br /><br />
            <label> Seat Type
                <select name="seat"
                        value={flight.seat || ''}
                        onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="aisle">Aisle</option>
                    <option value="middle">Middle</option>
                    <option value="Window">Window</option>
                </select>
            </label>
            <br />
            <label> Airplane
                <input type="text"
                       name="airplane"
                       value={flight.airplane || ''}
                       onChange={handleChange}
                />
            </label>
            <br /><br />
            <button type="submit">Done</button>
        </form>
    );
}
