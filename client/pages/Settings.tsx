import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import {Heading, Label, Input, Checkbox, Subheading, Button} from '../components/Elements'
import {SettingsInterface} from '../settings';

export default function Settings() {
    const [options, setOptions] = useState<SettingsInterface>({
       frequencyBasedMarker: localStorage.getItem("frequencyBasedMarker") || "true",
       frequencyBasedLine: localStorage.getItem("frequencyBasedLine") || "true",
       militaryClock: localStorage.getItem("militaryClock") || "true",
       metricUnits: localStorage.getItem("metricUnits") || "true"
    })
    const navigate = useNavigate();

    useEffect(() => {
        for(var key in options)  {
            localStorage.setItem(key, options[key]);
        }
    }, [options]) 

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

    const handleOptionChange = (event) => {
        const key = event.target.name;
        const value = event.target.checked.toString();

        setOptions({...options, [key]: value})
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

            <div className="flex justify-between">
                <Label text="Frequency based marker size" />
                <Checkbox name="frequencyBasedMarker" 
                            checked={options.frequencyBasedMarker == "true"} 
                            onChange={handleOptionChange} />
            </div>

            <div className="flex justify-between">
                <Label text="Frequency based line size" />
                <Checkbox name="frequencyBasedLine" 
                            checked={options.frequencyBasedLine == "true"} 
                            onChange={handleOptionChange} />
            </div>

            <div className="flex justify-between">
                <Label text="Use military clock time (24h)" />
                <Checkbox name="militaryClock" 
                            checked={options.militaryClock == "true"} 
                            onChange={handleOptionChange} />
            </div>

            <div className="flex justify-between">
                <Label text="Use metric units" />
                <Checkbox name="metricUnits" 
                            checked={options.metricUnits == "true"} 
                            onChange={handleOptionChange} />
            </div>
        </div>
    </>
    );
}
