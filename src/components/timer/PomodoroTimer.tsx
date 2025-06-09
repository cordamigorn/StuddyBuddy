import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { CircularProgressBar } from './CircularProgressBar';
import { Text, Badge, Surface, Chip } from 'react-native-paper';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';

type TimerType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  workDuration: number; // dakika
  shortBreakDuration: number; // dakika
  longBreakDuration: number; // dakika
  longBreakInterval: number; // kaç pomodoro'dan sonra uzun mola
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void; // isRunning durumunu kontrol eden fonksiyon
  autoMode?: boolean;
  size?: number; // CircularProgressBar için boyut
  onTimerComplete: (type: TimerType) => void;
  onSessionComplete?: () => void; // Tam bir çalışma-mola döngüsü tamamlandığında çağrılacak callback
}

export interface PomodoroTimerRef {
  reset: () => void;
}

export const PomodoroTimer = forwardRef<PomodoroTimerRef, PomodoroTimerProps>(({
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  longBreakInterval,
  isRunning,
  setIsRunning,
  autoMode = false,
  size = 250,
  onTimerComplete,
  onSessionComplete,
}, ref) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const [timerType, setTimerType] = useState<TimerType>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // saniye cinsinden
  const [currentDuration, setCurrentDuration] = useState(workDuration * 60);
  
  const progress = useSharedValue(1);
  const timerTypeRef = useRef(timerType);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Timer tipi değiştiğinde referansı güncelle
  useEffect(() => {
    timerTypeRef.current = timerType;
  }, [timerType]);

  const getTimerTypeColor = (type: TimerType) => {
    switch (type) {
      case 'work':
        return isDarkMode 
          ? ['#4FC3F7', '#00B0FF', '#0091EA'] // Focus modu - mavi gradyan
          : ['#4FC3F7', '#00B0FF', '#0091EA'];
      case 'shortBreak':
        return isDarkMode 
          ? ['#81C784', '#66BB6A', '#43A047'] // Kısa mola - yeşil gradyan
          : ['#81C784', '#66BB6A', '#43A047'];
      case 'longBreak':
        return isDarkMode 
          ? ['#9575CD', '#7E57C2', '#673AB7'] // Uzun mola - mor gradyan
          : ['#9575CD', '#7E57C2', '#673AB7'];
    }
  };

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    lastTimeRef.current = null;
  }, []);

  // Reset fonksiyonu
  const resetTimerFunction = useCallback(() => {
    stopTimer();
    setTimerType('work');
    setPomodoroCount(0);
    setTimeLeft(workDuration * 60);
    setCurrentDuration(workDuration * 60);
    progress.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
  }, [workDuration, stopTimer, progress]);

  // Bileşen referansını expose et
  useImperativeHandle(ref, () => ({
    reset: resetTimerFunction
  }), [resetTimerFunction]);

  // Zamanlayıcı tipine göre süreyi ayarla
  useEffect(() => {
    let duration = 0;
    
    switch (timerType) {
      case 'work':
        duration = workDuration * 60;
        break;
      case 'shortBreak':
        duration = shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = longBreakDuration * 60;
        break;
    }
    
    setTimeLeft(duration);
    setCurrentDuration(duration);
    progress.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
  }, [timerType, workDuration, shortBreakDuration, longBreakDuration, progress]);

  // Timer çalışma veya durma durumu
  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = Date.now();
      
      // Geri sayımı başlat
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const lastTime = lastTimeRef.current || now;
        const deltaSeconds = Math.floor((now - lastTime) / 1000);
        
        if (deltaSeconds >= 1) {
          lastTimeRef.current = now;
          
          setTimeLeft((prevTime) => {
            const newTimeLeft = Math.max(0, prevTime - deltaSeconds);
            
            // Progress değerini güncelle
            const newProgress = newTimeLeft / currentDuration;
            progress.value = withTiming(newProgress, { 
              duration: 300, 
              easing: Easing.linear 
            });
            
            // Zamanlayıcı tamamlandığında
            if (newTimeLeft <= 0) {
              stopTimer();
              onTimerComplete(timerTypeRef.current);
              
              // Manuel modda da session complete'i çağır
              if (timerTypeRef.current === 'work' && onSessionComplete) {
                onSessionComplete();
              }
              
              // Otomatik mod açıksa
              if (autoMode) {
                const isWork = timerTypeRef.current === 'work';
                const isBreak = timerTypeRef.current === 'shortBreak' || timerTypeRef.current === 'longBreak';
                let nextPomodoroCount = pomodoroCount;
                
                // setTimeout ile state güncellemelerini sırala
                setTimeout(() => {
                  // Çalışma oturumu tamamlandığında da session complete'i çağır
                  if (isWork && onSessionComplete) {
                    onSessionComplete();
                  }
                  
                  // Bir çalışma-mola döngüsü tamamlandı mı kontrol et (break -> work geçişi)
                  if (isBreak) {
                    // Mola tamamlandı, yeni çalışma oturumuna geçerken pomodoro sayısını artır
                    nextPomodoroCount = pomodoroCount + 1;
                    setPomodoroCount(nextPomodoroCount);
                    
                    // Çalışma-mola döngüsü tamamlandı, callback'i çağır
                    if (onSessionComplete) {
                      onSessionComplete();
                    }
                  }

                  // Tüm oturumlar tamamlandıysa otomatik modu durdur
                  const shouldStopAuto = nextPomodoroCount >= longBreakInterval && isBreak;
                  
                  if (shouldStopAuto) {
                    // Son oturum tamamlandı, timer'ı sıfırla
                    resetTimerFunction();
                    setPomodoroCount(0);
                    setIsRunning(false);
                    return;
                  }
                  
                  // Oturumlar devam ediyor, timer değişikliği yap
                  if (isWork) {
                    // Uzun mola zamanı mı kontrol et
                    const nextSession = (nextPomodoroCount % longBreakInterval);
                    const isLastSession = nextSession === (longBreakInterval - 1);
                    
                    if (isLastSession) {
                      // Son seanstan sonra uzun mola verilir
                      setTimerType('longBreak');
                    } else {
                      setTimerType('shortBreak');
                    }
                  } else {
                    // Mola tamamlandı, tekrar çalışma moduna geç
                    setTimerType('work');
                  }
                  
                  // Bir sonraki frame'de timer başlat
                  setTimeout(() => {
                    progress.value = 1;
                    setTimeout(() => {
                      setIsRunning(true);
                    }, 50);
                  }, 250);
                }, 500);
              }
              
              return 0;
            }
            
            return newTimeLeft;
          });
        }
      }, 100); // Daha sık kontrol et ama sadece saniye değişiminde güncelle
    } else {
      stopTimer();
    }
    
    return () => {
      stopTimer();
    };
  }, [isRunning, currentDuration, autoMode, stopTimer, onTimerComplete, pomodoroCount, longBreakInterval, onSessionComplete, progress, resetTimerFunction]);

  // Dakika ve saniye formatında gösterme
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return {
      minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
      seconds: seconds < 10 ? `0${seconds}` : `${seconds}`,
    };
  };

  const { minutes, seconds } = formatTime();

  // Timer tipine göre başlık belirleme
  const getTimerTitle = () => {
    switch (timerType) {
      case 'work':
        return t('home.workTime');
      case 'shortBreak':
        return t('home.shortBreak');
      case 'longBreak':
        return t('home.longBreak');
    }
  };

  // Modal için animasyon stilleri
  const modeTextStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isRunning ? 0.8 : 1),
      transform: [{ scale: withTiming(isRunning ? 0.9 : 1) }],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.timerTitleContainer}>
        <Text style={[
          styles.timerTitle, 
          isDarkMode ? styles.timerTitleDark : styles.timerTitleLight
        ]}>
          {getTimerTitle()}
        </Text>
      </View>
      
      <CircularProgressBar 
        progress={progress}
        size={size}
        strokeWidth={8}
        gradientColors={getTimerTypeColor(timerType)}
        bgColor={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        isActive={true}
      >
        <View style={styles.timerContent}>
          <Text style={styles.timeText}>
            {minutes}:{seconds}
          </Text>
          <Text style={[
            styles.timerLabel, 
            isDarkMode ? styles.timerLabelDark : styles.timerLabelLight
          ]}>
            {t('home.focusMode')}
          </Text>
          <Text style={[
            styles.sessionText, 
            isDarkMode ? styles.sessionTextDark : styles.sessionTextLight
          ]}>
            {t('home.currentSession', { current: pomodoroCount + 1, total: longBreakInterval })}
          </Text>
        </View>
      </CircularProgressBar>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTitleContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  timerTitleLight: {
    color: '#fff',
    backgroundColor: 'rgba(52, 152, 219, 0.7)',
  },
  timerTitleDark: {
    color: '#fff',
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  timerLabelLight: {
    color: '#ecf0f1',
  },
  timerLabelDark: {
    color: '#ecf0f1',
  },
  sessionText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 3,
  },
  sessionTextLight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sessionTextDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  percentageText: {
    fontSize: 24,
    color: 'white',
  },
}); 