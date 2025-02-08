import React, {useEffect} from 'react';
import { useState } from 'react';
import { Input, Whisper } from '../components/Elements'
import API from '../api';
import { Airport } from '../models';
import { stringifyAirport } from '../utils';

interface AirportInputProps {
    name: string;
    placeholder?: Airport;
    airport?: Airport;
}

export default function AirportInput({ name, placeholder, airport }: AirportInputProps) {
    const [airportsData, setAirportsData] = useState<Airport[]>([]);
    const [selectedAirport, setSelectedAirport] = useState<Airport>();

    useEffect(() => {
        if (airport) {
            setAirportsData([]);
            setSelectedAirport(airport);
        }
    }, [airport])

    const searchAirport = (event) => {
        const value = event.target.value;

        if (value.length > 1) {
            API.get(`/airports?q=${value}`)
            .then((data: Airport[]) => setAirportsData(data))
        }
        else setAirportsData([]);
    }

    return (
    <>
        <Input 
            type="text"
            maxLength={16}
            onChange={searchAirport}
            placeholder="Search"
        />

        <input type="hidden" name={name} value={selectedAirport?.icao}/>
        { airportsData.length > 0 &&
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
            { airportsData.map((airport: Airport) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={airport.icao} 
                onClick={() => setSelectedAirport(airport)}>
                {stringifyAirport(airport)}
            </li>
            ))}
        </ul>
        }

        { (placeholder && !selectedAirport) ?
            <Whisper text={`selected: ${stringifyAirport(placeholder)}`} negativeTopMargin />
            :
            selectedAirport &&
            <Whisper text={`selected: ${stringifyAirport(selectedAirport)}`} negativeTopMargin />
        }
    </>
    );
}
