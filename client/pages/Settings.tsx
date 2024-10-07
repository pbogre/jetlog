import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import {Heading, Label, Input, Checkbox, Subheading, Button} from '../components/Elements'
import ConfigStorage, {ConfigInterface} from '../storage/configStorage';

export default function Settings() {
    const [options, setOptions] = useState<ConfigInterface>(ConfigStorage.getAllSettings())
    const navigate = useNavigate();

    const handleImportSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        for(const pair of formData.entries()) {
            const file = pair[1];

            if(file instanceof Blob && file.size > 0) {
                var sendFormData = new FormData();
                sendFormData.append('file', file);
                API.post(`/importing?csv_type=${pair[0]}`,sendFormData)
                .then(() => navigate("/"));
            }
        }
    }

    const handleExportClick = (exportType: string) => {
        if(exportType === "csv") {
            API.post("/exporting/csv", {}, true);
        } else if(exportType === "ical") {
            API.post("/exporting/ical", {}, true);
        }
    }

    const handleOptionChange = (event) => {
        const key = event.target.name;
        const value = event.target.checked.toString();

        setOptions({...options, [key]: value})
        ConfigStorage.setSetting(key, value);
    }

    return (
    <>
        <Heading text="Settings" />

        <div className="flex flex-wrap items-start">
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
                <Subheading text="Export"/>

                <Button text="Export to CSV" onClick={() => handleExportClick("csv")}/>
                <br />
                <Button text="Export to iCal" onClick={() => handleExportClick("ical")}/>
            </div>

            <div className="container">
                <Subheading text="Customization" />

                <div className="flex justify-between">
                    <Label text="Frequency based marker size" />
                    <Checkbox name="frequencyBasedMarker" 
                                checked={options.frequencyBasedMarker === "true"} 
                                onChange={handleOptionChange} />
                </div>

                <div className="flex justify-between">
                    <Label text="Frequency based line size" />
                    <Checkbox name="frequencyBasedLine" 
                                checked={options.frequencyBasedLine === "true"} 
                                onChange={handleOptionChange} />
                </div>

                <div className="flex justify-between">
                    <Label text="Use metric units" />
                    <Checkbox name="metricUnits" 
                                checked={options.metricUnits === "true"} 
                                onChange={handleOptionChange} />
                </div>
            </div>
        </div>
    </>
    );
}
