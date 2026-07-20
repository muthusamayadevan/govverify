import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './en.json';
import translationTA from './ta.json';

const resources = {
  en: {
    translation: translationEN
  },
  ta: {
    translation: translationTA
  }
};

// Retrieve language choice from localStorage or default to English
const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values by default
    }
  });

// Persist the user's choice to localStorage when the language is changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
