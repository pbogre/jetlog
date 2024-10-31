import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import TokenStorage from '../storage/tokenStorage';
import {Heading, Checkbox, Input, Button} from '../components/Elements'

export default function Login() {
    const navigate = useNavigate();
    const [remember, setRemember] = useState<boolean>(false);
    const [failedLogin, setFailedLogin] = useState<boolean>(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        API.post("/auth/token", formData)
        .then((data) => {
            const token = data.access_token;
            TokenStorage.storeToken(token, remember);

            navigate("/");
        })
        .catch((err) => {
            if (err.response.status === 401) {
                setFailedLogin(true);
            }
        });
    }

    return (
    <div className="h-full flex items-center">
        <div className="container mx-auto max-w-xs text-center">
            <Heading text="Jetlog" />
            <form onSubmit={handleSubmit}>
                { failedLogin ?
                    <p className="mb-3 text-red-600">Incorrect username or password</p>
                    : <></>
                }
                <Input type="text" name="username" placeholder="username" required/>
                <Input type="password" name="password" placeholder="password" required/>

                <p className="inline mb-2">Remember me</p>
                <Checkbox name="remember" onChange={(e) => setRemember(e.target.checked)}/>

                <br />

                <button className="py-1 px-2 my-2 w-2/3 
                cursor-pointer bg-primary-500 text-white text-lg
                font-bold hover:bg-primary-400" type="submit">Login</button>
            </form>
        </div>
    </div>
    );
}
