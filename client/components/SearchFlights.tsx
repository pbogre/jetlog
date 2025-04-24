import React, {useEffect} from 'react';
import { useState } from 'react';
import { Button, Whisper } from '../components/Elements'
import API from '../api';
import { Flight } from '../models';

interface SearchFlightsProps {
    name: string;
    filters: string;
}

export default function SearchFlights({ name, filters }: SearchFlightsProps) {
    const [flightsData, setFlightsData] = useState<Flight[]>([]);
    const [selectedFlight, setSelectedFlight ] = useState<Flight>();

    //useEffect(() => {
    //    if (subject) {
    //        setSubjectsData([]);
    //        setSelectedSubject(subject);
    //    }
    //}, [subject])

    // this method returns an actual instance of 
    // Airport/Airline/Flight so that their 
    // class methods can be used
    const createInstance = (obj) => {
        let correct: Flight = new Flight();
        Object.assign(correct, obj);

        return correct;
    }

    const searchFlights = () => {
        API.get(`/flights?${filters}`)
        .then((data: Flight[]) => setFlightsData(data))
    }

    return (
    <>
        <Button
            text="Search"
            onClick={searchFlights}
        />

        <input type="hidden" name={name} value={selectedFlight?.id}/>
        { flightsData.length > 0 ?
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
            { flightsData.map((flight: Flight) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={flight.id} 
                onClick={() => { setSelectedFlight(flight); setFlightsData([]); }}>
                { createInstance(flight).toString() }
            </li>
            ))}
        </ul>
        :
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
           <li className="py-1 px-2">No results!</li> 
        </ul>
        }

        { selectedFlight &&
            <Whisper text={`selected: ${(selectedFlight).toString()}`} negativeTopMargin />
        }
    </>
    );
}

