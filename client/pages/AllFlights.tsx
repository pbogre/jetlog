import React from 'react';
import {useSearchParams} from 'react-router-dom';

import { Heading } from '../components/Elements';
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
                <Heading text="All Flights" />
                <FlightsTable />
            </>
        );
    }
}
