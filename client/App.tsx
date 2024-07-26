import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import New from './pages/New';
import Home from './pages/Home'
import AllFlights from './pages/AllFlights'
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

import Navbar from './components/Navbar';

export function App() {
    return (
        <BrowserRouter>
        <Navbar />

        <div className="p-3 overflow-x-auto">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/new" element={<New />} />
                <Route path="/flights" element={<AllFlights />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </div>

        </BrowserRouter>
    );
}
