import React, { useState, useEffect } from 'react';
import { Input, Whisper } from '../components/Elements';
import API from '../api';
import { Airline } from '../models';
import { stringifyAirline } from '../utils';

interface AirlineInputProps {
    name: string;
    placeholder?: Airline;
    airline?: Airline;
}

export default function AirlineInput({ name, placeholder, airline }: AirlineInputProps) {
    const [airlinesData, setAirlinesData] = useState<Airline[]>([]);
    const [selectedAirline, setSelectedAirline] = useState<Airline>();

    useEffect(() => {
        if (airline) {
            setAirlinesData([]);
            setSelectedAirline(airline);
        }
    }, [airline])
    
    const searchAirline = (event) => {
        const value = event.target.value;

        if (value.length > 2) {
            API.get(`/airlines?q=${value}`)
            .then((data: Airline[]) => setAirlinesData(data))
        }
        else setAirlinesData([]);
    }

    return  (
      <>
        <Input
               type="text"
               maxLength={16}
               onChange={searchAirline}
               placeholder="Search"
        />
        
               
        <input type="hidden" name={name} value={selectedAirline?.icao}/>
        {  airlinesData.length > 0 &&
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
            { airlinesData.map((airline: Airline) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={airline.icao} 
                onClick={() => {setSelectedAirline(airline); setAirlinesData([]); }}>
                {stringifyAirline(airline)}
            </li>
            ))}

        </ul>
        }

        { placeholder && !selectedAirline ? 
            <Whisper text={`selected: ${stringifyAirline(placeholder)}`} negativeTopMargin />
            :
            selectedAirline &&
        <Whisper text={`selected: ${stringifyAirline(selectedAirline)}`} negativeTopMargin />
        }
        </>
    );
}

