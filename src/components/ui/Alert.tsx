

import React, { ReactNode } from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from '../Icons';

interface AlertProps {
  message: ReactNode;
  type: 'info' | 'warning' | 'success' | 'error';
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ message, type, className = '' }) => {
  const typeStyles = {
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/30',
      text: 'text-primary-700 dark:text-primary-300',
      border: 'border-primary-200 dark:border-primary-500/50',
      icon: <InformationCircleIcon className="h-5 w-5 text-primary-500 dark:text-primary-400" />
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-500/50',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 dark:text-amber-400" />
    },
    success: {
      bg: 'bg-secondary-50 dark:bg-secondary-900/30',
      text: 'text-secondary-700 dark:text-secondary-300',
      border: 'border-secondary-200 dark:border-secondary-500/50',
      icon: <CheckCircleIcon className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
    },
    error: {
      bg: 'bg-accent-50 dark:bg-accent-900/30',
      text: 'text-accent-700 dark:text-accent-300',
      border: 'border-accent-200 dark:border-accent-500/50',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-accent-500 dark:text-accent-400" />
    },
  };

  const currentStyle = typeStyles[type];

  return (
    <div className={`p-4 rounded-lg border ${currentStyle.bg} ${currentStyle.border} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          {currentStyle.icon}
        </div>
        <div className="ml-3">
          <div className={`text-sm ${currentStyle.text}`}>{message}</div>
        </div>
      </div>
    </div>
  );
};

export default Alert;