export class Flight {
    id: number;
    date: string;
    origin: Airport;
    destination: Airport;
    departureTime: string;
    arrivalTime: string;
    seat: string;
    duration: number;
    distance: number;
    airplane: string;
    flightNumber: string;
    notes: string;
}

export class Airport {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
}

export class Statistics {
    amount: number;
    distance: number;
    time: number;
    dpf: number;
    uniqueAirports: number;
    commonAirport: Airport;
    commonSeat: string;
}

export class Coord {
    latitude: number;
    longitude: number;
    frequency: number;
}

export class Trajectory {
    first: Coord;
    second: Coord;
    frequency: number;
}
