import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Input, LanguageSwitcher } from '../../components/common';
import { getUserSettings, updateUserSettings } from '../../services/settings';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserSettings } from '../../types/settings';
import { useTranslation } from 'react-i18next';
import { changePassword } from '../../services/auth';

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode, setThemeMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    darkMode: isDarkMode, // Her zaman güncel tema modunu kullan
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  // isDarkMode değiştiğinde settings'i güncelle
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode
    }));
  }, [isDarkMode]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await getUserSettings(user.id);
      
      if (result.data) {
        const userSettings = result.data;
        setSettings({
          notificationsEnabled: userSettings.notifications_enabled,
          darkMode: userSettings.dark_mode !== undefined ? userSettings.dark_mode : isDarkMode
        });
        
        // Eğer dark_mode değeri undefined değilse o zaman temayı güncelle
        if (userSettings.dark_mode !== undefined) {
          setThemeMode(userSettings.dark_mode ? 'dark' : 'light');
        }
      }
      
      setSettingsLoaded(true);
    } catch (error) {
      console.error(t('settings.settingsLoadError'), error);
      // Hata durumunda da yüklendi olarak işaretle
      setSettingsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const updatedSettings: Partial<UserSettings> = {
        notifications_enabled: settings.notificationsEnabled,
        dark_mode: settings.darkMode,
      };
      
      const { error } = await updateUserSettings(user.id, updatedSettings);
      
      if (error) {
        throw error;
      }
      
      // Tema değişikliğini hemen uygula
      setThemeMode(settings.darkMode ? 'dark' : 'light');
      
      Alert.alert(t('common.success'), t('settings.saveSuccess'));
      navigation.goBack();
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error);
      Alert.alert(t('common.error'), t('settings.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDarkModeToggle = (value: boolean) => {
    setSettings({ ...settings, darkMode: value });
    // Değişikliği hemen uygula
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleChangePassword = async () => {
    // Form doğrulama
    setPasswordError('');
    
    if (!passwordForm.newPassword) {
      setPasswordError(t('auth.passwordRequired'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('auth.passwordMinLength'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordsMatch'));
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await changePassword(passwordForm.newPassword);
      
      if (error) throw error;
      
      // Başarılı
      Alert.alert(t('common.success'), t('auth.passwordChanged'));
      
      // Form temizle
      setPasswordForm({
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.passwordChangeError'));
      console.error('Password change error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Ayarlar yüklenene kadar yükleniyor göster
  if (!settingsLoaded) {
    return (
      <Container useScrollView={true}>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            {t('common.loading')}
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container useScrollView={true}>
      <View style={styles.container}>
        <Text style={[
          styles.title,
          isDarkMode && styles.darkTitle
        ]}>{t('settings.title')}</Text>

        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>Language / Dil</Text>
        <LanguageSwitcher />

        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>{t('settings.generalSettings')}</Text>
        <View style={[
          styles.switchContainer,
          isDarkMode && styles.darkSwitchContainer
        ]}>
          <Text style={[
            styles.switchLabel,
            isDarkMode && styles.darkSwitchLabel
          ]}>{t('settings.notificationsEnabled')}</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) => setSettings({ ...settings, notificationsEnabled: value })}
          />
        </View>
        
        <View style={[
          styles.switchContainer,
          isDarkMode && styles.darkSwitchContainer
        ]}>
          <Text style={[
            styles.switchLabel,
            isDarkMode && styles.darkSwitchLabel
          ]}>{t('settings.darkMode')}</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={handleDarkModeToggle}
          />
        </View>

        {/* Şifre Değiştirme Bölümü */}
        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>{t('settings.securitySettings')}</Text>
        
        <View style={styles.inputGroup}>
          <Input
            label={t('auth.newPassword')}
            placeholder={t('auth.enterNewPassword')}
            secureTextEntry
            value={passwordForm.newPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
            error={passwordError}
          />
          
          <Input
            label={t('auth.confirmNewPassword')}
            placeholder={t('auth.confirmYourPassword')}
            secureTextEntry
            value={passwordForm.confirmPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
          />
          
          <Button
            title={t('auth.changePassword')}
            onPress={handleChangePassword}
            isLoading={isChangingPassword}
            disabled={isChangingPassword}
            variant="outline"
            style={styles.passwordButton}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={t('settings.saveChanges')}
            onPress={handleSave}
            isLoading={isLoading}
            disabled={isLoading}
          />
          
          <View style={styles.spacer} />
          
          <Button
            title={t('common.cancel')}
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#2c3e50',
  },
  darkText: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2c3e50',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#2c3e50',
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkSwitchContainer: {
    borderBottomColor: '#333333',
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  darkSwitchLabel: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  spacer: {
    height: 16,
  },
  passwordButton: {
    marginTop: 16,
  },
});