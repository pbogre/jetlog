import React from 'react';
import { useState } from 'react';

import { airportsAPI } from '../api';
import { Airport } from '../models';

interface AirportInputProps {
    type: "origin"|"destination";
    callback: (airport: Airport, type: "origin"|"destination") => any;
}

export default function AirportInput({ type, callback }: AirportInputProps) {
    const [airportsData, setAirportsData] = useState<Airport[]>([]);
    const [selectedAirport, setSelectedAirport] = useState<Airport|null>(null);

    const getDescriptor = (airport: Airport) => {
        return (airport.iata || airport.icao) + " - " + airport.city + "/" + airport.country
    }

    const randomPlaceholder = () => {
        const array = [ "BGY", "EIN", "FNC", "DEN", "ORD", "HKG", "MAD", "MIA", "MUC",
                        "Bergamo", "Eindhoven", "Funchal", "Denver", "Chicago", "Hong Kong",
                        "Miami", "Munich" ];
        const random = array[Math.floor(Math.random() * array.length)];

        return random;
    }

    const handleInputChange = (event) => {
        const value = event.target.value;

        if (value.length > 1) {
            airportsAPI.get(value)
            .then((data) => setAirportsData(data))
            .catch((err) => {
                //TODO handle this...?
            })
        }
        else setAirportsData([]);
    }

    const handleOptionClick = (event) => {
        const value = event.target.value;

        // find chosen airport based on icao
        for(const airport of airportsData) {
            if(airport.icao === value) {
                setSelectedAirport(airport);
                callback(airport, type);

                const inputElement = document.getElementById(type + "-airport") as HTMLInputElement;
                inputElement.value = "";

                break;
            }
        }

        setAirportsData([]);
    }

    return (
    <>
        <label className="required">
            {type ? type.charAt(0).toUpperCase() + type.slice(1) + " " : "" }Airport
        </label>

        <input id={type + "-airport"}
               type="text"
               maxLength={10}
               onChange={handleInputChange}
               placeholder={randomPlaceholder()}/>
        
        {  airportsData.length > 0 &&
        <select>

            { airportsData.map((airport: Airport) => (
            <option value={airport.icao} onClick={handleOptionClick}>
                {getDescriptor(airport)}
            </option>
            ))}

        </select>
        }

        { selectedAirport &&
        <span className="input-whisper">selected: {getDescriptor(selectedAirport)}</span>
        }
        </>
    );
}
