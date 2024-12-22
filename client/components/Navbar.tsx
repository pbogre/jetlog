import { NavLink } from 'react-router-dom';
import React, {useState} from 'react';

interface NavItemProps {
    to: string;
    text: string;
    right?: boolean;
}

function NavItem({ to, text, right = false }: NavItemProps) {
    return (
        <NavLink to={to}>
            { ({ isActive }) => 
                <li className={`p-4 border-b-4 border-gray-700 dark:border-gray-600 hover:border-primary-400
                                ${ isActive ? "text-primary-400" : "text-gray-900 dark:text-gray-100" } 
                                ${ right ? "justify-self-end" : "" }`}>
                {text}
                </li>
            }
        </NavLink>
    );
}

function NavMenu({ items }) {
    const [open, setOpen] = useState<boolean>(false);

    const toggleOpen = () => {
        setOpen(!open);
    }

    return (
        <div>
            <p className="p-4 text-gray-900 dark:text-gray-100 cursor-pointer float-right" onClick={toggleOpen}>{open ? "x" : "Menu"}</p>
            { open &&
            <div className="bg-gray-100 dark:bg-gray-800 absolute top-[3.5em] right-0" onClick={toggleOpen}>
                {[items.home, items.new, items.flights, items.statistics, items.settings]}
            </div>
            }
        </div>
    );
}

export default function Navbar() {
    const items = {
        'home': <NavItem to="/" text="Home" />,
        'new': <NavItem to="/new" text="New" />,
        'flights': <NavItem to="/flights" text="All Flights" />,
        'statistics': <NavItem to="/statistics" text="Statistics" />,
        'settings': <NavItem to="/settings" text="Settings" right={true} />
    };

    return(
        <nav className="bg-gray-100 dark:bg-gray-800 shadow-lg">
            <div className="flex justify-between max-md:hidden">
                <div className="flex">
                {[items.home, items.new, items.flights, items.statistics]}
                </div>

                <div className="flex">
                {[items.settings]}
                </div>
            </div>

            <div className="flex justify-between md:hidden">
                <div className="flex">
                {[items.home, items.new]}
                </div>

                <NavMenu items={items} />
            </div>
        </nav>
    );
}
