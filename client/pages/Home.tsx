import React, {useState, useEffect} from 'react';

import Stats from '../components/Stats';
import WorldMap from '../components/WorldMap';

import { Statistics, Coord, Line } from '../models';
import API from '../api';

export default function Home() {
    const [statistics, setStatistics] = useState<Statistics>(new Statistics)
    const [markers, setMarkers] = useState<Coord[]>([])
    const [lines, setLines] = useState<Line[]>([])

    useEffect(() => {
        API.get("/flights/statistics")
        .then((data) => setStatistics(data));

        API.get("/geography/markers")
        .then((data) => setMarkers(data));

        API.get("/geography/lines")
        .then((data) => setLines(data));
    }, []);

    return (
        <>
            <div>
                <h1>Home</h1>
                <Stats statistics={statistics}/>
            </div>

            <div>
                <WorldMap markers={markers} lines={lines} />
            </div>
        </>
    );
}
