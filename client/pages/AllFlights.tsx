import React, {useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import { Heading, Label, Input, Select, Dialog } from '../components/Elements';
import FlightsTable from '../components/FlightsTable';
import SingleFlight from '../components/SingleFlight';

interface FlightsFilters {
    limit?: number;
    offset?: number;
    order?: "DESC"|"ASC";
    start?: string;
    end?: string;
}
export default function AllFlights() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [filters, setFilters] = useState<FlightsFilters>()

    const flightID = searchParams.get("id");

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        var filters = {}

        formData.forEach((value, key) => {
            if(value) {
                filters = {...filters, [key]: value};
            }
        })

        setFilters(filters);
        //event.target.reset();
    }

    if(flightID) {
        return (
            <SingleFlight flightID={flightID} />
        );
    }
    else {
        return (
            <>
                <Heading text="All Flights" />
                <Dialog title="Filters"
                        onSubmit={handleSubmit}
                        formBody={(
                        <>
                            <Label text="Limit" />
                            <Input type="number" name="limit" />
                            <br />
                            <Label text="Offset" />
                            <Input type="number" name="offset" />
                            <br />
                            <Label text="Order" />
                            <Select name="order"
                                    options={[
                                { text: "Choose", value: "" },
                                { text: "Descending", value: "DESC" },
                                { text: "Ascending", value: "ASC" }
                            ]}/>
                            <br />
                            <Label text="Start Date" />
                            <Input type="date" name="start" />
                            <br />
                            <Label text="End Date" />
                            <Input type="date" name="end" />
                        </>
                        )}/>

                <FlightsTable filters={filters} />
            </>
        );
    }
}
