import React, {useState} from 'react';
import { useEffect } from 'react';

import { Statistics } from '../models';
import { flightsAPI } from '../api'

import '../css/statistics.css'

export default function Stats() {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics())
    
    useEffect(() => {
        flightsAPI.get("statistics")
        .then((data) => setStatistics(data));
    }, []);

    return (
        <>
            <p>You flew <span className="stat">{statistics.amount || "loading..."}</span> times!</p>
            <p>You spent <span className="stat">{statistics.time || "loading..."}</span> minutes in the air!</p>
            <p>You travelled <span className="stat">{statistics.distance || "loading..."}</span> kilometers!</p>
            <p>On average, you boarded a plane every <span className="stat">{statistics.dpf || "loading..."}</span> days!</p>
        </>
    );
}
