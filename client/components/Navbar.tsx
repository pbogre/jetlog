import { NavLink } from 'react-router-dom';
import React from 'react';

import "../css/navbar.css"

interface NavItemProps {
    to: string;
    text: string;
    right?: boolean;
}

function NavItem({ to, text, right = false }: NavItemProps) {
    return (
        <NavLink to={to}>
            { ({ isActive }) => 
                <li className={`${ isActive ? "nav-item active" : "nav-item" } 
                                ${ right ? "right" : "" }`}>
                {text}
                </li>
            }
        </NavLink>
    );
}

export default function Navbar() {
    return(
        <nav>
            <NavItem to="/" text="Home" />
            <NavItem to="/new" text="New" />
            <NavItem to="/flights" text="All Flights" />
            <NavItem to="/settings" text="Settings" right={true} />
        </nav>
    );
}
