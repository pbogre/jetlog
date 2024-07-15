import React from 'react';

import {ShortStats} from '../components/Stats';
import WorldMap from '../components/WorldMap';

export default function Home() {
    return (
        <>
            <ShortStats />

            <div>
                <WorldMap />
            </div>
        </>
    );
}
