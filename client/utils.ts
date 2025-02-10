import {Airport, Airline} from './models';

export function stringifyAirport(airport: Airport|null) {
    if(airport === null) {
        return "N/A";
    }

    return (airport.iata || airport.icao) + " - " + airport.municipality + "/" + airport.country;
}

export function stringifyAirline(airline: Airline|null) {
    if(airline === null) {
        return "N/A";
    }

    return (airline.name + " - " + airline.icao);
}

export function objectFromForm(event) {
    let object = Object.fromEntries(new FormData(event.currentTarget));
    object = Object.fromEntries(Object.entries(object).filter(([_, v]) => v != ""));

    if (Object.keys(object).length === 0) {
        return null;
    }

    return object;
}
