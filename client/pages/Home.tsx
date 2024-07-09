import React, {useState, useEffect} from 'react';

import { Heading } from '../components/Elements'
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
                <Heading text="Home" />
                <Stats />
            </div>

            <div>
                <WorldMap markers={markers} lines={lines} />
            </div>
        </>
    );
}
