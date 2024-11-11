import React, {useState, useEffect} from 'react';
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from "react-simple-maps";

import API from '../api';
import ConfigStorage from '../storage/configStorage';
import { Coord, Trajectory } from '../models';

export default function WorldMap() {
    const [world, setWorld] = useState<object>()
    const [markers, setMarkers] = useState<Coord[]>([])
    const [lines, setLines] = useState<Trajectory[]>([])

    useEffect(() => {
        API.get("/geography/world")
        .then((data) => setWorld(data));

        API.get("/geography/markers")
        .then((data: Coord[]) => setMarkers(data));

        API.get("/geography/lines")
        .then((data: Trajectory[]) => setLines(data));
    }, []);

    if (world === undefined) {
        return;
    }

    return (
        <>
            <ComposableMap width={1000} height={470}>
                <ZoomableGroup maxZoom={10} center={[0, 0]} translateExtent={[[0, 0], [1000, 470]]}>
                    <Geographies geography={world}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography 
                                key={geo.rsmKey} 
                                geography={geo} 
                                stroke="#111"
                                fill="#333"
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
                            strokeLinecap="round"/>
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
                                    strokeWidth={0.5}/>
                        </Marker>
                    ))} 
                </ZoomableGroup>
            </ComposableMap>
        </>
    );
}
