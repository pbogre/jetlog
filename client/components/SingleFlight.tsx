import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import { Button, Heading, Input, Select, Subheading } from '../components/Elements'
import { Airport, Flight } from '../models';
import API from '../api';
import AirportInput from './AirportInput';

interface FlightPatchOptions {
    date?: string;
    origin?: Airport;
    destination?: Airport;
    departureTime?: string;
    arrivalTime?: string;
    seat?: string;
    duration?: number;
    distance?: number;
    airplane?: string;
}
export default function SingleFlight({ flightID }) {
    const [flight, setFlight] = useState<Flight|null>(null);
    const [flightPatch, setFlightPatch] = useState<FlightPatchOptions>({});
    const [editMode, setEditMode] = useState<Boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        API.get(`/flights?id=${flightID}`)
        .then((data) => {
            setFlight(data);
        });
    }, []);

    if(!flight) {
        return (
            <p className="m-4">Loading...</p>
        );
    }

    const updateFlightPatch = (key, value) => {
        if(!value) {
            setFlightPatch(current => {
                const copy = {...current};
                delete copy[key];
                return copy;
            })
            return;
        }

        setFlightPatch({...flightPatch, [key]: value});
    }

    const toggleEditMode = () => {
        setEditMode(!editMode);
    }

    const handleSaveClick = () => {
        if(!flightPatch) {
            this.toggleEditMode();
            return;
        }

        API.patch(`flights?id=${flight.id}`, flightPatch, () => window.location.reload());
    }

    const handleDeleteClick = () => {
        if(confirm("Are you sure?")) {
            API.delete(`/flights?id=${flight.id}`, () => navigate("/flights"));
        }
    }

    return (
        <>
            <Heading text={`${flight.origin.iata || flight.origin.city } to ${flight.destination.iata || flight.destination.city}`} />
            <h2 className="-mt-4 mb-4 text-xl">{flight.date}</h2>
           
            <div>
            <div className="flex flex-wrap">
                <div className="container">
                    <Subheading text="Timings" />
                    { editMode ? 
                    <>
                        <p>Date: <Input type="date" onChange={(e) => updateFlightPatch("date", e.target.value)} /></p>
                        <p>Departure Time: <Input type="time" onChange={(e) => updateFlightPatch("departureTime", e.target.value)} /></p>
                        <p>Arrival Time: <Input type="time" onChange={(e) => updateFlightPatch("arrivalTime", e.target.value)} /></p>
                        <p>Duration: <Input type="number" onChange={(e) => updateFlightPatch("duration", e.target.value)} /></p>
                    </>
                    :
                    <>
                        <p>Date: <span>{flight.date}</span></p>
                        <p>Departure Time: <span>{flight.departureTime || "N/A"}</span></p>
                        <p>Arrival Time: <span>{flight.arrivalTime || "N/A"}</span></p>
                        <p>Duration: <span>{flight.duration ? flight.duration + " min" : "N/A"}</span></p>
                    </>
                    }
                </div>

                <div className="container">
                    <Subheading text="Airports" />
                    { editMode ?
                    <>
                        <p>Origin: <AirportInput onSelected={(airport: Airport) => updateFlightPatch("origin", airport)} /></p>
                        <p>Destination: <AirportInput onSelected={(airport: Airport) => updateFlightPatch("destination", airport)} /></p>
                        <p>Distance: <Input type="number" onChange={(e) => updateFlightPatch("distance", e.target.value)} /></p>
                    </>
                    :
                    <>
                        <p>Origin: <span>{flight.origin.iata || flight.origin.icao} ({flight.origin.city}/{flight.origin.country})</span></p>
                        <p>Destination: <span>{flight.destination.iata || flight.destination.icao} ({flight.destination.city}/{flight.destination.country})</span></p>
                        <p>Distance: <span>{flight.distance ? flight.distance + " km" : "N/A"}</span></p>
                    </>
                    }
                </div>

                <div className="container">
                    <Subheading text="Other" />
                    { editMode ?
                    <>
                        <p>Seat: <Select onChange={(e) =>  updateFlightPatch("seat", e.target.value)} options={[
                            { text: "Choose", value: "" },
                            { text: "Aisle", value: "aisle" },
                            { text: "Middle", value: "middle" },
                            { text: "Window", value: "window" }
                        ]} /></p>
                        <p>Airplane: <Input type="text" onChange={(e) => updateFlightPatch("airplane", e.target.value)} /></p>
                    </>
                    :
                    <>
                        <p>Seat: <span>{flight.seat || "N/A"}</span></p>
                        <p>Airplane: <span>{flight.airplane || "N/A"}</span></p>
                    </>}
                </div>
            </div>

            { editMode &&
                <Button text="Save" 
                        level="success" 
                        disabled={!flightPatch || Object.keys(flightPatch).length === 0} 
                        onClick={handleSaveClick} />
            }
            <Button text={editMode ? "Cancel" : "Edit" } level="default" onClick={toggleEditMode}/>
            <Button text="Delete" level="danger" onClick={handleDeleteClick}/>
            </div>
        </>
    );
}
