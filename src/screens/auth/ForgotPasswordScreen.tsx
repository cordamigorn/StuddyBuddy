import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';
import { Container, Button, Input } from '../../components/common';
import { resetPassword } from '../../services/auth';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const forgotPasswordValidationSchema = Yup.object().shape({
    email: Yup.string()
      .email(t('auth.validEmail'))
      .required(t('auth.emailRequired')),
  });

  const initialValues: ForgotPasswordFormValues = {
    email: '',
  };

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { data, error } = await resetPassword(values.email);
      
      if (error) {
        Alert.alert(t('auth.resetPasswordError'), error.toString());
        return;
      }
      
      setIsSuccess(true);
      Alert.alert(
        t('auth.resetPasswordSuccess'),
        t('auth.resetPasswordMessage'),
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
        ]}>{t('auth.forgotPassword')}</Text>
        <Text style={[
          styles.subtitle,
          isDarkMode && styles.darkSubtitle
        ]}>
          {t('auth.resetPassword')}
        </Text>

        <Formik
          initialValues={initialValues}
          validationSchema={forgotPasswordValidationSchema}
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
                label={t('auth.email')}
                placeholder={t('auth.enterEmail')}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                error={errors.email}
                touched={touched.email}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSuccess}
              />

              <Button
                title={t('auth.resetPassword')}
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading || isSuccess}
              />
            </View>
          )}
        </Formik>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[
              styles.footerLink,
              isDarkMode && styles.darkFooterLink
            ]}>{t('auth.backToLogin')}</Text>
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
    alignItems: 'center',
    marginTop: 16,
  },
  footerLink: {
    color: '#3498db',
    fontWeight: '600',
  },
  darkFooterLink: {
    color: '#5dade2',
  },
}); 