import axios from "axios";

export async function get(endpoint) {
    await axios.get('/api' + endpoint)
    .then((res) => {
        return res.data;
    })
    .catch((err) => {
        console.log(err);
    })
}

export async function post(endpoint, data) {
    await axios.post('/api/' + endpoint, data)
    .then((res) => {
        return res.data;
    })
    .catch((err) => {
        console.log(err);
    })
}

export async function patch(endpoint, id, data) {
    await axios.patch('/api/' + endpoint + '/' + id, data)
    .then((res) => {
        return res;
    })
    .catch((err) => {
        console.log(err);
    })
}

export async function remove(endpoint, id) {
    await axios.delete('/api/' + endpoint + '/' + id)
    .then((res) => {
        return res;
    })
    .catch((err) => {
        console.log(err);
    })
}
