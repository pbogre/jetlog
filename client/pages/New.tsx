import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Heading, Label, Button, Input, Select, TextArea } from '../components/Elements';
import SearchInput from '../components/SearchInput';
import TimeInput from '../components/TimeInput';
import API, { ENABLE_EXTERNAL_APIS } from '../api';
import { objectFromForm } from '../utils';
import { Airline, Airport, User } from '../models';
import ConfigStorage from '../storage/configStorage';
import FetchConnection from '../components/FetchConnection';

function TravelerFields({ username }: { username: string }) {
    return (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div>
                <Label text="Seat Type" />
                <Select
                    name={`seat__${username}`}
                    options={[
                        { text: "Choose", value: "" },
                        { text: "Aisle", value: "aisle" },
                        { text: "Middle", value: "middle" },
                        { text: "Window", value: "window" }
                    ]}
                />
            </div>
            <div>
                <Label text="Aircraft Side" />
                <Select
                    name={`aircraftSide__${username}`}
                    options={[
                        { text: "Choose", value: "" },
                        { text: "Left", value: "left" },
                        { text: "Right", value: "right" },
                        { text: "Center", value: "center" }
                    ]}
                />
            </div>
            <div>
                <Label text="Class" />
                <Select
                    name={`ticketClass__${username}`}
                    options={[
                        { text: "Choose", value: "" },
                        { text: "Private", value: "private" },
                        { text: "First", value: "first" },
                        { text: "Business", value: "business" },
                        { text: "Economy+", value: "economy+" },
                        { text: "Economy", value: "economy" }
                    ]}
                />
            </div>
            <div>
                <Label text="Purpose" />
                <Select
                    name={`purpose__${username}`}
                    options={[
                        { text: "Choose", value: "" },
                        { text: "Leisure", value: "leisure" },
                        { text: "Business", value: "business" },
                        { text: "Crew", value: "crew" },
                        { text: "Other", value: "other" }
                    ]}
                />
            </div>
        </div>
        <div>
            <Label text="Notes"/>
            <TextArea 
                name={`notes__${username}`}
                placeholder="Type here..." 
                maxLength={150}
            />
        </div>
        </>
    );
}

export default function New() {
    const navigate = useNavigate();

    const [date, setDate] = useState<string>((new Date()).toISOString().substring(0, 10));
    const [flightNumber, setFlightNumber] = useState<string>();
    const [origin, setOrigin] = useState<Airport>();
    const [destination, setDestination] = useState<Airport>();
    const [airline, setAirline] = useState<Airline>();
    const [connection, setConnection] = useState<number>();

    // delegation (admin-only for now)
    const [currentUser, setCurrentUser] = useState<User | undefined>();
    const [allUsernames, setAllUsernames] = useState<string[] | undefined>();
    const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);

    const localAirportTime = ConfigStorage.getSetting("localAirportTime");

    useEffect(() => {
        // Get current user; if admin, load users list
        // Own username cannot be unselected because 
        // delegation should be used when multiple users
        // board the same flight
        API.get('/users/me').then((me: User) => {
            setCurrentUser(me);
            setSelectedUsernames([me.username]);
            if (me.isAdmin) {
                API.get('/users')
                .then((users: string[]) => {
                    users = users.filter(username => username !== me.username);
                    setAllUsernames(users);
                });
            }
        });
    }, []);

    const postFlight = async (event) => {
        event.preventDefault();

        const rawFormData = objectFromForm(event);
        if (rawFormData === null) {
            return;
        }

        // Build payload from form data
        const sharedFields = ["airline", "origin", "destination", "date", 
            "flightNumber", "departureTime", "arrivalTime", "arrivalDate",
            "airplane", "tailNumber"];
        let payload = selectedUsernames.map(selectedUsername => {
            var userFlight = { username: selectedUsername };

            for (const sharedField of sharedFields) {
                userFlight[sharedField] = rawFormData[sharedField];
            }

            for (const [key, value] of Object.entries(rawFormData)) {
                const [field, user] = key.split("__");
                if (user == selectedUsername) {
                    userFlight[field] = value;
                }
            }

            return userFlight;
        });

        console.log(payload);

        if (payload.length == 1) {
            API.post(`/flights?timezones=${localAirportTime}`, payload[0])
            .then(flightID => navigate(`/flights?id=${flightID}`));
        } else {
            API.post(`/flights/many?timezones=${localAirportTime}`, payload)
            .then(creatorFlightID => navigate(`/flights?id=${creatorFlightID}`));
        }
    };

    const attemptFetchFlight = async () => {
        if (!ENABLE_EXTERNAL_APIS) {
            return;
        }

        API.getRemote(`https://api.adsbdb.com/v0/callsign/${flightNumber}`)
        .then(async (data: Object) => {
            const originICAO = data["response"]["flightroute"]["origin"]["icao_code"];
            const destinationICAO = data["response"]["flightroute"]["destination"]["icao_code"];
            const airlineICAO = data["response"]["flightroute"]["airline"]["icao"];

            const origin = await API.get(`/airports/${originICAO}`);
            const destination= await API.get(`/airports/${destinationICAO}`);
            const airline = await API.get(`/airlines/${airlineICAO}`)

            setOrigin({...origin});
            setDestination({...destination});
            setAirline({ ...airline });
        });
    };

    return (
        <>
            <Heading text="New Flight" />

            <form onSubmit={postFlight}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div className="container">
                        <Label text="Origin" required />
                        <SearchInput name="origin"
                                     type="airports"
                                     value={origin}
                                     onSelect={(airport: Airport) => setOrigin(airport)} />
                        <br />
                        <Label text="Destination" required />
                        <SearchInput name="destination"
                                     type="airports"
                                     value={destination}
                                     onSelect={(airport: Airport) => setDestination(airport)} />
                        <br />
                        <Label text="Date" required />
                        <Input
                            type="date"
                            name="date"
                            defaultValue={(new Date()).toISOString().substring(0, 10)}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />

                        <br />
                        <Label text="Departure Time" />
                        <TimeInput
                            name="departureTime"
                        />
                        <br />
                        <Label text="Arrival Time" />
                        <TimeInput
                            name="arrivalTime"
                        />
                        <br />
                        <Label text="Arrival Date" />
                        <Input
                            type="date"
                            name="arrivalDate"
                        />
                    </div>

                    <div className="container">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label text="Airplane" />
                                <Input type="text" name="airplane" placeholder="B738" maxLength={16} />
                            </div>
                            <div>
                                <Label text="Tail Number" />
                                <Input type="text" name="tailNumber" placeholder="EI-DCL" maxLength={16} />
                            </div>
                        </div>

                        <br />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div>
                                <Label text="Airline" />
                                <SearchInput name="airline"
                                             type="airlines"
                                             value={airline}
                                             onSelect={(airline: Airline) => setAirline(airline)} />
                            </div>
                            <div className="whitespace-nowrap">
                                <Label text="Flight Number" />
                                <Input
                                    type="text"
                                    name="flightNumber"
                                    placeholder="FR2460"
                                    maxLength={7}
                                    onChange={(e) => setFlightNumber(e.target.value)}
                                />
                            </div>
                            { ENABLE_EXTERNAL_APIS && 
                                <div className="h-10 flex items-center">
                                    <Button text="Fetch" onClick={attemptFetchFlight} disabled={!flightNumber} />
                                </div>
                            }
                        </div>
                        <div>
                            <Label text="Connection" />
                            <FetchConnection name="connection"
                                             date={date}
                                             origin={origin?.icao}
                                             destination={destination?.icao}
                                             value={connection}
                                             onFetched={(c: number) => setConnection(c)} />
                        </div>
                    </div>
                </div>

                {currentUser?.isAdmin && allUsernames && (
                    <div className="px-4 pb-2">
                        <Label text="Add flight for users" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                            {allUsernames.map((username) => (
                                <label key={username} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsernames.includes(username)}
                                        onChange={() => setSelectedUsernames((prev) => {
                                            if (prev.includes(username)) return prev.filter(u => u !== username);
                                            return [...prev, username];
                                        })}
                                    />
                                    <span>{username}</span>
                                </label>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                            {selectedUsernames.map((selectedUsername) => (
                                <div key={selectedUsername} className="container">
                                    <div className="font-medium mb-2">Traveler: {selectedUsername}</div>
                                    <TravelerFields username={selectedUsername} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!currentUser?.isAdmin && currentUser && (
                    <div className="px-4 pb-2">
                        <div className="container">
                            <TravelerFields username={currentUser.username} />
                        </div>
                    </div>
                )}

                <div className="px-4 pb-4">
                    <Button
                        text="Done"
                        submit
                    />
                </div>
            </form>
        </>
    );
}
