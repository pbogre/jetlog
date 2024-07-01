import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
// tracker API to fetch flight data
function ChooseMode({ data, setData }) {
    const handleSubmit = (event) => {
        event.preventDefault();
    }

    const updateData = (flightNumber, submitted) => {
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
    const initialState = {
        flightNumber,
        departedFrom: null,
        departureDate: null,
        departureTime: null,
        arrivedAt: null,
        arrivalDate: null,
        arrivalTime: null,
        seat: null,
        airplane: null
    }

    const [inputs, setInputs] = useState(initialState);
 
    const handleChange = (event) => {
        const key = event.target.name;
        const value = event.target.value;
        setInputs({...inputs, [key]: value});
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        let createdID = null;

        React.useEffect(() => {
            axios.post("/api/flights", inputs)
            .then((res) => {
                createdID = res.data;
            })
        }, [])

        const navigate = useNavigate()
        navigate("/")
    }

    return (
        <form onSubmit={handleSubmit}>
            <label> Departure Airport
                <input type="text"
                       name="departedFrom"
                       value={inputs.departedFrom || ''}
                       onChange={handleChange}
                       required
                />
            </label>
            <br />
            <label> Arrival Airport
                <input type="text"
                       name="arrivedAt"
                       value={inputs.arrivedAt || ''}
                       onChange={handleChange}
                       required
                />
            </label>
            <br /> <br />
            <label> Departure Time
                <input type="date"
                       name="departureDate"
                       value={inputs.departureDate || ''}
                       onChange={handleChange}
                       required
                />
                <input type="time"
                       name="departureTime"
                       value={inputs.departureTime || ''}
                       onChange={handleChange}
                />
            </label>
            <br />
            <label> Arrival Time
                <input type="date"
                       name="arrivalDate"
                       value={inputs.arrivalDate || ''}
                       onChange={handleChange}
                />
                <input type="time"
                       name="arrivalTime"
                       value={inputs.arrivalTime || ''}
                       onChange={handleChange}
                />
            </label>
            <br /><br />
            <label> Seat Type
                <select name="seat"
                        value={inputs.seat || ''}
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
                       value={inputs.airplane || ''}
                       onChange={handleChange}
                />
            </label>
            <br /><br />
            <button type="submit">Done</button>
        </form>
    );
}
