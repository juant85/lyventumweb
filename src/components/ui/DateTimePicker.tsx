import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css'; // FIXED: Correct path

interface DateTimePickerProps {
    label?: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    showTimeSelect?: boolean;
    dateFormat?: string;
    timeFormat?: string;
    placeholderText?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    inline?: boolean; // NEW: For inline calendar display
    showMonthDropdown?: boolean; // NEW: Show month dropdown
    showYearDropdown?: boolean; // NEW: Show year dropdown
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    label,
    value,
    onChange,
    showTimeSelect = false,
    dateFormat = 'yyyy-MM-dd',
    timeFormat = 'HH:mm',
    placeholderText = 'Select date',
    disabled = false,
    minDate,
    maxDate,
    className = '',
    inline = false,
    showMonthDropdown = true, // NEW: Default to true for better UX
    showYearDropdown = true, // NEW: Default to true for better UX
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}
            <DatePicker
                selected={value}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                dateFormat={showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat}
                timeFormat={timeFormat}
                placeholderText={placeholderText}
                disabled={disabled}
                minDate={minDate}
                maxDate={maxDate}
                inline={inline}
                showMonthDropdown={showMonthDropdown}
                showYearDropdown={showYearDropdown}
                scrollableYearDropdown
                yearDropdownItemNumber={15}
                className={inline ? '' : "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:border-slate-400 dark:hover:border-slate-500 text-base"}
                calendarClassName="modern-calendar"
                wrapperClassName="w-full"
                showPopperArrow={false}
                popperPlacement="bottom-start"
            />
        </div>
    );
};

export default DateTimePicker;
