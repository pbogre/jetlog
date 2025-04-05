import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

import { Heading, Label, Button, Input, Select, TextArea } from '../components/Elements';
import SearchInput from '../components/SearchInput'
import API from '../api';
import { objectFromForm } from '../utils';
import {Airline, Airport} from '../models';
import ConfigStorage from '../storage/configStorage';

export default function New() {
    const navigate = useNavigate();

    const [flightNumber, setFlightNumber] = useState('');
    const [fetchedOrigin, setFetchedOrigin] = useState<Airport>()
    const [fetchedDestination, setFetchedDestination] = useState<Airport>()
    const [fetchedAirline, setFetchedAirline] = useState<Airline>()
    const [fetchedConnection, setFetchedConnection] = useState<number>()

    const localAirportTime = ConfigStorage.getSetting("localAirportTime");

    const postFlight = async (event) => {
        event.preventDefault();

        const flightData = objectFromForm(event);

        if (flightData === null) {
            return;
        }

        API.post(`/flights?timezones=${localAirportTime}`, flightData)
            .then((flightID) => navigate(`/flights?id=${flightID}`));
    };

    const attemptFetchFlight = async () => {
        API.getRemote(`https://api.adsbdb.com/v0/callsign/${flightNumber}`)
        .then(async (data: Object) => {
            const originICAO = data["response"]["flightroute"]["origin"]["icao_code"];
            const destinationICAO = data["response"]["flightroute"]["destination"]["icao_code"];
            const airlineICAO = data["response"]["flightroute"]["airline"]["icao"];
            
            const origin = await API.get(`/airports/${originICAO}`);
            const destination= await API.get(`/airports/${destinationICAO}`);
            const airline = await API.get(`/airlines/${airlineICAO}`)

            setFetchedOrigin({...origin});
            setFetchedDestination({...destination});
            setFetchedAirline({ ...airline });
        });
    };

    return (
        <>
            <Heading text="New Flight" />

            <form onSubmit={postFlight}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    <div className="container">
                        <Label text="Origin" required />
                        <SearchInput name="origin" type="airports" subject={fetchedOrigin} />
                        <br />
                        <Label text="Destination" required />
                        <SearchInput name="destination" type="airports" subject={fetchedDestination} />
                        <br />
                        <Label text="Date" required />
                        <Input
                            type="date"
                            name="date"
                            defaultValue={(new Date()).toISOString().substring(0, 10)}
                            required
                        />

                        <br />
                        <Label text="Departure Time" />
                        <Input
                            type="time"
                            name="departureTime"
                        />
                        <br />
                        <Label text="Arrival Time" />
                        <Input
                            type="time"
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
                                <Label text="Seat Type" />
                                <Select
                                    name="seat"
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
                                    name="aircraftSide"
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
                                    name="ticketClass"
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
                                    name="purpose"
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

                        <br />
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
                                <SearchInput name="airline" type="airlines" subject={fetchedAirline} />
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
                            <div className="h-10 flex items-center">
                                <Button text="Fetch" onClick={attemptFetchFlight} disabled={!flightNumber} />
                            </div>
                        </div>
                    </div>

                    <div className="container md:col-span-2 lg:col-span-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div>
                            <Label text="Connection" />    
                            <Input
                                type="text"
                                name="connection"
                                placeholder="Search existing..." 
                                onChange={ (e) => setFetchedConnection(parseInt(e.target.value)) }
                            />
                            </div>

                            { fetchedConnection &&
                                <div>
                                   <Label text="Layover duration" />
                                   <Input
                                        type="text"
                                        name="layoverDuration"
                                    />
                                </div>
                            }
                        </div>

                        <Label text="Notes" />
                        <TextArea
                            name="notes"
                            maxLength={150}
                        />
                    </div>
                </div>

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
