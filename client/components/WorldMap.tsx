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

    // function that computes midpoint of a trajectory 
    // on a sphere, i.e. supporting trajs. that 'clip'
    // around the world projection
    const midpointOnSphere = (p1: Coord, p2: Coord) => {
        // convert degrees to radians
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        const lat1 = toRad(p1.latitude);
        const lon1 = toRad(p1.longitude);
        const lat2 = toRad(p2.latitude);
        const lon2 = toRad(p2.longitude);

        // convert to cartesian
        const x1 = Math.cos(lat1) * Math.cos(lon1);
        const y1 = Math.cos(lat1) * Math.sin(lon1);
        const z1 = Math.sin(lat1);

        const x2 = Math.cos(lat2) * Math.cos(lon2);
        const y2 = Math.cos(lat2) * Math.sin(lon2);
        const z2 = Math.sin(lat2);

        // compute average
        const x = (x1 + x2) / 2;
        const y = (y1 + y2) / 2;
        const z = (z1 + z2) / 2;

        // convert back to lat/lon
        const lon = Math.atan2(y, x);
        const hyp = Math.sqrt(x * x + y * y);
        const lat = Math.atan2(z, hyp);

        return [toDeg(lon), toDeg(lat)];
    };

    // compute center and zoom of map so that it fits the trajectory
    const center = midpointOnSphere(markers[0], markers[1]);
    const zoom = Math.min(20000/distance, 10) * 160;

    return (
        <ComposableMap width={1000} 
                       height={470}
                       projectionConfig={{
                           scale: zoom,
                           rotate: [-center[0], -center[1], 0] // rotate world around center of traj.
                       }}>

                {/* the zoom calculation effectively undoes the automatic zoom 
                    adjustment from the ComposableMap component */}
                <MapFeatures lines={lines} markers={markers} zoom={1 / Math.sqrt(zoom)}/>

        </ComposableMap>
    );
}
