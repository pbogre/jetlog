import React, {useEffect} from 'react';
import { useState } from 'react';
import { Input, Whisper } from '../components/Elements'
import API from '../api';
import { Airline, Airport } from '../models';

interface SearchInputProps {
    name: string;
    type: "airports"|"airlines";
    placeholder?: Airport|Airline;
    subject?: Airport|Airline;
}

export default function SearchInput({ name, type, placeholder, subject }: SearchInputProps) {
    const [subjectsData, setSubjectsData] = useState<Airport[]|Airline[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Airport|Airline>();

    useEffect(() => {
        if (subject) {
            setSubjectsData([]);
            setSelectedSubject(subject);
        }
    }, [subject])

    // this method returns an actual instance of 
    // Airport/Airline so that their 
    // class methods can be used
    const createInstance = (obj) => {
        const correct = type == "airports" ? new Airport() : new Airline();
        Object.assign(correct, obj);

        return correct;
    }

    const searchSubject = (event) => {
        const value = event.target.value;

        if (value.length > 1) {
            API.get(`/${type}?q=${value}`)
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

        <input type="hidden" name={name} value={selectedSubject?.icao}/>
        { subjectsData.length > 0 &&
        <ul className="-mt-4 mb-4 border-x-2 border-b-2 border-gray-200">
            { subjectsData.map((subject: Airport|Airline) => (
            <li className="py-1 px-2 even:bg-gray-100 cursor-pointer hover:bg-gray-200"
                value={subject.icao} 
                onClick={() => { setSelectedSubject(subject); setSubjectsData([]); }}>
                { createInstance(subject).toString() }
            </li>
            ))}
        </ul>
        }

        { (placeholder && !selectedSubject) ?
            <Whisper text={`selected: ${createInstance(placeholder).toString()}`} negativeTopMargin />
            :
            selectedSubject &&
            <Whisper text={`selected: ${createInstance(selectedSubject).toString()}`} negativeTopMargin />
        }
    </>
    );
}

