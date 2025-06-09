import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
}

export const Input = ({
  label,
  error,
  touched,
  style,
  ...props
}: InputProps) => {
  const hasError = !!error && touched;
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[
        styles.label, 
        isDarkMode && styles.darkLabel
      ]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.darkInput,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={isDarkMode ? '#999999' : '#95a5a6'}
        {...props}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#2c3e50',
    fontWeight: '500',
  },
  darkLabel: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#f9f9f9',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#2c3e50',
  },
  darkInput: {
    backgroundColor: '#333333',
    borderColor: '#555555',
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
}); 