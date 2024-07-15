import { NavLink } from 'react-router-dom';
import React from 'react';

interface NavItemProps {
    to: string;
    text: string;
    right?: boolean;
}

function NavItem({ to, text, right = false }: NavItemProps) {
    return (
        <NavLink to={to}>
            { ({ isActive }) => 
                <li className={`p-4 border-b-4 border-gray-700 hover:border-primary-400
                                ${ isActive ? "text-primary-400" : "text-white" } 
                                ${ right ? "absolute right-0" : "" }`}>
                {text}
                </li>
            }
        </NavLink>
    );
}

export default function Navbar() {
    return(
        <nav className="flex bg-gray-700 list-none">
            <NavItem to="/" text="Home" />
            <NavItem to="/new" text="New" />
            <NavItem to="/flights" text="All Flights" />
            <NavItem to="/statistics" text="Statistics" />
            <NavItem to="/settings" text="Settings" right={true} />
        </nav>
    );
}
