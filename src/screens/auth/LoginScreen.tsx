import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { useTheme } from '../../context/ThemeContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert(t('auth.error'), error.message || t('auth.signInError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container useScrollView={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.welcomeContainer}>
          <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
            {t('auth.welcome')}
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
            {t('auth.signInToContinue')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotPasswordText, isDarkMode && styles.darkLinkText]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <Button
            title={loading ? '' : t('auth.signIn')}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" />}
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDarkMode && styles.darkText]}>
            {t('auth.noAccount')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.signupText, isDarkMode && styles.darkLinkText]}>
              {t('auth.signUp')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  welcomeContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  darkSubtitle: {
    color: '#bdc3c7',
  },
  formContainer: {
    width: '100%',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
  },
  darkLinkText: {
    color: '#2980b9',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
    marginRight: 5,
  },
  darkText: {
    color: '#bdc3c7',
  },
  signupText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 