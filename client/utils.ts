import {Airport} from './models';

export function stringifyAirport(airport: Airport) {
    if(airport.iata == null && airport.icao == null) {
        return "N/A";
    }

    return (airport.iata || airport.icao) + " - " + airport.city + "/" + airport.country;
}
