import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface ProfileScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

export const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.logoutError'));
    }
  };

  return (
    <Container useScrollView={false}>
      <View style={styles.container}>
        <Text style={[
          styles.title,
          isDarkMode && styles.darkTitle
        ]}>{t('profile.title')}</Text>
        
        <View style={[
          styles.userInfo,
          isDarkMode && styles.darkUserInfo
        ]}>
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>{t('profile.email')}</Text>
          <Text style={[
            styles.value,
            isDarkMode && styles.darkValue
          ]}>{user?.email || t('profile.userInfoNotLoaded')}</Text>
          
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>{t('profile.name')}</Text>
          <Text style={[
            styles.value,
            isDarkMode && styles.darkValue
          ]}>{user?.user_metadata?.name || t('profile.nameNotFound')}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title={t('profile.settings')}
            onPress={() => navigation.navigate('Settings')}
            variant="outline"
          />
          
          <View style={styles.spacer} />
          
          <Button
            title={t('auth.signOut')}
            onPress={handleSignOut}
            variant="secondary"
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
  userInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  darkUserInfo: {
    backgroundColor: '#2C2C2C',
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  darkLabel: {
    color: '#95a5a6',
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
    color: '#2c3e50',
  },
  darkValue: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  spacer: {
    height: 16,
  },
}); 