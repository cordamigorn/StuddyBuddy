import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: any;
  padded?: boolean;
  useScrollView?: boolean;
}

export const Container = ({
  children,
  scrollable = true,
  style,
  padded = true,
  useScrollView = false,
}: ContainerProps) => {
  const { isDarkMode } = useTheme();
  const ContainerComponent = !useScrollView ? View : (scrollable ? ScrollView : View);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode ? styles.darkSafeArea : styles.lightSafeArea,
        {marginTop: -50}
      ]}
      edges={['top']}
    >
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#121212' : '#FFFFFF'} 
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ContainerComponent
          contentContainerStyle={useScrollView ? [
            scrollable && styles.scrollContent,
            padded && styles.padded,
            style,
          ] : undefined}
          style={[
            styles.container,
            !useScrollView && padded && styles.padded,
            !useScrollView && style,
            isDarkMode && styles.darkContainer,
            {marginTop: -10}
          ]}
        >
          {children}
        </ContainerComponent>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  lightSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  darkSafeArea: {
    backgroundColor: '#121212',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: 0,
  },
}); 