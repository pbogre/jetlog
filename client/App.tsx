import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import { BASE_URL } from './api';

import Login from './pages/Login';
import New from './pages/New';
import Home from './pages/Home'
import AllFlights from './pages/AllFlights'
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

import Navbar from './components/Navbar';

export function App() {
    return (
        <BrowserRouter basename={BASE_URL}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={
                    <>
                        <Navbar />
                        <div className="h-full p-4 overflow-x-auto">
                            <Outlet />
                        </div>
                    </>}>
                    <Route path="/" element={<Home />} />
                    <Route path="/new" element={<New />} />
                    <Route path="/flights" element={<AllFlights />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
