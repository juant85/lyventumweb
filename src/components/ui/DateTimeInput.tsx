import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';

interface DateTimeInputProps {
    label?: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    placeholderText?: string;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    className = '',
    disabled = false,
    required = false,
    placeholderText,
}) => {
    // Internal state to manage separation
    const [selectedDate, setSelectedDate] = useState<Date | null>(value);
    const [selectedTime, setSelectedTime] = useState<string>('08:00'); // Changed default to 08:00

    // Sync internal state when prop value changes
    useEffect(() => {
        if (value) {
            setSelectedDate(value);
            // Format time as HH:mm
            const hours = value.getHours().toString().padStart(2, '0');
            const minutes = value.getMinutes().toString().padStart(2, '0');
            setSelectedTime(`${hours}:${minutes}`);
        } else {
            setSelectedDate(null);
            // Keep selectedTime as is (or 08:00) so if user picks a date, it uses this time
        }
    }, [value]);

    // Update parent when Date changes
    const handleDateChange = (date: Date | null) => {
        if (!date) {
            onChange(null);
            return;
        }

        // Combine new date with *current selected time*
        const newDateTime = new Date(date);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        newDateTime.setHours(hours || 0);
        newDateTime.setMinutes(minutes || 0);

        onChange(newDateTime);
    };

    // Update parent when Time changes
    const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTime = e.target.value;
        setSelectedTime(newTime); // Update local state immediately

        if (selectedDate) {
            const newDateTime = new Date(selectedDate);
            const [hours, minutes] = newTime.split(':').map(Number);
            newDateTime.setHours(hours);
            newDateTime.setMinutes(minutes);
            onChange(newDateTime);
        }
    };

    // Generate time options (every 15 mins)
    const timeOptions = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            const timeValue = `${hour}:${minute}`;

            // Format display label (e.g., 9:00 AM)
            const date = new Date();
            date.setHours(i);
            date.setMinutes(j);
            const timeLabel = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            timeOptions.push({ value: timeValue, label: timeLabel });
        }
    }

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                {/* Date Picker Section */}
                <div className="flex-1 relative">
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        dateFormat="MMM dd, yyyy"
                        placeholderText={placeholderText || "Select date"}
                        minDate={minDate}
                        maxDate={maxDate}
                        disabled={disabled}
                        showMonthDropdown
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={15}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:border-slate-400 dark:hover:border-slate-500 text-sm font-medium"
                        wrapperClassName="w-full"
                        popperPlacement="bottom-start"
                    />
                    {/* Calendar Icon Overlay */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Time Picker Section - Native Select for reliability */}
                <div className="w-full sm:w-40 relative">
                    <select
                        value={selectedTime}
                        onChange={handleTimeChange}
                        disabled={!selectedDate || disabled}
                        className="w-full pl-10 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:border-slate-400 dark:hover:border-slate-500 appearance-none text-sm font-medium"
                    >
                        {timeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Clock Icon Overlay */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {/* Chevron Icon Overlay */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
            {value && (
                <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
                    Selected: {value.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </div>
            )}
        </div>
    );
};
