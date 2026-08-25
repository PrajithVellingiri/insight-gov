import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';
import hiTranslation from './locales/hi/translation.json';
import mlTranslation from './locales/ml/translation.json';
import teTranslation from './locales/te/translation.json';
import knTranslation from './locales/kn/translation.json';

const resources = {
  en: { translation: enTranslation },
  ta: { translation: taTranslation },
  hi: { translation: hiTranslation },
  ml: { translation: mlTranslation },
  te: { translation: teTranslation },
  kn: { translation: knTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
