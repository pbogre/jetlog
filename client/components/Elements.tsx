import React, {ChangeEvent, useState} from 'react';

interface HeadingProps {
    text: string;
}
export function Heading({ text }: HeadingProps) {
    return (
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-dark-50 transition-colors duration-default">{text}</h1>
    );
}

interface SubheadingProps {
    text: string;
}
export function Subheading({ text }: SubheadingProps) {
    return (
        <h3 className="mb-2 font-bold text-lg text-gray-800 dark:text-dark-100 transition-colors duration-default">{text}</h3>
    );
}

interface WhisperProps {
    text: string;
    negativeTopMargin?: boolean;
}
export function Whisper({ text, negativeTopMargin = false}: WhisperProps) {
    return (
        <p className={`${negativeTopMargin ? "-mt-4" : ""} text-sm font-mono text-gray-600 dark:text-dark-400 transition-colors duration-default`}>
            {text}
        </p>
    )
}

interface LabelProps {
    text: string;
    required?: boolean;
}
export function Label({ text, required }: LabelProps) {
    return (
        <label className={`${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}
                          mb-1 font-semibold block text-gray-900 dark:text-dark-100 transition-colors duration-default`}>
            {text}
        </label> 
    );
}

interface ButtonProps {
    text: string;
    level?: "default" | "success" | "danger";
    right?: boolean;
    submit?: boolean;
    disabled?: boolean;
    onClick?: (() => void) | null;
    className?: string; // Add optional className prop
    inline?: boolean; // Add an optional inline flag
}

export function Button({
    text,
    level = "default",
    right = false,
    submit = false,
    disabled = false,
    onClick = null,
    className = "", // Default to an empty string
    inline = false, // Default to false
}: ButtonProps) {
    const levelClasses = {
        default: "bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-900 dark:text-dark-100",
        success: "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white",
        danger: "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white",
    };

    return (
        <button
            className={`px-4 py-2 rounded-lg font-semibold ${levelClasses[level]} 
                        ${right ? "float-right" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                        transition-all duration-default ease-default ${inline ? "" : "block w-full"} ${className}`}
            type={submit ? "submit" : "button"}
            disabled={disabled}
            onClick={onClick ? () => onClick() : undefined}
        >
            {text}
        </button>
    );
}


interface InputProps {
    type: "text"|"password"|"number"|"date"|"time"|"file";
    name?: string;
    defaultValue?: string;
    maxLength?: number;
    onChange?: ((event: ChangeEvent<HTMLInputElement>) => any)|null;
    required?: boolean;
    placeholder?: string;
}
export function Input({ type, 
                        name, 
                        defaultValue,
                        maxLength, 
                        onChange = null, 
                        required = false, 
                        placeholder}: InputProps) {
    return (
        <input className="w-full px-3 py-2 mb-3 
                         bg-gray-50 dark:bg-dark-800 
                         border border-gray-300 dark:border-dark-600 
                         rounded-lg 
                         text-gray-900 dark:text-gray-100
                         placeholder:text-gray-500 dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                         transition-all duration-default ease-default"
               type={type}
               name={name}
               defaultValue={defaultValue}
               maxLength={maxLength}
               onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e) : undefined}
               required={required}
               placeholder={placeholder}/>
    );
}

interface TextAreaProps {
    name?: string;
    defaultValue?: string;
    placeholder?: string;
    maxLength?: number;
}
export function TextArea({ name,
                            defaultValue,
                            placeholder,
                            maxLength }: TextAreaProps) {
    return (
        <textarea className="w-full px-3 py-2 mb-3 
                            bg-gray-50 dark:bg-dark-800 
                            border border-gray-300 dark:border-dark-600 
                            rounded-lg 
                            text-gray-900 dark:text-gray-100
                            placeholder:text-gray-500 dark:placeholder:text-gray-400
                            focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                            transition-all duration-default ease-default"
                  name={name}
                  defaultValue={defaultValue}
                  placeholder={placeholder}
                  maxLength={maxLength}/>
    );
}

interface CheckboxProps {
    name?: string;
    checked?: boolean;
    onChange?: ((event: ChangeEvent<HTMLInputElement>) => any)|null;
}
export function Checkbox({ checked, name, onChange }: CheckboxProps) {
    return (
        <input className="w-5 h-5 rounded border-gray-300 dark:border-dark-600 
                         text-primary-600 dark:text-primary-400
                         focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                         bg-white dark:bg-dark-800
                         transition-all duration-default ease-default"
               type="checkbox"
               name={name}
               checked={checked}
               onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e) : undefined}/>
    );
}

interface OptionProps {
    text: string;
    value?: string;
}
export function Option({text, value}: OptionProps) {
    return (
        <option value={value === undefined ? text : value}>
            {text}
        </option>
    );
}

interface SelectProps {
    name?: string;
    options: OptionProps[];
}
export function Select({name, 
                        options }: SelectProps) {
    return (
        <select className="w-full px-3 py-2 mb-3 
                          bg-gray-50 dark:bg-dark-800 
                          border border-gray-300 dark:border-dark-600 
                          rounded-lg 
                          text-gray-900 dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                          transition-all duration-default ease-default"
                name={name}>
            {options.map((option) => <Option {...option}/>)}
        </select>
    );
}

interface DialogProps {
    title: string;
    buttonLevel?: "default"|"success"|"danger";
    formBody: any;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
}
export function Dialog({ title, buttonLevel = "default", formBody, onSubmit }: DialogProps) {
    const [open, setOpen] = useState<boolean>(false);

    const toggleOpen = () => {
        setOpen(!open);
    }

    return (
        <>
            <div className="mb-4">
                <Button text={title} level={buttonLevel} onClick={toggleOpen}/>
            </div>
            { open &&
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-dark-paper p-6 rounded-lg shadow-xl w-96
                                  border border-gray-200 dark:border-dark-700
                                  transition-all duration-default ease-default">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100">{title}</h2>
                            <button onClick={toggleOpen}
                                    className="text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200
                                             transition-colors duration-default">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={(event) => {
                            onSubmit(event);
                            toggleOpen();
                        }}>
                            {formBody}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button text="Cancel" onClick={toggleOpen}/>
                                <Button text="Submit" level={buttonLevel} submit/>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </>
    );
}
