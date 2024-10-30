import React, {useState} from 'react';

import {Heading, Label, Input, Dialog} from '../components/Elements'
import {AllStats} from '../components/Stats';

import { objectFromForm } from '../utils';

interface StatisticsFilters {
    start?: string;
    end?: string;
}
export default function Statistics() {
    const [filters, setFilters] = useState<StatisticsFilters>();

    const saveFilters = (event) => {
        event.preventDefault();

        const newFilters = objectFromForm(event);

        if (newFilters === null) {
            return;
        }

        setFilters(newFilters);
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
                onSubmit={saveFilters} />

        <AllStats filters={filters} />
    </>
    );
}
