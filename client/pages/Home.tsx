import React, {useState, useEffect} from 'react';

import Stats from '../components/Stats';
import WorldMap from '../components/WorldMap';

import { Coord, Trajectory } from '../models';
import API from '../api';

export default function Home() {
    const [markers, setMarkers] = useState<Coord[]>([])
    const [lines, setLines] = useState<Trajectory[]>([])

    useEffect(() => {
        API.get("/geography/markers")
        .then((data) => setMarkers(data));

        API.get("/geography/lines")
        .then((data) => setLines(data));
    }, []);

    return (
        <>
            <div>
                <h1>Home</h1>
                <Stats />
            </div>

            <div>
                <WorldMap markers={markers} lines={lines} />
            </div>
        </>
    );
}
