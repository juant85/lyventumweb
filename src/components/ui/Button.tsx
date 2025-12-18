import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'link' | 'brandBlue' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  // Base styles with touch optimization
  const baseStyles = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out inline-flex items-center justify-center font-sans shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-sm transform active:scale-[0.98] touch-manipulation select-none";

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 focus:ring-primary-500 border border-transparent',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
    accent: 'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg shadow-accent-500/30 hover:shadow-accent-500/40 hover:from-accent-500 hover:to-accent-400 focus:ring-accent-500 border border-transparent',
    neutral: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:active:bg-slate-500',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 active:text-primary-800 focus:ring-primary-500 shadow-none hover:underline dark:text-primary-400 dark:hover:text-primary-300 dark:active:text-primary-200',
    brandBlue: 'bg-gradient-to-r from-brandBlue to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-brandBlue focus:ring-primary-500 border border-transparent',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/50 active:bg-slate-200/50 focus:ring-slate-500 shadow-none dark:text-slate-300 dark:hover:bg-slate-800/50'
  };

  // Size styles with minimum tap targets (iOS HIG: 44x44px)
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs min-h-[40px]',
    md: 'px-5 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;