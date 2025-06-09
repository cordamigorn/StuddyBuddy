import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = true,
  style,
  ...props
}: ButtonProps) => {
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        isDarkMode && styles[`dark${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? (isDarkMode ? '#5dade2' : '#3498db') : '#fff'} />
      ) : (
        <Text style={[
          styles.text, 
          styles[`${variant}Text`],
          isDarkMode && styles[`dark${variant.charAt(0).toUpperCase() + variant.slice(1)}Text`]
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: '#3498db',
  },
  secondary: {
    backgroundColor: '#95a5a6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  darkPrimary: {
    backgroundColor: '#2980b9',
  },
  darkSecondary: {
    backgroundColor: '#7f8c8d',
  },
  darkOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#5dade2',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#3498db',
  },
  darkOutlineText: {
    color: '#5dade2',
  },
  darkPrimaryText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#fff',
  },
}); 