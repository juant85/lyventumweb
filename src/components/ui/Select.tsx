import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  wrapperClassName?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, error, options, className = '', wrapperClassName = '', labelClassName = '', ...props }) => {
  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && <label htmlFor={id} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat ${labelClassName}`}>{label}</label>}
      <select
        id={id}
        className={`w-full px-3 py-2 border ${error ? 'border-accent-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition duration-150 ease-in-out sm:text-sm font-sans disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-200 ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-accent-600 font-sans">{error}</p>}
    </div>
  );
};

export default Select;