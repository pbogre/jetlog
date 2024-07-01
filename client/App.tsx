import React from 'react';
import New from './components/New';
import Home from './components/Home'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export function Navbar() {
    return(
        <nav>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/new">New</Link></li>
            </ul>
        </nav>
    );
}

export function App() {
    return (
        <BrowserRouter>
        <Navbar />
            <div className='container'>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/new" element={<New />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
