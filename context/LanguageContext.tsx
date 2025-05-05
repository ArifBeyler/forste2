import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import enLocale from '../locales/en.json';
import trLocale from '../locales/tr.json';

type Locale = 'tr' | 'en';
type LocaleData = typeof trLocale;

interface LanguageContextType {
  locale: Locale;
  localeData: LocaleData;
  changeLocale: (newLocale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const defaultLocale: Locale = 'tr';
const locales: Record<Locale, LocaleData> = {
  tr: trLocale,
  en: enLocale,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [localeData, setLocaleData] = useState<LocaleData>(locales[defaultLocale]);

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('userLocale');
        if (savedLocale && (savedLocale === 'tr' || savedLocale === 'en')) {
          setLocale(savedLocale);
          setLocaleData(locales[savedLocale]);
        }
      } catch (error) {
        console.error('Failed to load locale:', error);
      }
    };

    loadLocale();
  }, []);

  const changeLocale = async (newLocale: Locale) => {
    try {
      setLocale(newLocale);
      setLocaleData(locales[newLocale]);
      await AsyncStorage.setItem('userLocale', newLocale);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  };

  // Nested key desteği ile çeviri fonksiyonu
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = localeData;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Çeviri bulunamadıysa key'i döndür
      }
    }

    if (typeof value === 'string') {
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) => str.replace(`{{${paramKey}}}`, paramValue),
          value
        );
      }
      return value;
    }

    return key;
  };

  return (
    <LanguageContext.Provider value={{ locale, localeData, changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 