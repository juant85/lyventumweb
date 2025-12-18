import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, id, wrapperClassName = '', className = '', ...props }) => {
  return (
    <div className={`flex items-center ${wrapperClassName}`}>
      <input
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-primary-600 dark:ring-offset-slate-800 ${className}`}
        {...props}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-slate-900 dark:text-slate-300 font-sans">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;