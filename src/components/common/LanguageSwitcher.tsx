import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage as setLanguage } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  const currentLanguage = i18n.language;

  const changeLanguage = (language: string) => {
    setLanguage(language);
  };

  return (
    <View style={styles.container}>
      {Object.keys(SUPPORTED_LANGUAGES).map((langCode) => (
        <TouchableOpacity
          key={langCode}
          style={[
            styles.button,
            currentLanguage === langCode && styles.activeButton,
            isDarkMode && styles.darkButton,
            currentLanguage === langCode && isDarkMode && styles.darkActiveButton,
          ]}
          onPress={() => changeLanguage(langCode)}
        >
          <Text
            style={[
              styles.buttonText,
              currentLanguage === langCode && styles.activeButtonText,
              isDarkMode && styles.darkButtonText,
              currentLanguage === langCode && isDarkMode && styles.darkActiveButtonText,
            ]}
          >
            {SUPPORTED_LANGUAGES[langCode as keyof typeof SUPPORTED_LANGUAGES]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  darkButton: {
    borderColor: '#2980b9',
  },
  activeButton: {
    backgroundColor: '#3498db',
  },
  darkActiveButton: {
    backgroundColor: '#2980b9',
  },
  buttonText: {
    color: '#3498db',
    fontSize: 14,
  },
  darkButtonText: {
    color: '#2980b9',
  },
  activeButtonText: {
    color: '#fff',
  },
  darkActiveButtonText: {
    color: '#fff',
  },
}); 