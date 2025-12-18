import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    labelClassName?: string;
    error?: string;
    warning?: string;
    wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, id, error, warning, className = '', wrapperClassName = '', labelClassName = '', ...props }, ref) => {
    const borderClass = error
        ? 'border-accent-400'
        : warning
            ? 'border-amber-400'
            : 'border-slate-300 dark:border-slate-600';

    const ringClass = error
        ? 'focus:ring-accent-500/50 focus:border-accent-500'
        : warning
            ? 'focus:ring-amber-500/50 focus:border-amber-500'
            : 'focus:ring-primary-500/50 focus:border-primary-500';

    return (
        <div className={`mb-4 ${wrapperClassName}`}>
            {label && <label htmlFor={id} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat ${labelClassName}`}>{label}</label>}
            <textarea
                ref={ref}
                id={id}
                className={`w-full px-3 py-2 border ${borderClass} rounded-lg shadow-sm focus:ring-2 ${ringClass} outline-none transition duration-150 ease-in-out sm:text-sm font-sans disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-400 min-h-[100px] ${className}`}
                {...props}
            />
            {error && <p className="mt-1.5 text-xs text-accent-600 dark:text-accent-400 font-sans">{error}</p>}
            {warning && !error && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans">{warning}</p>}
        </div>
    );
});

export default Textarea;
