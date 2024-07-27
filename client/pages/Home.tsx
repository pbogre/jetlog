import React from 'react';

import { Whisper } from '../components/Elements';
import { ShortStats } from '../components/Stats';
import WorldMap from '../components/WorldMap';

export default function Home() {
    return (
        <>
            <ShortStats />

            <div className="md:w-4/5 md:m-auto">
                <WorldMap />
                <Whisper text="Tip: You can zoom and pan the map!" />
            </div>
        </>
    );
}
