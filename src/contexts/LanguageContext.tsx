// src/contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { en, es, Locale, LocaleKeys } from '../i18n/locales';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: LocaleKeys, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Locale> = { en, es };

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && (storedLang === 'en' || storedLang === 'es')) {
            return storedLang;
        }
        // Fallback to browser language if it's Spanish, otherwise default to English
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'es' ? 'es' : 'en';
    }
    return 'en'; // Default for SSR or non-browser environments
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }
  }, [language]);

  const t = useCallback((key: LocaleKeys, options?: { [key: string]: string | number }): string => {
    const langDict = translations[language];
    // Simple key access
    let translation = (langDict as any)[key] as string;
    
    // Handle nested keys like 'plans.basic.name'
    if (!translation && typeof key === 'string' && key.includes('.')) {
        const keys = key.split('.');
        translation = keys.reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, langDict as any);
    }

    if (translation && options) {
        Object.keys(options).forEach(optKey => {
            translation = translation.replace(`{{${optKey}}}`, String(options[optKey]));
        });
    }

    return translation || String(key); // Return the key itself as a fallback
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage: setLanguageState, t }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
