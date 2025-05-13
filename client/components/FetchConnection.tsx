import React, { useEffect } from 'react';
import { useState } from 'react';
import { Button } from '../components/Elements'
import API from '../api';
import { Flight } from '../models';

interface FetchConnectionProps {
    name: string;
    date: string;
    destination: string|undefined;
    value?: number;
    onFetched?: (c: number) => void;
}

export default function FetchConnection({ name, date, destination, value, onFetched }: FetchConnectionProps) {
    const [searched, setSearched] = useState<boolean>(false);
    const [connectionFlight, setConnectionFlight] = useState<Flight>(); // only needed for printing flight info

    // if value is initially set, we must
    // find matching flight (only first render)
    useEffect(() => {
        if (value) {
            API.get(`flights?id=${value}`)
            .then((data: Flight) => { setConnectionFlight(data) });
        }
    }, [])

    // whenever destination or date is changed,
    // we can search again
    useEffect(() => {
        setSearched(false);
    }, [date, destination]);

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
            if (!onFetched) return; // only keep going if we have to do something

            if (Array.isArray(data)) {
                if (data.length > 0) {
                    // this should be very rare, for now we handle it
                    // with a crude alert input
                    const choice = prompt(`Multiple possible connections found, select one by entering its number:
                                          ${ data.map((f: Flight, i) => `\n[${i}] ${createInstance(f).toString()}`) }`);

                    if (!choice) {
                        alert("Your input must be a valid index!");
                        return;
                    }

                    const parsed = Number.parseInt(choice);

                    if (!Number.isInteger(parsed) || parsed < 0 || parsed > data.length - 1) {
                        alert("Your input must be a valid index!");
                        return;
                    }

                    const connection: Flight = data[choice];
                    setConnectionFlight(connection);
                    onFetched(connection.id);
                }
            } else {
                setConnectionFlight(data);
                onFetched(data.id);
            }
        });

        setSearched(true);
    }

    return (
    <>
        { !searched &&
            <Button
                text="Fetch"
                disabled={destination === undefined}
                onClick={searchConnection}
            />
        }

        <input type="hidden" name={name} value={value}/>

        { connectionFlight ?
            <p>{createInstance(connectionFlight).toString()}</p>
            :
            searched &&
            <p>No results!</p>
        }
    </>
    );
}
