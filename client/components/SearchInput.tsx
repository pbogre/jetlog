import React, {useEffect} from 'react';
import { useState } from 'react';
import { Input, Whisper } from '../components/Elements'
import API from '../api';
import { Airline, Airport } from '../models';

interface SearchInputProps {
    name: string;
    type: "airports"|"airlines";
    value?: Airport|Airline;
    onSelect?: (s) => void; // type any for implementation, but really is Airport|Airline
}

export default function SearchInput({ name, type, value, onSelect }: SearchInputProps) {
    const [subjectsData, setSubjectsData] = useState<Airport[]|Airline[]>([]);

    // this allows the parent to override
    // the selected subject, e.g. when fetching with
    // flight number
    useEffect(() => {
        if (value) {
            setSubjectsData([]);
        }
    }, [value]);

    // this method returns an actual instance of 
    // Airport/Airline so that their 
    // class methods can be used
    const createInstance = (obj) => {
        const correct = type == "airports" ? new Airport() : new Airline();
        Object.assign(correct, obj);

        return correct;
    }

    const searchSubject = (event) => {
        const query = event.target.value;

        if (query.length > 1) {
            API.get(`/${type}?q=${query}`)
            .then((data: Airport[]|Airline[]) => setSubjectsData(data))
        }
        else setSubjectsData([]);
    }

    return (
    <>
        <Input 
            type="text"
            maxLength={16}
            onChange={searchSubject}
            placeholder="Search"
        />

        <input type="hidden" name={name} value={value?.icao}/>
        { subjectsData.length > 0 &&
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
            { subjectsData.map((s: Airport|Airline) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={s.icao} 
                onClick={() => {
                    setSubjectsData([]); 
                    if (onSelect) onSelect(s);
                }} >
                { createInstance(s).toString() }
            </li>
            ))}
        </ul>
        }

        { value &&
            <Whisper text={`selected: ${createInstance(value).toString()}`} negativeTopMargin />
        }
    </>
    );
}

