import React, {useState, useEffect} from 'react';
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from "react-simple-maps";

import API from '../api';
import { SettingsManager } from '../settingsManager';
import { Coord, Trajectory } from '../models';

export default function WorldMap() {
    const geoUrl = "/api/geography/world";
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
            <ComposableMap width={1000} height={470}>
                <ZoomableGroup center={[0, 0]} translateExtent={[[0, 0], [1000, 470]]}>
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

                    { lines.map((line) => (
                        <Line 
                            from={[line.first.longitude, line.first.latitude]}
                            to={[line.second.longitude, line.second.latitude]}
                            stroke="#FF5533"
                            strokeWidth={
                                        SettingsManager.getSetting("frequencyBasedMarker") === "true" ?
                                        Math.min(1 + Math.floor(line.frequency / 3), 6)
                                        : 1
                                    } 
                            strokeLinecap="round"/>
                    ))} 

                    { markers.map((marker) => (
                        <Marker coordinates={[marker.longitude, marker.latitude]}>
                            <circle r={
                                        SettingsManager.getSetting("frequencyBasedLine") === "true" ?
                                        Math.min(2 + Math.floor(marker.frequency / 3), 6)
                                        : 3
                                    } 
                                    fill="#FFA500"/>
                        </Marker>
                    ))} 
                </ZoomableGroup>
            </ComposableMap>
        </>
    );
}
