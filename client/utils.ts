import {Airport} from './models';

export function stringifyAirport(airport: Airport|null) {
    if(airport === null) {
        return "N/A";
    }

    return (airport.iata || airport.icao) + " - " + airport.municipality + "/" + airport.country;
}
