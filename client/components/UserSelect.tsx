import React, { useState, useEffect } from 'react';

import { Select } from './Elements';

import API from '../api';

export default function UserSelect() {
    const [users, setUsers] = useState<string[]>([]);

    useEffect(() => {
        API.get("/auth/users")
        .then((res) => {
            setUsers(res)
        });
    }, [])

    return (
        <Select name="username" options={[
            { text: "You", value: "" },
            ...users.map((username) => ({
                text: username,
                value: username
            }))
        ]}/>
    )
}
