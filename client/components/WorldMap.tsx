import React, {useState, useEffect} from 'react';
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from "react-simple-maps";

import API from '../api';
import ConfigStorage from '../storage/configStorage';
import { Trajectory } from '../models';

function CustomMarker({ longitude, latitude, frequency }) {
    return (<Marker coordinates={[longitude, latitude]}>
            <circle r={
                        ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                        Math.min(3 + Math.floor(frequency / 3), 6)
                        : 3
                        } 
                    fill={
                        ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                        "#FFA50080"
                        : "#FFA500"
                        }
                    stroke="#FFA500"
                    strokeWidth={0.5}/>
            </Marker>);
}

interface WorldMapProps {
    flightID?: number;
    distance?: number;
}
export default function WorldMap({ flightID, distance }: WorldMapProps) {
    const [world, setWorld] = useState<object>()
    const [lines, setLines] = useState<Trajectory[]>([])

    useEffect(() => {
        API.get("/geography/world")
        .then((data) => setWorld(data));

        const query = flightID ? `?flight_id=${flightID}` : ""

        API.get(`/geography/lines${query}`)
        .then((data: Trajectory[]) => setLines(data));
    }, []);

    if (world === undefined) {
        return;
    }

    // check if it will 'clip' through the edges of the map using coords
    const longitudeDelta = lines[0].second.longitude - lines[0].first.longitude;
    const clipsMap = Math.abs(longitudeDelta) > 180;

    // compute center
    let center: [number, number] = [0, 0];
    if (flightID && !clipsMap){
        const middleLongitude = (lines[0].first.longitude + lines[0].second.longitude) / 2;
        const middleLatitude = (lines[0].first.latitude + lines[0].second.latitude) / 2;

        center = [middleLongitude, middleLatitude];
    }

    // compute zoom factor
    let zoom = 1;
    if (flightID && distance && !clipsMap) {
        zoom = Math.min(20000/distance, 10);
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
                                fill="#333"
                                />
                          ))
                        }
                    </Geographies>

                    { lines.map((line) => (
                        <>
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

                        <CustomMarker longitude={line.first.longitude} 
                                      latitude={line.first.latitude} 
                                      frequency={line.first.frequency} />

                        <CustomMarker longitude={line.second.longitude} 
                                      latitude={line.second.latitude} 
                                      frequency={line.second.frequency} />
                        </>
                    ))} 

                </ZoomableGroup>
            </ComposableMap>
        </>
    );
}
