export class User {
    id: number;
    username: string;
    isAdmin: boolean;
    lastLogin: string;
    createdOn: string;
}

export class Flight {
    id: number;
    username: string;
    date: string;
    origin: Airport;
    destination: Airport;
    departureTime: string;
    arrivalTime: string;
    arrivalDate: string;
    seat: string;
    aircraftSide: string;
    ticketClass: string;
    purpose: string;
    duration: number;
    distance: number;
    airplane: string;
    flightNumber: string;
    notes: string;
}

export class Airport {
    icao: string;
    iata: string;
    type: string;
    name: string;
    municipality: string;
    region: string;
    country: string;
    continent: string;
    latitude: number;
    longitude: number;
}

export class Statistics {
    totalFlights: number;
    totalDuration: number;
    totalDistance: number;
    totalUniqueAirports: number;
    daysRange: number;
    mostVisitedAirports: object;
    seatFrequency: object;
    ticketClassFrequency: object;
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
