import axios, {Axios} from 'axios';
import TokenStorage from './storage/tokenStorage';

const config = await fetch('./config').then((response) => response.json())
                                      .catch(() => ({ BASE_URL: '/' }));

export const BASE_URL = config.BASE_URL == '/' ? '' : config.BASE_URL;

// TODO improve this because there's a lot of repetition (get, post, delete are pretty much exactly the same)
// perhaps one method for each endpoint? i.e. API.getFlights(), ...
class APIClass {
    private client: Axios;

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL + "/api/",
            timeout: 10000
        })

        // use token for authorization header 
        this.client.interceptors.request.use(
            (config) => {
                if (config.url !== BASE_URL + "/api/auth/token") {
                    const token = TokenStorage.getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        )
    }

    private handleError(err: any) {
        if (err.response) {
            if (err.response.status === 401) {
                if (window.location.pathname !== BASE_URL + "/login") {
                    window.location.href = BASE_URL + "/login";
                }
            }
            else {
                alert("Bad response: " + err.response.data.detail);
            }
        }
        else if (err.request) {
            alert("Bad request: " + err.request);
        }
        else {
            alert("Unknown error: " + err);
        }
    }

    async get(endpoint: string, parameters: Object = {}) {
        endpoint = endpoint.trim();

        try {
            const res = await this.client.get(endpoint, { params: parameters });
            return res.data;
        } 
        catch(err) { 
            this.handleError(err);
            throw err; // for caller to use
        }
    }

    async post(endpoint: string, data: Object, downloadResponse: boolean = false) {
        endpoint = endpoint.trim();

        try {
            if(!downloadResponse) {
                const res = await this.client.post(endpoint, data);
                return res.data;
            } else {
                this.client.post(endpoint, data)
                .then((res) => {
                    // convert to blob and get fileName
                    const fileName = res.headers["content-disposition"].split("filename=\"")[1].replace('"', ''); // hacky
                    const blob = new Blob([res.data]);

                    // create element that links to download and click it, then remove it
                    // https://stackoverflow.com/questions/41938718/how-to-download-files-using-axios 
                    const href = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = href;
                    link.setAttribute('download', fileName);

                    document.body.appendChild(link);
                    link.click();

                    document.body.removeChild(link);
                    URL.revokeObjectURL(href);
                });
            }
        }
        catch(err) {
            this.handleError(err);
            throw err; // for caller to use
        }
    }

    async patch(endpoint: string, data: Object) {
        endpoint = endpoint.trim();

        try {
            const res = await this.client.patch(endpoint, data);
            return res.data;
        }
        catch(err) {
            this.handleError(err);
            throw err; // for caller to use
        }
    }

    async delete(endpoint: string) {
        endpoint = endpoint.trim();

        try {
            const res = await this.client.delete(endpoint);
            return res.data;
        }
        catch(err) {
            this.handleError(err);
            throw err; // for caller to use
        }
    }
}

const API = new APIClass();
export default API;
