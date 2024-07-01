import React, {useState} from "react";
import axios from "axios";

function FlightList({ list }) {
    if(list === null) {
        return (
            <p>Loading...</p>
        );
    }
    else if (list.length === 0) {
        return (
            <p>No flights!</p>
        );
    }

    return (
        <div>
        { list.map((flight) => (
            <li>
                <p>From {flight.departedFrom} to {flight.arrivedAt}, on {flight.departureDate}</p>
            </li>
        ))}
        </div>
    );
}

export default function Home() {
    const [flightsData, setFlightsData] = useState(null);

    React.useEffect(() => {
        axios.get("/api/flights")
        .then((res) => {
            setFlightsData(res.data);
        })
        .catch((err) => {
            setFlightsData(err)
        })
    }, [])

    return (
        <>
            <h1>Home</h1>
            <FlightList list={flightsData} />
        </>
    );
}
