import { NavLink } from 'react-router-dom';
import React from 'react';

import "../css/navbar.css"

function NavItem({ to, text }) {
    return (
        <NavLink to={to}>
            { ({ isActive }) => 
                <li className={isActive ? "navbar-item navbar-active" : "navbar-item"}>
                {text}
                </li>
            }
        </NavLink>
    );
}

export default function Navbar() {
    return(
        <nav>
            <ul className="navbar">
                <NavItem to="/" text="Home" />
                <NavItem to="/new" text="New" />
                <NavItem to="/settings" text="Settings" />
            </ul>
        </nav>
    );
}
