import React, { useState, useEffect, ChangeEvent } from 'react';
import ConfigStorage from '../storage/configStorage';

interface TimeInputProps {
    name?: string;
    defaultValue?: string;
    onChange?: ((event: ChangeEvent<HTMLInputElement>) => any) | null;
    required?: boolean;
}

// Convert 24-hour time (HH:MM) to 12-hour format
function to12Hour(time24: string): { time: string; period: 'AM' | 'PM' } {
    if (!time24) return { time: '', period: 'AM' };

    const [hoursStr, minutes] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';

    if (hours === 0) {
        hours = 12;
    } else if (hours > 12) {
        hours = hours - 12;
    }

    return {
        time: `${hours.toString().padStart(2, '0')}:${minutes}`,
        period
    };
}

// Convert 12-hour time to 24-hour format
function to24Hour(time12: string, period: 'AM' | 'PM'): string {
    if (!time12) return '';

    const [hoursStr, minutes] = time12.split(':');
    let hours = parseInt(hoursStr, 10);

    if (period === 'AM') {
        if (hours === 12) {
            hours = 0;
        }
    } else {
        if (hours !== 12) {
            hours = hours + 12;
        }
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export default function TimeInput({
    name,
    defaultValue,
    onChange = null,
    required = false
}: TimeInputProps) {
    const use24Hour = ConfigStorage.getSetting('use24HourFormat') === 'true';

    // For 12-hour mode, we need to track the period separately
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const [time12, setTime12] = useState('');

    // Initialize 12-hour values from defaultValue
    useEffect(() => {
        if (defaultValue && !use24Hour) {
            const converted = to12Hour(defaultValue);
            setTime12(converted.time);
            setPeriod(converted.period);
        }
    }, [defaultValue, use24Hour]);

    // For 24-hour mode, use native time input
    if (use24Hour) {
        return (
            <input
                className="px-1 mb-4 bg-white rounded-none outline-none font-mono box-border
                           border-b-2 border-gray-200 focus:border-primary-400"
                type="time"
                name={name}
                defaultValue={defaultValue}
                onChange={onChange ? onChange : () => {}}
                required={required}
            />
        );
    }

    // For 12-hour mode, use custom input with AM/PM selector
    const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newTime12 = e.target.value;
        setTime12(newTime12);

        // Convert to 24-hour for the hidden input and callback
        if (onChange && newTime12) {
            const time24 = to24Hour(newTime12, period);
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: time24,
                    name: name
                }
            } as ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
        }
    };

    const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value as 'AM' | 'PM';
        setPeriod(newPeriod);

        // Update the hidden input value
        if (onChange && time12) {
            const time24 = to24Hour(time12, newPeriod);
            const syntheticEvent = {
                target: {
                    value: time24,
                    name: name
                }
            } as ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
        }
    };

    // Calculate the 24-hour value for the hidden input
    const value24 = time12 ? to24Hour(time12, period) : (defaultValue || '');

    return (
        <div className="inline-flex items-center gap-1">
            <input
                className="px-1 mb-4 bg-white rounded-none outline-none font-mono box-border
                           border-b-2 border-gray-200 focus:border-primary-400"
                type="time"
                value={time12}
                onChange={handleTimeChange}
                required={required}
            />
            <select
                className="px-1 py-0.5 mb-4 bg-white rounded-none outline-none font-mono box-border
                           border-b-2 border-gray-200 focus:border-primary-400"
                value={period}
                onChange={handlePeriodChange}
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
            {/* Hidden input to submit the 24-hour value */}
            <input type="hidden" name={name} value={value24} />
        </div>
    );
}
