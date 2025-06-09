import { StyleSheet } from 'react-native';

export const lightColors = {
  background: '#FFFFFF',
  text: '#000000',
  primaryText: '#333333',
  secondaryText: '#666666',
  accent: '#3498db',
  border: '#E0E0E0',
  card: '#F5F5F5',
  statusBar: 'dark',
  timerWorkBg: '#e74c3c',
  timerBreakBg: '#3498db',
  timerLongBreakBg: '#9b59b6',
  buttonPrimary: '#2ecc71',
  buttonSecondary: '#f39c12',
  buttonReset: '#95a5a6',
};

export const darkColors = {
  background: '#121212',
  text: '#FFFFFF',
  primaryText: '#F5F5F5',
  secondaryText: '#AAAAAA',
  accent: '#3498db',
  border: '#333333',
  card: '#1E1E1E',
  statusBar: 'light',
  timerWorkBg: '#c0392b',
  timerBreakBg: '#2980b9',
  timerLongBreakBg: '#8e44ad',
  buttonPrimary: '#27ae60',
  buttonSecondary: '#d35400',
  buttonReset: '#7f8c8d',
};

export const createThemeStyles = (isDarkMode: boolean) => {
  const colors = isDarkMode ? darkColors : lightColors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
    },
    primaryText: {
      color: colors.primaryText,
      fontSize: 16,
    },
    secondaryText: {
      color: colors.secondaryText,
      fontSize: 14,
    },
    headerText: {
      color: colors.primaryText,
      fontSize: 24,
      fontWeight: 'bold',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      shadowColor: isDarkMode ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputBackground: {
      backgroundColor: isDarkMode ? '#2C2C2C' : '#F8F8F8',
      borderColor: colors.border,
    },
    buttonPrimary: {
      backgroundColor: colors.buttonPrimary,
    },
    buttonSecondary: {
      backgroundColor: colors.buttonSecondary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });
}; 