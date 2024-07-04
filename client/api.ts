import axios, {Axios} from 'axios';

class API {
    client: Axios;

    constructor(endpoint: string) {
        this.client = axios.create({
            baseURL: "/api/" + endpoint,
            timeout: 5000
        })
    }

    handleError(err: any) {
        if(err.response) {
            alert("Bad response: " + err.response.data.detail);
        }
        else if (err.request) {
            alert("Bad request: " + err.request);
        }
        else {
            alert("Unknown error: " + err);
        }
    }

    async get(query: string|null = null, success: Function|null = null) {
        if(query) {
            query = query.trim();
            query = query.replace(/\//g, '');
        }

        try {
            const res = await this.client.get(query ? query : "");
            if (success) success();
            return res.data;
        } 
        catch(err) { 
            this.handleError(err);
            throw err; // for caller to use
        }
    }

    async post(data: Object, success: Function|null = null) {
        try {
            const res = await this.client.post("", data);
            if (success) success();
            return res.data;
        }
        catch(err) {
            this.handleError(err);
            throw err; // for caller to use
        }
    }
}

export const flightsAPI = new API("flights");
export const airportsAPI = new API("airports")
