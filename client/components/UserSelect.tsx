import React, { useState, useEffect } from 'react';

import { Select } from './Elements';

import API from '../api';

interface UserSummary {
    id: number;
    username: string;
}
export default function UserSelect() {
    const [users, setUsers] = useState<UserSummary[]>([]);

    useEffect(() => {
        API.get("/auth/users")
        .then((res) => {
            setUsers(res)
        });
    }, [])

    return (
        <Select name="userId" options={[
            { text: "You", value: "" },
            ...users.map((user) => ({
                text: user.username,
                value: user.id.toString()
            }))
        ]}/>
    )
}
