import React from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import {Heading, Label, Input, Subheading, Button} from '../components/Elements'

export default function Settings() {
    const navigate = useNavigate();

    const handleImportSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        for(const pair of formData.entries()) {
            const file = pair[1];

            if(file instanceof Blob && file.size > 0) {
                var sendFormData = new FormData();
                sendFormData.append('file', file);
                API.post(`/importing?csv_type=${pair[0]}`,sendFormData, () => navigate("/"));
            }
        }
    }

    return (
    <>
        <Heading text="Settings" />

        <div className="container">
            <Subheading text="Import"/>

            <form onSubmit={handleImportSubmit}>
                <Label text="MyFlightRadar24" />
                <Input type="file" name="myflightradar24" />

                <Label text="Custom CSV" />
                <Input type="file" name="custom" />

                <br />
                <Button text="Import" level="success" submit/>
            </form>
        </div>

        <div className="container">
            <Subheading text="Customization" />
            <p className="mt-2">Coming soon...</p>
        </div>
    </>
    );
}
