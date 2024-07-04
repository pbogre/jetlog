import React, {useEffect} from 'react';
import { useState } from 'react';

import { airportsAPI } from '../api';
import { Airport } from '../models';

import '../css/airport-input.css'

interface AirportInputProps {
    type: "origin"|"destination";
    callback: (airport: Airport, type: "origin"|"destination") => any;
}

export default function AirportInput({ type, callback }: AirportInputProps) {
    const [airportsData, setAirportsData] = useState<Airport[]>([]);
    const [selectedAirport, setSelectedAirport] = useState<Airport|null>(null);


    const randomPlaceholder = () => {
        const array = [ "BGY", "EIN", "FNC", "DEN", "ORD", "HKG", "MAD", "MIA", "MUC",
                        "Bergamo", "Eindhoven", "Funchal", "Denver", "Chicago", "Hong Kong",
                        "Miami", "Munich" ];
        const random = array[Math.floor(Math.random() * array.length)];

        return random;
    }

    // Change placeholder every second
    useEffect(() => {
        setInterval(() => {
            const inputElement = document.getElementById(type + "-airport");
            inputElement?.setAttribute("placeholder", randomPlaceholder());
        }, 1000);
    }, []);

    const getDescriptor = (airport: Airport) => {
        return (airport.iata || airport.icao) + " - " + airport.city + "/" + airport.country
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
        const value = event.target.getAttribute("value");

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
        <ul className="airport-select">

            { airportsData.map((airport: Airport) => (
            <li className="airport-option"
                value={airport.icao} 
                onClick={handleOptionClick}>
                {getDescriptor(airport)}
            </li>
            ))}

        </ul>
        }

        { selectedAirport &&
        <span className="input-whisper">selected: {getDescriptor(selectedAirport)}</span>
        }
        </>
    );
}
