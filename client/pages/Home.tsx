import React from 'react';

import {ShortStats} from '../components/Stats';
import WorldMap from '../components/WorldMap';

export default function Home() {
    return (
        <>
            <ShortStats />

            <div className="md:w-4/5 md:m-auto">
                <WorldMap />
                <p className="text-sm font-mono text-gray-700/60">
                    Tip: You can zoom and pan the map!
                </p>
            </div>
        </>
    );
}
