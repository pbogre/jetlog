import axios from 'axios';

class API {
    endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    async get(callback: Function, query: string|null = null,) {
        const endpoint = query ? 
                         this.endpoint + "/" + query : 
                         this.endpoint;

        const res = await axios.get("/api/" + endpoint)
                    .catch((err) => {
                        throw err;
                    })

        callback(res.data);
    }

    async post(data: Object, callback: Function|null = null) {
        const res = await axios.post("/api/" + this.endpoint, data)
                    .catch((err) => {
                        throw err;
                    })
        
        if (callback) {
            callback(res.data);
        }
    }
}

export const flightsAPI = new API("flights");
export const airportsAPI = new API("airports")
