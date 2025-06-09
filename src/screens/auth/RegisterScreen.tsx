import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';
import { Container, Button, Input } from '../../components/common';
import { signUp } from '../../services/auth';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const registerValidationSchema = Yup.object().shape({
    name: Yup.string().required(t('auth.nameRequired')),
    email: Yup.string()
      .email(t('auth.validEmail'))
      .required(t('auth.emailRequired')),
    password: Yup.string()
      .min(8, t('auth.passwordMinLength'))
      .required(t('auth.passwordRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], t('auth.passwordsMatch'))
      .required(t('auth.confirmPasswordRequired')),
  });

  const initialValues: RegisterFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const { data, error } = await signUp(values.email, values.password, values.name);
      
      if (error) {
        Alert.alert(t('auth.registerError'), error.toString());
        return;
      }
      
      Alert.alert(
        t('auth.registrationSuccess'),
        t('auth.registrationMessage'),
        [{ text: t('common.done'), onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container useScrollView={false}>
      <View style={styles.container}>
        <Text style={[
          styles.title,
          isDarkMode && styles.darkTitle
        ]}>{t('auth.signUp')}</Text>
        <Text style={[
          styles.subtitle,
          isDarkMode && styles.darkSubtitle
        ]}>{t('auth.welcome')}</Text>

        <Formik
          initialValues={initialValues}
          validationSchema={registerValidationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              <Input
                label={t('auth.name')}
                placeholder={t('auth.enterName')}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
                error={errors.name}
                touched={touched.name}
                autoCapitalize="words"
              />

              <Input
                label={t('auth.email')}
                placeholder={t('auth.enterEmail')}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                error={errors.email}
                touched={touched.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.enterPassword')}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                error={errors.password}
                touched={touched.password}
                secureTextEntry
              />

              <Input
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmYourPassword')}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                value={values.confirmPassword}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                secureTextEntry
              />

              <Button
                title={t('auth.signUp')}
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading}
              />
            </View>
          )}
        </Formik>

        <View style={styles.footer}>
          <Text style={[
            styles.footerText,
            isDarkMode && styles.darkFooterText
          ]}>{t('auth.alreadyHaveAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[
              styles.footerLink,
              isDarkMode && styles.darkLinkText
            ]}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 32,
    textAlign: 'center',
  },
  darkSubtitle: {
    color: '#95a5a6',
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#7f8c8d',
    marginRight: 4,
  },
  darkFooterText: {
    color: '#95a5a6',
  },
  footerLink: {
    color: '#3498db',
    fontWeight: '600',
  },
  darkLinkText: {
    color: '#5dade2',
  },
}); 