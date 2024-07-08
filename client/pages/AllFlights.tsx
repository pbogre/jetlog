import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import FlightsTable from '../components/FlightsTable';
import SingleFlight from '../components/SingleFlight'

import API from '../api';
import { Flight } from '../models';

export default function AllFlights() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [flightsData, setFlightsData] = useState<Flight[]>([]);
    const [singleFlightData, setSingleFlightData] = useState<Flight|null>(null);

    const flightID = searchParams.get("id");

    useEffect(() => {
        var endpoint = "/flights";
        if (flightID) endpoint += `?id=${flightID}`

        API.get(endpoint)
        .then((data) => {
            if(flightID) { setSingleFlightData(data) }
            else { setFlightsData(data) }
        });
    }, [flightID]);

    if(flightID) {
        return (
            <SingleFlight flight={singleFlightData} />
        );
    }
    else {
        return (
            <>
                <h1>All Flights</h1>
                <FlightsTable flights={flightsData} />
            </>
        );
    }
}
