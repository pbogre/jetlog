import React from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";

import { Coord, Trajectory } from '../models'

import '../css/world.css'

interface WorldMapProps {
    markers: Coord[];
    lines: Trajectory[];
}

export default function WorldMap({ markers, lines }: WorldMapProps) {
    const geoUrl = "/api/geography/world";

    return (
        <>
            <ComposableMap width={1000} height={470}>

                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography 
                            key={geo.rsmKey} 
                            geography={geo} 
                            stroke="#111"
                            style={{
                                default: {
                                    fill: "#333"
                                },
                                hover: {
                                    fill: "#262626"
                                }
                            }}
                            />
                      ))
                    }
                </Geographies>

                { markers.map((marker) => (
                    <Marker coordinates={[marker.longitude, marker.latitude]}>
                        <circle r={3} fill="#FFA500"/>
                    </Marker>
                ))} 

                { lines.map((line) => (
                    <Line 
                        from={[line.first.longitude, line.first.latitude]}
                        to={[line.second.longitude, line.second.latitude]}
                        stroke="#FF5533"
                        strokeWidth={1}/>
                ))} 

            </ComposableMap>
        </>
    );
}
