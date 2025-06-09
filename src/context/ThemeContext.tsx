import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { updateUserSettings } from '../services/settings';
import { useAuth } from './AuthContext';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { user } = useAuth();
  const deviceColorScheme = useColorScheme();
  const [themeMode, setTheme] = useState<ThemeMode>(deviceColorScheme as ThemeMode || 'light');

  useEffect(() => {
    // AsyncStorage'dan modu yükle
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTheme !== null) {
          setTheme(storedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // StatusBar'ı güncelle
  useEffect(() => {
    StatusBar.setBarStyle(themeMode === 'dark' ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(themeMode === 'dark' ? '#121212' : '#FFFFFF');
    }
  }, [themeMode]);

  // Tema değişikliğini kaydet
  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      
      // Kullanıcı giriş yapmışsa veritabanına kaydet
      if (user) {
        await updateUserSettings(user.id, {
          dark_mode: mode === 'dark'
        });
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Tema değiştir
  const setThemeMode = async (mode: ThemeMode) => {
    setTheme(mode);
    await saveThemePreference(mode);
  };

  // Tema modunu tersine çevir
  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setTheme(newMode);
    await saveThemePreference(newMode);
  };

  const value = {
    themeMode,
    isDarkMode: themeMode === 'dark',
    toggleTheme,
    setThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 