import React from 'react';
import { useState } from 'react';

import { Input, Whisper } from '../components/Elements'
import API from '../api';
import { Airport } from '../models';
import { stringifyAirport } from '../utils';

interface AirportInputProps {
    type?: "origin"|"destination";
    onSelected: (airport: Airport) => any;
}

export default function AirportInput({ onSelected }: AirportInputProps) {
    const [airportsData, setAirportsData] = useState<Airport[]>([]);
    const [selectedAirport, setSelectedAirport] = useState<Airport|null>(null);

    const handleInputChange = (event) => {
        const value = event.target.value;

        if (value.length > 1) {
            API.get(`/airports?q=${value}`)
            .then((data) => setAirportsData(data))
        }
        else setAirportsData([]);
    }

    const handleOptionClick = (event) => {
        const value = event.target.getAttribute("value");

        // find chosen airport based on icao
        for(const airport of airportsData) {
            if(airport.icao === value) {
                setSelectedAirport(airport);
                onSelected(airport);

                break;
            }
        }

        setAirportsData([]);
    }

    return (
    <>
        <Input type="text"
               maxLength={16}
               onChange={handleInputChange}
               placeholder="Search"/>

        {  airportsData.length > 0 &&
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">

            { airportsData.map((airport: Airport) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={airport.icao} 
                onClick={handleOptionClick}>
                {stringifyAirport(airport)}
            </li>
            ))}

        </ul>
        }

        { selectedAirport &&
        <Whisper text={`selected: ${stringifyAirport(selectedAirport)}`} negativeTopMargin />
        }
        </>
    );
}
