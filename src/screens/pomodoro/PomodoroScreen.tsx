import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container } from '../../components/common/Container';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUserSettings } from '../../services/settings';
import { HomeStackParamList } from '../../navigation/AppNavigator';

type PomodoroScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Pomodoro'>;
};

export const PomodoroScreen = ({ navigation }: PomodoroScreenProps) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [timer, setTimer] = useState(25 * 60); // 25 dakika varsayılan
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Kullanıcı ayarlarını yükle
    loadSettings();
    
    // Temizleme işlemleri
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const result = await getUserSettings(user.id);
      
      if (result.data) {
        const userSettings = result.data;
        setSettings({
          workDuration: userSettings.work_duration,
          shortBreakDuration: userSettings.short_break_duration,
          longBreakDuration: userSettings.long_break_duration,
          longBreakInterval: userSettings.long_break_interval
        });
        
        // Eğer zamanlayıcı aktif değilse, çalışma süresi olarak ayarla
        if (!isActive) {
          setTimer(userSettings.work_duration * 60);
        }
      }
    } catch (error) {
      console.error('Settings loading error:', error);
    }
  };
  
  const toggleTimer = () => {
    if (isActive) {
      // Durdur
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Başlat
      intervalRef.current = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            // Zamanlayıcı tamamlandı
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // Pomodoro veya mola tamamlandı
            if (!isBreak) {
              // Pomodoro tamamlandı, molaya geç
              const newPomodoroCount = pomodoroCount + 1;
              setPomodoroCount(newPomodoroCount);
              
              // Uzun mola zamanı mı kontrol et
              const isLongBreak = newPomodoroCount % settings.longBreakInterval === 0;
              const breakDuration = isLongBreak ? 
                settings.longBreakDuration : 
                settings.shortBreakDuration;
              
              setIsBreak(true);
              setIsActive(false);
              return breakDuration * 60;
            } else {
              // Mola tamamlandı, Pomodoro'ya geç
              setIsBreak(false);
              setIsActive(false);
              return settings.workDuration * 60;
            }
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsActive(false);
    setTimer(isBreak ? 
      (pomodoroCount % settings.longBreakInterval === 0 ? 
        settings.longBreakDuration * 60 : 
        settings.shortBreakDuration * 60) : 
      settings.workDuration * 60
    );
  };
  
  const skipToNext = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsActive(false);
    
    if (isBreak) {
      // Moladan çalışmaya geç
      setIsBreak(false);
      setTimer(settings.workDuration * 60);
    } else {
      // Çalışmadan molaya geç
      const newPomodoroCount = pomodoroCount + 1;
      setPomodoroCount(newPomodoroCount);
      
      const isLongBreak = newPomodoroCount % settings.longBreakInterval === 0;
      const breakDuration = isLongBreak ? 
        settings.longBreakDuration : 
        settings.shortBreakDuration;
      
      setIsBreak(true);
      setTimer(breakDuration * 60);
    }
  };
  
  // Zamanı formatla
  const formatTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <Container useScrollView={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>
            {isBreak ? t('pomodoro.breakTime') : t('pomodoro.focusTime')}
          </Text>
          
          <Text style={[styles.subtitle, isDarkMode && styles.darkSubtext]}>
            {isBreak ? 
              (pomodoroCount % settings.longBreakInterval === 0 ? 
                t('pomodoro.longBreak') : 
                t('pomodoro.shortBreak')) : 
              t('pomodoro.workSession')}
          </Text>
        </View>
        
        <View 
          style={[
            styles.timerContainer, 
            isBreak ? styles.breakTimerContainer : styles.workTimerContainer,
            isDarkMode && (isBreak ? styles.darkBreakTimerContainer : styles.darkWorkTimerContainer)
          ]}
        >
          <Text style={styles.timerText}>{formatTime()}</Text>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]} 
            onPress={resetTimer}
          >
            <Ionicons name="refresh" size={24} color="#ecf0f1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.mainButton, isActive ? styles.pauseButton : styles.playButton]} 
            onPress={toggleTimer}
          >
            <Ionicons 
              name={isActive ? "pause" : "play"} 
              size={32} 
              color="#ecf0f1" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.skipButton]} 
            onPress={skipToNext}
          >
            <Ionicons name="play-skip-forward" size={24} color="#ecf0f1" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
              {pomodoroCount}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSubtext]}>
              {t('pomodoro.completedCount')}
            </Text>
          </View>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  darkText: {
    color: '#ecf0f1',
  },
  darkSubtext: {
    color: '#bdc3c7',
  },
  timerContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  workTimerContainer: {
    backgroundColor: '#3498db',
  },
  breakTimerContainer: {
    backgroundColor: '#2ecc71',
  },
  darkWorkTimerContainer: {
    backgroundColor: '#2980b9',
  },
  darkBreakTimerContainer: {
    backgroundColor: '#27ae60',
  },
  timerText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  playButton: {
    backgroundColor: '#27ae60',
  },
  pauseButton: {
    backgroundColor: '#e67e22',
  },
  resetButton: {
    backgroundColor: '#7f8c8d',
  },
  skipButton: {
    backgroundColor: '#7f8c8d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
}); 