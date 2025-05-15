import React from 'react';

import { ShortStats } from '../components/Stats';
import WorldMap from '../components/WorldMap';

export default function Home() {
    return (
        <>
            <ShortStats />

            <div className="md:w-4/5 md:m-auto">
                <WorldMap showVisitedCountries/>
            </div>
        </>
    );
}
