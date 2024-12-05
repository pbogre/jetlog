import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Heading, Label, Button, Input, Select, TextArea } from '../components/Elements'
import AirportInput from '../components/AirportInput';

import API from '../api';
import { objectFromForm } from '../utils';

export default function New() {
    const navigate = useNavigate();

    const postFlight = (event) => {
        event.preventDefault();

        const flightData = objectFromForm(event);

        if (flightData === null) {
            return;
        }

        API.post("/flights", flightData)
        .then(() => navigate("/"));
    }
    return (
    <>
        <Heading text="New Flight" />

        <form onSubmit={postFlight}>
            <div className="flex flex-wrap">

                <div className="container">
                    <Label text="Origin" required />
                    <AirportInput name="origin" />
                    <br />
                    <Label text="Destination" required />
                    <AirportInput name="destination" />
                    <br />
                    <Label text="Date" required />
                    <Input type="date"
                           name="date"
                           defaultValue={(new Date()).toISOString().substring(0, 10)} // today's date 
                           required />
                </div>

                <div className="container">
                    <Label text="Departure Time" />
                    <Input type="time"
                           name="departureTime" />
                    <br />
                    <Label text="Arrival Time"/>
                    <Input type="time"
                           name="arrivalTime"/>
                    <br />
                    <Label text="Arrival Date" />
                    <Input type="date"
                           name="arrivalDate" />
                </div>

                <div className="container">
                    <Label text="Seat Type"/>
                    <Select name="seat"
                            options={[
                                { text: "Choose", value: "" },
                                { text: "Aisle", value: "aisle" },
                                { text: "Middle", value: "middle" },
                                { text: "Window", value: "window" }
                            ]} />
                    <br />
                    <Label text="Aircraft Side"/>
                    <Select name="aircraftSide"
                            options={[
                                { text: "Choose", value: "" },
                                { text: "Left", value: "left" },
                                { text: "Right", value: "right" },
                                { text: "Center", value: "center" }
                            ]} />
                    <br />
                    <Label text="Class"/>
                    <Select name="ticketClass"
                            options={[
                                { text: "Choose", value: "" },
                                { text: "Private", value: "private" },
                                { text: "First", value: "first" },
                                { text: "Business", value: "business" },
                                { text: "Economy+", value: "economy+" },
                                { text: "Economy", value: "economy" }
                            ]} />
                    <br />
                    <Label text="Airplane"/>
                    <Input type="text"
                           name="airplane"
                           placeholder="B738"
                           maxLength={16} />
                    <br />
                    <Label text="Flight Number"/>
                    <Input type="text"
                           name="flightNumber"
                           placeholder="FR2460"
                           maxLength={7} />
                    <br />
                    <Label text="Notes"/>
                    <TextArea name="notes"
                              maxLength={150} />
                </div>

            </div>

            <Button text="Done"
                    level="success"
                    submit />
        </form>
    </>
    );
}
