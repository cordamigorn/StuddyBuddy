import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from '../screens/auth';
import { ProfileScreen, SettingsScreen } from '../screens/profile';
import { HomeScreen } from '../screens/home';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Tema renkleri
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2c3e50',
    border: '#f0f0f0',
    notification: '#e74c3c',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#2980b9',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#c0392b',
  },
};

// Tip tanımlamaları
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Stats: undefined;
  ProfileStack: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskForm: { task?: any } | undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

// Stack ve Tab navigatör oluşturma
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Tasks Stack Navigator
const TasksStackNavigator = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <TasksStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#2c3e50',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <TasksStack.Screen
        name="TasksList"
        component={TasksScreen}
        options={{ title: t('tasks.title') }}
      />
      <TasksStack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={({ route }) => ({ 
          title: route.params?.task 
            ? t('tasks.editTask') 
            : t('tasks.addTask') 
        })}
      />
    </TasksStack.Navigator>
  );
};

// Ana Navigasyon Yapısı
export const Navigation = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? CustomDarkTheme : LightTheme;

  return (
    <NavigationContainer 
      theme={theme}
      documentTitle={{
        formatter: (options, route) => 
          options?.title ?? route?.name ?? 'StuddyBuddy'
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

// Root Navigator (Auth veya Main ekranları arasında geçiş)
const RootNavigator = () => {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();

  // Kimlik doğrulama kontrolü yapılana kadar loading ekranı göster
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' 
      }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#2980b9' : '#3498db'} />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// Auth Navigator (Login, Register, ForgotPassword)
const AuthNavigator = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#2c3e50',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: t('auth.signIn') }} 
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: t('auth.signUp') }} 
      />
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ title: t('auth.forgotPassword') }} 
      />
    </AuthStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#2c3e50',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: t('profile.title') }} 
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: t('settings.title') }} 
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator (Home, Tasks, Stats, Profile)
const MainNavigator = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#2c3e50',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#333333' : '#f0f0f0',
        },
        tabBarActiveTintColor: isDarkMode ? '#2980b9' : '#3498db',
        tabBarInactiveTintColor: isDarkMode ? '#95a5a6' : '#7f8c8d',
        tabBarHideOnKeyboard: true,
      }}
      detachInactiveScreens={false}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ) 
        }} 
      />
      <MainTab.Screen 
        name="Tasks" 
        component={TasksStackNavigator}
        options={{ 
          title: t('navigation.tasks'),
          headerShown: false, 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          )
        }} 
      />
      <MainTab.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ 
          title: t('navigation.stats'),
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ) 
        }} 
      />
      <MainTab.Screen 
        name="ProfileStack" 
        component={ProfileStackNavigator}
        options={{ 
          title: t('navigation.profile'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }} 
      />
    </MainTab.Navigator>
  );
}; 