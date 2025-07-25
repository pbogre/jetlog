import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import { Heading, Label, Input, Checkbox, Subheading, Button, Dialog, Select } from '../components/Elements'
import ConfigStorage, { ConfigInterface } from '../storage/configStorage';
import { User } from '../models';
import TokenStorage from '../storage/tokenStorage';

interface UserInfoProps {
    user: User;
    isSelf?: boolean;
}
function UserInfo({user, isSelf = false} : UserInfoProps) {
    const editUser = async (event) => {
        let userPatchData = Object.fromEntries(new FormData(event.currentTarget));
        userPatchData = Object.fromEntries(Object.entries(userPatchData).filter(([_, v]) => v != ""));

        // if admin status not updated, dont include it in the patch data
        if ("isAdmin" in userPatchData && userPatchData["isAdmin"] === user.isAdmin.toString()) {
            delete userPatchData["isAdmin"];
        }

        if (Object.keys(userPatchData).length === 0) {
            return;
        }

        await API.patch(`/users/${user.username}`, userPatchData);

        window.location.reload();
    }

    const logout = () => {
        TokenStorage.clearToken();
        window.location.href = "/login";
    }

    const deleteUser = async () => {
        if (confirm("Are you sure? All flights associated with this user will also be removed.")) {
            await API.delete(`/users/${user.username}`);
            window.location.reload();
        }
    }

    return (
        <>
            <p>Username: <span>{user.username}</span></p>
            <p>Admin: <span>{user.isAdmin.toString()}</span></p>
            <p>Last login: <span>{user.lastLogin}</span></p>
            <p>Created on: <span>{user.createdOn}</span></p>

            <Dialog title="Edit User"
                    formBody={(
                    <>
                        <Label text="New Username"/>
                        <Input type="text" name="username" placeholder={user.username}/>
                        { isSelf ?
                            <></>
                            :
                            <>
                            <br />
                            <Label text="New Admin Status"/>
                            <Select name="isAdmin" options={[
                                {
                                    text: user.isAdmin.toString(),
                                    value: user.isAdmin.toString()
                                },
                                {
                                    text: (!user.isAdmin).toString(),
                                    value: (!user.isAdmin).toString()
                                }
                            ]} />
                            </>
                        }
                        <br />
                        <Label text="New Password"/>
                        <Input type="password" name="password"/>
                    </>
                    )}
                    onSubmit={editUser}/>

            { isSelf ?
                <Button text="Logout" level="danger" onClick={logout}/>
                :
                <Button text="Delete" level="danger" onClick={deleteUser}/>
            }
        </>
    )
}

export default function Settings() {
    const [options, setOptions] = useState<ConfigInterface>(ConfigStorage.getAllSettings())
    const [user, setUser] = useState<User>();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [disableJobs, setDisableJobs] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        API.get("/users/me")
        .then((data: User) => {
            setUser(data);

            if (data.isAdmin) {
                API.get("/users")
                .then((users: string[]) => {
                    for (let u of users) {
                        if (u === data.username) continue; // skip self

                        API.get(`/users/${u}/details`)
                        .then((user) => {
                            setAllUsers(prevAllUsers => {
                                return [...prevAllUsers, user];
                            });
                        });
                    }
                });
            }
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
                API.post(`/importing?csv_type=${pair[0]}`, sendFormData)
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

    const changeOption = (event) => {
        const key = event.target.name;
        const value = event.target.checked.toString();

        setOptions({...options, [key]: value})
        ConfigStorage.setSetting(key, value);
    }

    const createUser = async (event) => {
        let userData = Object.fromEntries(new FormData(event.currentTarget));
        await API.post("/users", userData);

        window.location.reload();
    }

    const computeConnections = async () => {
        setDisableJobs(true);

        API.post("/flights/connections", {})
        .then((data: object) => {
            alert(`Flights skipped: ${data["amountSkipped"]}\nFlights updated: ${data["amountUpdated"]}`);
            setDisableJobs(false);
        });
    }

    const fetchAirlinesFromCallsigns = async () => {
        setDisableJobs(true);

        API.post("/flights/airlines_from_callsigns", {})
        .then((data: object) => {
            alert(`Flights skipped: ${data["amountSkipped"]}\nFlights updated: ${data["amountUpdated"]}`);
            setDisableJobs(false);
        })
    }

    return (
    <>
        <Heading text="Settings" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div className="container">
                <Subheading text="Import"/>

                <form onSubmit={handleImportSubmit}>
                    <Label text="MyFlightRadar24" />
                    <Input type="file" name="myflightradar24" />

                    <Label text="Flighty" />
                    <Input type="file" name="flighty" />

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
                                onChange={changeOption} />
                </div>

                <div className="flex justify-between">
                    <Label text="Frequency based line size" />
                    <Checkbox name="frequencyBasedLine" 
                                checked={options.frequencyBasedLine === "true"} 
                                onChange={changeOption} />
                </div>

                <div className="flex justify-between">
                    <Label text="Show visited countries" />
                    <Checkbox name="showVisitedCountries" 
                                checked={options.showVisitedCountries === "true"} 
                                onChange={changeOption} />
                </div>

                <div className="flex justify-between">
                    <Label text="Use metric units" />
                    <Checkbox name="metricUnits" 
                                checked={options.metricUnits === "true"} 
                                onChange={changeOption} />
                </div>

                <div className="flex justify-between">
                    <Label text="Use airport timezones for duration" />
                    <Checkbox name="localAirportTime" 
                                checked={options.localAirportTime === "true"} 
                                onChange={changeOption} />
                </div>

                <hr />

                <Subheading text="Utilities" />

                <div className="flex justify-between">
                    <Label text="Compute flight connections" />
                    <Button text="Run" disabled={disableJobs} onClick={computeConnections} />
                </div>

                <div className="flex justify-between">
                    <Label text="Fetch missing airlines" />
                    <Button text="Run" disabled={disableJobs} onClick={fetchAirlinesFromCallsigns} />
                </div>
            </div>


            <div className="container">
                <Subheading text="You"/>
                { user === undefined ?
                    <p>Loading...</p>
                    :
                    <UserInfo user={user} isSelf/>
                }
            </div>

            { user === undefined || !user.isAdmin ?
                <></>
                :
                allUsers === undefined ?
                    <p>Loading...</p>
                    :
                    <>
                        <div className="container w-full">
                            <Subheading text="User Management"/>
                            <div className="grid gap-3">
                                {allUsers.map((u) => (
                                    <div className="border-gray-500 border p-2">
                                        <UserInfo user={u}/>
                                    </div> 
                                ))}
                            </div>
                            <Dialog 
                                title="Create User" 
                                buttonLevel="success" 
                                onSubmit={createUser} 
                                formBody={(
                                    <>
                                        <Label text="Username" required/>
                                        <Input type="text" name="username" required/>
                                        <br />
                                        <Label text="Admin Status" required/>
                                        <Select name="isAdmin" options={[
                                            { text: "false", value: "false" },
                                            { text: "true", value: "true" }
                                        ]} />
                                        <br />
                                        <Label text="Password" required/>
                                        <Input type="text" name="password" required/>
                                    </>
                                )}
                            />
                        </div>
                    </>
            }
        </div>
    </>
    );
}
