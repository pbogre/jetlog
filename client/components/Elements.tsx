import React, {ChangeEvent} from 'react';

interface HeadingProps {
    text: string;
}
export function Heading({ text }: HeadingProps) {
    return (
        <h1 className="mb-3 text-3xl font-bold">{ text }</h1>
    );
}

interface SubheadingProps {
    text: string;
}
export function Subheading({ text }: SubheadingProps) {
    return (
        <h3 className="mb-2 font-bold text-lg">{text}</h3>
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
    right?: boolean;
    submit?: boolean;
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>|null;
}
export function Button({ text, 
                         level = "default",
                         right = false,
                         submit = false, 
                         disabled = false,
                         onClick = null }: ButtonProps) {
    var colors = "";
    switch(level) {
        case "success":
            colors = "bg-green-500 text-white enabled:hover:bg-green-400";
            break;
        case "danger":
            colors = "bg-red-500 text-white enabled:hover:bg-red-400";
            break;
        case "default":
        default:
            colors = "bg-white text-black border border-gray-300 enabled:hover:bg-gray-100";
    };

    return (
        <button type={submit ? "submit": undefined}
                className={`py-1 px-2 my-1 mr-1 rounded-md cursor-pointer ${colors}
                            disabled:opacity-60 disabled:cursor-not-allowed
                            ${right ? "float-right" : ""}`}
                disabled={disabled}
                onClick={onClick ? onClick : () => {}}>
            {text}
        </button>
    );
}

//TODO: number only inputs should only allow numbers to be typed
interface InputProps {
    type: "text"|"number"|"date"|"time";
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
        <input  className={`${type == "text" ? "w-full" : ""} px-1 mb-4 bg-white rounded-none outline-none font-mono box-border 
                            placeholder:italic border-b-2 border-gray-200 focus:border-primary-400`}
                type={type}
                name={name} 
                value={value} 
                maxLength={maxLength}
                min={type == "number" ? 0 : type == "date" ? "1970-01-01" : undefined}
                onChange={onChange ? onChange : () => {}}
                required={required}
                placeholder={placeholder}/>
    );
}

interface OptionProps {
    text: string;
    value?: string;
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

interface DialogProps {
    title: string;
    formBody: any; // ?
    onSubmit: React.FormEventHandler<HTMLFormElement>;
}
export function Dialog({ title, formBody, onSubmit }: DialogProps) {
    const openModal = () => {
        const modalElement = document.getElementById("modal") as HTMLDialogElement;
        modalElement.showModal();
    }

    const closeModal = () => {
        const modalElement = document.getElementById("modal") as HTMLDialogElement;
        modalElement.close();
    }

    const handleSubmit = (event) => {
        closeModal();
        onSubmit(event);
    }

    return (
    <>
            <Button text={title} onClick={openModal}/>

            <dialog id="modal" className="md:w-2/3 max-md:w-4/5 rounded-md">
            <form className="flex flex-col" onSubmit={handleSubmit}>
                
                <div className="pl-5 pt-2 border-b border-b-gray-400">
                    <Subheading text={title} />
                </div>

                <div className="p-5">
                    {formBody}
                </div>

                <div className="px-5 py-2 border-t border-t-gray-400">
                    <Button text="Cancel"
                            onClick={closeModal} />
                    <Button text="Done" 
                            level="success"
                            right
                            submit/>
                </div>

            </form>
            </dialog>
        </>
    );
}
