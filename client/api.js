import axios from 'axios';
import React from 'react';

class API {
    endpoint;

    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    get(callback) {
        const endpoint = this.endpoint;

        React.useEffect(() => {
            async function getData() {
                const res = await axios.get("/api/" + endpoint)
                callback(res.data);
            }
            getData();
        }, []);
    }

    post(data, callback = null) {
        const res = axios.post("/api/" + this.endpoint, data)
        if (callback) {
            callback(res.data)
        }
    }
}

export const flightsAPI = new API("flights");
