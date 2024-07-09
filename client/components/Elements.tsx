import React, {ChangeEvent} from 'react';

interface HeadingProps {
    text: string;
}
export function Heading({ text }: HeadingProps) {
    return (
        <h1 className="mb-3 text-3xl font-bold">{ text }</h1>
    );
}

interface LabelProps {
    text: string;
    required?: boolean;
}
export function Label({ text, required }: LabelProps) {
    return (
        <label className={`${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}
                          mb-1 font-semibold block`}>
            {text}
        </label> 
    );
}

interface ButtonProps {
    text: string;
    level?: "default"|"success"|"danger";
    submit?: boolean;
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>|null;
}
export function Button({ text, 
                         level = "default", 
                         submit = false, 
                         disabled = false, 
                         onClick = null }: ButtonProps) {
    var colors = "";
    switch(level) {
        case "success":
            colors = "bg-green-500 text-white border border-green-600 enabled:hover:bg-green-400";
            break;
        case "danger":
            colors = "bg-red-500 text-white border border-red-600 enabled:hover:bg-red-400";
            break;
        case "default":
        default:
            colors = "bg-white text-black border border-gray-300 enabled:hover:bg-gray-100";
    };

    return (
        <button type={submit ? "submit": undefined}
                className={`py-1 px-2 my-4 rounded-md cursor-pointer ${colors}
                            disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={disabled}
                onClick={onClick ? onClick : () => {}}>
            {text}
        </button>
    );
}

interface InputProps {
    type: "text"|"date"|"time";
    name?: string;
    value?: string;
    maxLength?: number;
    onChange?: ((event: ChangeEvent<HTMLInputElement>) => any)|null;
    required?: boolean;
    placeholder?: string;
}
export function Input({ type, 
                        name = undefined, 
                        value = undefined, 
                        maxLength = undefined, 
                        onChange = null, 
                        required = false, 
                        placeholder = undefined }: InputProps) {
    return (
        <input  className="px-1 mb-4 bg-white rounded-none outline-none font-mono box-border placeholder:italic
                border-b-2 border-gray-200 focus:border-primary-400"
                type={type}
                name={name} 
                value={value} 
                maxLength={maxLength}
                onChange={onChange ? onChange : () => {}}
                required={required}
                placeholder={placeholder}/>
    );
}

interface OptionProps {
    text: string;
    value: string;
}
function Option({text, value}: OptionProps) {
    return (
        <option className=""
                value={value}>
            {text}
        </option>
    );
}

interface SelectProps {
    name?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>|null;
    options: OptionProps[];
}
export function Select({name = undefined, 
                        value = undefined, 
                        onChange = null, 
                        options }: SelectProps) {
    return (
        <select className="px-1 py-0.5 mb-4 bg-white rounded-none outline-none font-mono bg-white box-border 
                border-b-2 border-gray-200 focus:border-primary-400"
                name={name}
                value={value}
                onChange={onChange ? onChange : () => {}}>
            { options.map((option) => (
                <Option text={option.text} value={option.value}/>  
            ))} 
        </select>
    );
}
