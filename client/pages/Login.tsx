import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

import API from '../api';
import TokenStorage from '../storage/tokenStorage';
import {Heading, Checkbox, Input, Button} from '../components/Elements'

export default function Login() {
    const navigate = useNavigate();
    const [remember, setRemember] = useState<boolean>(false)

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        API.post("/auth/token", formData)
        .then((res) => {
            const token = res.access_token;
            TokenStorage.storeToken(token, remember);

            navigate("/");
        });
    }

    return (
    <div className="h-full flex items-center">
        <div className="container mx-auto max-w-xs text-center">
            <Heading text="Jetlog" />
            <form onSubmit={handleSubmit}>
                <Input type="text" name="username" placeholder="username" required/>
                <Input type="text" name="password" placeholder="password" required/>

                <p className="inline mb-2">Remember me</p>
                <Checkbox name="remember" onChange={(e) => setRemember(e.target.checked)}/>

                <br />

                <Button text="Login" level="success" submit/>
            </form>
        </div>
    </div>
    );
}
