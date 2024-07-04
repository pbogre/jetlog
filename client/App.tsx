import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import New from './components/New';
import Home from './components/Home'
import Navbar from './components/Navbar';

import './css/jetlog.css'

function Settings() {
    return (
        <h1>Settings</h1>
    );
}

export function App() {
    return (
        <BrowserRouter>
        <Navbar />

        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/new" element={<New />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </div>

        </BrowserRouter>
    );
}
