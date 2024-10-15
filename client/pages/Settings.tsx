import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import {Heading, Label, Input, Checkbox, Subheading, Button, Dialog} from '../components/Elements'
import ConfigStorage, {ConfigInterface} from '../storage/configStorage';
import {User} from '../models';
import TokenStorage from '../storage/tokenStorage';

export default function Settings() {
    const [options, setOptions] = useState<ConfigInterface>(ConfigStorage.getAllSettings())
    const [user, setUser] = useState<User>();
    const navigate = useNavigate();

    useEffect(() => {
        API.get("/auth/user")
        .then((data) => {
            setUser(data);
        });
    }, []);

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

    const editUser = (event) => {
        let userPatchData = Object.fromEntries(new FormData(event.currentTarget));
        userPatchData = Object.fromEntries(Object.entries(userPatchData).filter(([_, v]) => v != ""));

        API.patch(`/auth/user?username=${user?.username}`, userPatchData);
    }

    const logout = () => {
        TokenStorage.clearToken();
        window.location.href = "/login";
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

            <div className="container">
                <Subheading text="You"/>
                { user === undefined ?
                    <p>Loading...</p>
                    :
                    <>
                    <p>Username: <span>{user.username}</span></p>
                    <p>Admin: <span>{user.isAdmin.toString()}</span></p>
                    <p>Last login: <span>{user.lastLogin}</span></p>
                    <p>Created on: <span>{user.createdOn}</span></p>

                    <Dialog title="Edit"
                            formBody={(
                            <>
                                <Label text="New Username"/>
                                <Input type="text" name="username" placeholder={user.username}/>
                                <br />
                                <Label text="New Password"/>
                                <Input type="password" name="password"/>
                            </>
                            )}
                            onSubmit={editUser}/>

                    <Button text="Logout" level="danger" onClick={logout}/>
                    </>
                }
            </div>
        </div>
    </>
    );
}
