import React from 'react';
import { useState } from 'react';

import { airportsAPI } from '../api';
import { Airport } from '../models';

export default function AirportInput({ type, callback }) {
    const [airportsData, setAirportsData] = useState<Airport[]>([]);

    const randomPlaceholder = () => {
        const array = [ "BGY", "EIN", "FNC", "DEN", "ORD", "HKG", "MAD", "MIA", "MUC" ];
        const random = array[Math.floor(Math.random() * array.length)];

        return random;
    }

    const handleChange = (event) => {
        const value = event.target.value;

        if (value.length > 1) {
            airportsAPI.get(setAirportsData, value)
            .catch((err) => {
                //TODO error popup
                console.log(err);
            });
        }
    }

    const handleClick = (event) => {
        const value = event.target.value;

        // find chosen airport based on icao
        for(const airport of airportsData) {
            if(airport.icao === value) {
                var inputElement = document.getElementById(type + "-airport") as HTMLInputElement;
                inputElement.value = airport.name;
                inputElement.setAttribute("size", inputElement.value.length.toString());
            }
        }

        callback(type, value);

        setAirportsData([]);
    }

    return (
    <>
        <label className="required">{type.charAt(0).toUpperCase() + type.slice(1)} Airport</label>
        <input id={type + "-airport"}
               type="text"
               maxLength={10}
               name={type}
               onChange={handleChange}
               placeholder={randomPlaceholder()}
               required />
        { airportsData.length > 0 && 
        <select className="autocomplete">
            { airportsData.map((airport: Airport) => (
            <option value={airport.icao} onClick={handleClick}>
                {airport.iata || airport.icao} - {airport.name}
            </option>
            ))}
        </select>
        }
    </>
    );
}

