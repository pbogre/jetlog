import {Airport} from './models';

export function stringifyAirport(airport: Airport) {
    return (airport.iata || airport.icao) + " - " + airport.city + "/" + airport.country;
}
