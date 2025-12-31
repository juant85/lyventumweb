import React, { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '../Icons';
import Button from './Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footerContent?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footerContent }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

      {/* Modal Panel - Apply flexbox layout and max-height */}
      <div
        className={`relative flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-2xl transform transition-all sm:my-8 sm:w-full ${sizeClasses[size]} mx-auto max-h-[90vh]`}
        role="document" // Added for accessibility, indicating it's a document within the dialog
      >
        {/* Header - Make it non-shrinkable            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 id="modal-title" className="text-xl font-semibold text-gray-800 dark:text-white font-montserrat">
                {title}
              </h2>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Make it grow and scrollable */}
        <div className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-4">
            {children}
          </div>
        </div>

        {/* Footer - Make it non-shrinkable */}
        {footerContent !== undefined && (
          <div className="flex-shrink-0 flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-700 rounded-b print-hide">
            {footerContent ? footerContent : (
              <Button
                type="button"
                onClick={onClose}
                variant="primary"
              >
                {t(localeKeys.cancel)}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;