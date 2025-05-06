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
    airline: Airline;
    tailNumber: string;
    flightNumber: string;
    notes: string;
    connection: number;
    layoverDuration: number;

    toString(): string {
        if (this === null) return "N/A";

        if (this.origin.country == this.destination.country) {
            return this.origin.region + " to " + this.destination.region + ", " + this.date
        }

        return this.origin.country + " to " + this.destination.country + ", " + this.date
    }
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
    timezone: string;

    toString(): string {
        if (this === null) return "N/A";

        return (this.iata || this.icao) + " - " + this.municipality + "/" + this.country;
    }
}

export class Airline {
    icao: string;
    iata: string;
    name: string;

    toString(): string {
        if (this === null) return "N/A";

        return (this.iata || this.icao) + " - " + this.name;
    }
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
    mostCommonAirlines: object;
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
