import React from 'react';
import {useSearchParams} from 'react-router-dom';

import FlightsTable from '../components/FlightsTable';
import SingleFlight from '../components/SingleFlight'

export default function AllFlights() {
    const [searchParams, setSearchParams] = useSearchParams()

    const flightID = searchParams.get("id");

    if(flightID) {
        return (
            <SingleFlight flightID={flightID} />
        );
    }
    else {
        return (
            <>
                <h1>All Flights</h1>
                <FlightsTable />
            </>
        );
    }
}
