import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// İngilizce çeviriler
import enTranslation from './locales/en.json';
// Türkçe çeviriler
import trTranslation from './locales/tr.json';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Türkçe',
};

const resources = {
  en: {
    translation: enTranslation,
  },
  tr: {
    translation: trTranslation,
  },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

// Kullanıcının dil tercihini AsyncStorage'dan al
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // Cihazın dilini al, yoksa İngilizce kullan
    const deviceLanguage = Localization.locale.split('-')[0];
    return Object.keys(SUPPORTED_LANGUAGES).includes(deviceLanguage) 
      ? deviceLanguage 
      : 'en';
  } catch (error) {
    console.error('Dil tercihi yüklenirken hata:', error);
    return 'en'; // Hata durumunda varsayılan olarak İngilizce
  }
};

// Kullanıcının dil tercihini kaydet
export const saveLanguagePreference = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Dil tercihi kaydedilirken hata:', error);
  }
};

// Kullanıcının dil tercihini değiştir
export const changeLanguage = async (language: string) => {
  await saveLanguagePreference(language);
  i18n.changeLanguage(language);
};

// Varsayılan olarak İngilizce ile başlat ve sonra AsyncStorage'dan tercihi kontrol et
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // Başlangıçta tr kullan ama aşağıda güncellenecek
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

// Uygulama başladığında kaydedilmiş dil tercihini yükle
getSavedLanguage().then(language => {
  i18n.changeLanguage(language);
});

export default i18n; 