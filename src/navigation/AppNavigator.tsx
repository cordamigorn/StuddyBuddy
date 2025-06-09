import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { HomeScreen } from '../screens/home/HomeScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { StatsScreen } from '../screens/stats/StatsScreen';
import { useTheme } from '../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type TasksStackParamList = {
  Tasks: undefined;
  TaskForm: {
    taskId?: string;
    task?: any;
  };
};

// Tasks Stack Navigator
const TasksStack = createStackNavigator<TasksStackParamList>();
export const TasksStackNavigator = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  return (
    <TasksStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f8f8',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#333333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <TasksStack.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ title: t('navigation.tasks') }} 
      />
      <TasksStack.Screen 
        name="TaskForm" 
        component={TaskFormScreen} 
        options={({ route }: { route: any }) => ({ 
          title: route.params?.taskId 
            ? t('tasks.editTask') 
            : t('tasks.newTask') 
        })} 
      />
    </TasksStack.Navigator>
  );
};

export const AppNavigator = () => {
  const Tab = createBottomTabNavigator();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDarkMode ? '#3498db' : '#2980b9',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksStackNavigator}
        options={{ tabBarLabel: t('navigation.tasks') }} 
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ tabBarLabel: t('navigation.stats') }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: t('navigation.settings') }} 
      />
    </Tab.Navigator>
  );
}; 