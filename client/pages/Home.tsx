import React from 'react';

import { ShortStats } from '../components/Stats';
import WorldMap from '../components/WorldMap';

export default function Home() {
    return (
        <div className="relative -m-4">
            {/* Map takes full viewport behind other elements */}
            <div className="fixed inset-0 top-[56px] z-0">
                <WorldMap />
            </div>

            {/* Stats overlay on top of map */}
            <div className="relative z-10 p-4">
                <ShortStats />
            </div>
        </div>
    );
}
