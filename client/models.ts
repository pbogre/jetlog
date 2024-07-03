export class Flight {
    id: number | null;
    date: string;
    origin: Airport|string;
    destination: Airport|string;
    departureTime: string;
    arrivalTime: string;
    seat: string;
    duration: number;
    airplane: string;
    flightNumber: string;
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
