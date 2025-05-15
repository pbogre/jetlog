import React, { useState, useEffect } from 'react';
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from "react-simple-maps";

import API from '../api';
import ConfigStorage from '../storage/configStorage';
import { Coord, Trajectory } from '../models';

interface WorldMapProps {
    flightData?: [number, number]; // flightID, distance
}
export default function WorldMap({ flightData }: WorldMapProps) {
    const [world, setWorld] = useState<object>();
    const [lines, setLines] = useState<Trajectory[]>([]);
    const [markers, setMarkers] = useState<Coord[]>([]);

    useEffect(() => {
        const showVisitedCountries = ConfigStorage.getSetting("showVisitedCountries");
        API.get(`/geography/world?visited=${showVisitedCountries}`)
        .then((data) => setWorld(data));

        const query = flightData ? `?flight_id=${flightData[0]}` : ""

        API.get(`/geography/decorations${query}`)
        .then((data: [Trajectory[], Coord[]]) => {
            setLines(data[0]);
            setMarkers(data[1]);
        });
    }, []);

    if (world === undefined) {
        return;
    }

    let center: [number, number] = [0, 0];
    let zoom = 1;

    // compute center and zoom factor if flight specified
    if (flightData) {
        const longitudeDelta = Math.abs(lines[0].second.longitude - lines[0].first.longitude);
        const clipsMap = longitudeDelta > 180;

        // proceed if the trajectory does not 'clip' around the map
        if (!clipsMap) {
            const middleLongitude = (lines[0].first.longitude + lines[0].second.longitude) / 2;
            const middleLatitude = (lines[0].first.latitude + lines[0].second.latitude) / 2;

            center = [middleLongitude, middleLatitude];

            zoom = Math.min(20000/flightData[1], 10);
        }

    }

    return (
        <>
            <ComposableMap width={1000} height={470}>
                <ZoomableGroup maxZoom={10}
                               zoom={zoom}
                               center={center}
                               translateExtent={[[0, 0], [1000, 470]]}>

                    <Geographies geography={world}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                stroke="#111"
                                fill={geo.properties.visited ? "#F25000" : "#333"}
                                />
                          ))
                        }
                    </Geographies>

                    { lines.map((line) => (
                        <Line
                            from={[line.first.longitude, line.first.latitude]}
                            to={[line.second.longitude, line.second.latitude]}
                            stroke="#FF5533CC"
                            strokeWidth={
                                        ConfigStorage.getSetting("frequencyBasedLine") === "true" ?
                                        Math.min(1 + Math.floor(line.frequency / 3), 6)
                                        : 1
                                    }
                            strokeLinecap="round" />

                    ))}

                    { markers.map((marker) => (
                        <Marker coordinates={[marker.longitude, marker.latitude]}>
                            <circle r={
                                ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                                Math.min(3 + Math.floor(marker.frequency / 3), 6)
                                : 3
                                }
                                fill={
                                    ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                                    "#FFA50080"
                                    : "#FFA500"
                                }
                                stroke="#FFA500"
                                strokeWidth={0.5}
                            />
                        </Marker>
                    ))}

                </ZoomableGroup>
            </ComposableMap>
        </>
    );
}
