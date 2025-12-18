// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-colors"
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <span className="font-bold text-sm">{language === 'en' ? 'EN' : 'ES'}</span>
    </button>
  );
};

export default LanguageSwitcher;