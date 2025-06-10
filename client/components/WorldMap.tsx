import React, { useState, useEffect } from 'react';
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from "react-simple-maps";

import API from '../api';
import ConfigStorage from '../storage/configStorage';
import { Coord, Trajectory } from '../models';

interface MapGeographiesProps {
    lines: Trajectory[];
    markers: Coord[];
    zoom: number;
}
function MapFeatures({ lines, markers, zoom }: MapGeographiesProps) {
    const [world, setWorld] = useState<object>();

    useEffect(() => {
        const showVisitedCountries = ConfigStorage.getSetting("showVisitedCountries");
        API.get(`/geography/world?visited=${showVisitedCountries}`)
        .then((data) => setWorld(data));
    }, []);

    if (world === undefined) {
        return;
    }

    const scaleFactor = 1 / Math.sqrt(zoom);

    return (
        <>
        <Geographies geography={world}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    stroke="#111"
                    strokeWidth={0.7 * scaleFactor}
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
                        (
                            ConfigStorage.getSetting("frequencyBasedLine") === "true" ?
                            Math.min(1 + Math.floor(line.frequency / 3), 6)
                            : 1
                        ) * scaleFactor
                    }
                strokeLinecap="round" />

        ))}

        { markers.map((marker) => (
            <Marker coordinates={[marker.longitude, marker.latitude]}>
                <circle r={
                        (
                            ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                            Math.min(3 + Math.floor(marker.frequency / 3), 6)
                            : 3
                        ) * scaleFactor
                    }
                    fill={
                        ConfigStorage.getSetting("frequencyBasedMarker") === "true" ?
                        "#FFA50080"
                        : "#FFA500"
                    }
                    stroke="#FFA500"
                    strokeWidth={0.5 * scaleFactor}
                />
            </Marker>
        ))}
        </>
    );
}

export default function WorldMap() {
    const [lines, setLines] = useState<Trajectory[]>([]);
    const [markers, setMarkers] = useState<Coord[]>([]);
    const [zoom, setZoom] = useState<number>(1);

    useEffect(() => {
        API.get("/geography/decorations")
        .then((data: [Trajectory[], Coord[]]) => {
            setLines(data[0]);
            setMarkers(data[1]);
        });
    }, []);

    return (
        <>
            <ComposableMap width={1000} height={470}>
                <ZoomableGroup maxZoom={10}
                               translateExtent={[[0, 0], [1000, 470]]}
                               onMove={({zoom: newZoom}) => {
                                   if (newZoom != zoom) setZoom(newZoom)
                               }}>

                    <MapFeatures lines={lines} markers={markers} zoom={zoom}/>

                </ZoomableGroup>
            </ComposableMap>
        </>
    );
}

interface SingleFlightMapProps {
    flightID: number;
    distance: number;
}
export function SingleFlightMap({ flightID, distance }: SingleFlightMapProps) {
    const [lines, setLines] = useState<Trajectory[]>([]);
    const [markers, setMarkers] = useState<Coord[]>([]);

    useEffect(() => {
        API.get(`/geography/decorations?flight_id=${flightID}`)
        .then((data: [Trajectory[], Coord[]]) => {
            setLines(data[0]);
            setMarkers(data[1]);
        })
    }, [])

    // some trajectory is required for this component
    if (lines.length == 0) {
        return;
    }

    // compute center and zoom factor
    const longitudeDelta = Math.abs(lines[0].second.longitude - lines[0].first.longitude);
    const clipsMap = longitudeDelta > 180;

    let center: [number, number] = [0, 0];
    let zoom: number = 160;

    // proceed if the trajectory does not 'clip' around the map
    if (!clipsMap) {
        const middleLongitude = (lines[0].first.longitude + lines[0].second.longitude) / 2;
        const middleLatitude = (lines[0].first.latitude + lines[0].second.latitude) / 2;

        center = [middleLongitude, middleLatitude];
        zoom = Math.min(20000/distance, 10) * 320;
    }

    return (
        <ComposableMap width={1000} 
                       height={470}
                       projectionConfig={{
                           scale: zoom,
                           center: center
                       }}>

                {/* the zoom calculation effectively undoes the automatic zoom 
                    adjustment from the ComposableMap component */}
                <MapFeatures lines={lines} markers={markers} zoom={1 / Math.sqrt(zoom)}/>

        </ComposableMap>
    );
}
