import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import {Heading, Label, Input, Checkbox, Subheading, Button} from '../components/Elements'
import {SettingsInterface, SettingsManager} from '../settingsManager';

export default function Settings() {
    const [options, setOptions] = useState<SettingsInterface>(SettingsManager.getAllSettings())
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
        if(exportType === "csv"){
            API.post("/exporting/csv", {})
            .then((res) => {
                const blob = new Blob([res], {
                    type: 'text/csv'
                });

                return blob;
            })
            .then((blob) => {
                // create element that links to download and click it, then remove it
                // https://stackoverflow.com/questions/41938718/how-to-download-files-using-axios 
                const href = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = href;
                link.setAttribute('download', 'jetlog.csv');

                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
                URL.revokeObjectURL(href);
            });
        }
    }

    const handleOptionChange = (event) => {
        const key = event.target.name;
        const value = event.target.checked.toString();

        setOptions({...options, [key]: value})
        SettingsManager.setSetting(key, value);
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
