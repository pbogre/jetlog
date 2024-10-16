import React, {useState} from 'react';

import {Heading, Label, Input, Dialog} from '../components/Elements'
import {AllStats} from '../components/Stats';

interface StatisticsFilters {
    start?: string;
    end?: string;
}
export default function Statistics() {
    const [filters, setFilters] = useState<StatisticsFilters>();

    const handleSubmit = (event) => {
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

    return (
    <>
        <Heading text="Statistics" />
        <Dialog title="Filters"
                formBody={(
                <>
                    <Label text="Start Date" />
                    <Input type="date" name="start" />
                    <br />
                    <Label text="End Date" />
                    <Input type="date" name="end" />
                </>
                )}
                onSubmit={handleSubmit} />

        <AllStats filters={filters} />
    </>
    );
}
