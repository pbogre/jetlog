import React from 'react';
import { useState } from 'react';
import { Button, Whisper } from '../components/Elements'
import API from '../api';
import { Flight } from '../models';

interface SearchFlightsProps {
    name: string;
    filters: string;
    flight?: Flight;
    setFlight: Function;
}

export default function SearchFlights({ name, filters, flight, setFlight }: SearchFlightsProps) {
    const [hasSearched, setHasSearched] = useState<Boolean>(false);
    const [flightsData, setFlightsData] = useState<Flight[]>([]);

    // this method returns an actual instance of 
    // Flight so that its class methods can be used
    const createInstance = (obj) => {
        let correct: Flight = new Flight();
        Object.assign(correct, obj);

        return correct;
    }

    const searchFlights = () => {
        API.get(`/flights?${filters}`)
        .then((data: Flight[]) => setFlightsData(data));

        setHasSearched(true);
    }

    return (
    <>
        <Button
            text="Search"
            onClick={searchFlights}
        />

        <input type="hidden" name={name} value={flight?.id}/>
        { (flightsData.length == 0 && hasSearched) ?
        <ul className="mb-4 border-2 border-gray-200">
           <li className="py-1 px-2">No results!</li> 
        </ul>
        :
        flightsData.length > 0 &&
        <ul className="mb-4 border-2 border-gray-200">
            { flightsData.map((foundFlight: Flight) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={foundFlight.id} 
                onClick={() => { setFlight(foundFlight); setFlightsData([]); setHasSearched(false); }}>
                { createInstance(foundFlight).toString() }
            </li>
            ))}
        </ul>
        }

        { flight &&
            <Whisper text={`selected: ${createInstance(flight).toString()}`} />
        }
    </>
    );
}

