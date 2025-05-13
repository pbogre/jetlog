import React from 'react';
import { useState } from 'react';
import { Button } from '../components/Elements'
import API from '../api';
import { Flight } from '../models';

interface FetchConnectionProps {
    name: string;
    date: string;
    destination: string|undefined;
    onFetched?: (f: Flight) => void;
    placeholder?: Flight;
}

export default function FetchConnection({ name, date, destination, onFetched, placeholder }: FetchConnectionProps) {
    const [connection, setConnection] = useState<Flight>();
    const [noneFound, setNoneFound] = useState<boolean>(false);
    
    // this method returns an actual instance of 
    // Flight so that its class methods can be used
    const createInstance = (obj) => {
        let correct: Flight = new Flight();
        Object.assign(correct, obj);

        return correct;
    }

    const searchConnection = () => {
        // connection flight must be within 2 days after
        // and 1 day before the actual flight, and should
        // have origin where actual flight has destination
        const start = new Date(date);
        start.setDate(start.getDate() - 1);

        const end = new Date(date);
        end.setDate(end.getDate() + 2);

        const fmt = d => d.toISOString().substring(0, 10);

        API.get(`/flights?start=${fmt(start)}&end=${fmt(end)}&origin=${destination}`)
        .then((data: Flight|Flight[]) => {
            if (Array.isArray(data)) {
                if (data.length === 0) setNoneFound(true);
                else alert("multiple found...")
            } else {
                setConnection(data);
                if (onFetched) onFetched(data);
            }
        });
    }

    return (
    <>
        <Button
            text="Fetch"
            disabled={destination === undefined || noneFound}
            onClick={searchConnection}
        />

        <input type="hidden" name={name} value={connection?.id}/>

        { (placeholder && !connection) ?
            <p>{createInstance(placeholder).toString()}</p>
            :
            connection ?
            <p>{createInstance(connection).toString()}</p>
            :
            noneFound &&
            <p>No results!</p>
        }
    </>
    );
}
