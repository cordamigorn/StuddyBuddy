import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState, AppStateStatus, Modal, TextInput, Switch, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container } from '../../components/common';
import { PomodoroTimer, PomodoroTimerRef } from '../../components/timer';
import { getUserSettings, updateUserSettings } from '../../services/settings';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useKeepAwake } from 'expo-keep-awake';
import { configureNotifications, sendTimerCompletionNotification } from '../../services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { getTasks, incrementCompletedPomodoros, setActiveTask as markTaskAsActive, checkAndCompleteTask } from '../../services/tasks';
import { Task } from '../../types/task';
import { LinearGradient } from 'expo-linear-gradient';
import { Provider as PaperProvider, Surface, Text as PaperText, Appbar, Avatar, Card, FAB, Portal, Dialog, Button as PaperButton, IconButton, Divider, ActivityIndicator } from 'react-native-paper';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

// Timer Ayarları Modalı
const TimerSettingsModal = React.memo(({ 
  visible, 
  onClose, 
  settings, 
  onSave,
  onReset,
  isDarkMode
}: { 
  visible: boolean; 
  onClose: () => void; 
  settings: any; 
  onSave: (settings: any) => void;
  onReset: () => void;
  isDarkMode: boolean;
}) => {
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState({
    workMinutes: Math.floor(settings.workDuration).toString(),
    workSeconds: Math.round((settings.workDuration % 1) * 60).toString(),
    shortBreakMinutes: Math.floor(settings.shortBreakDuration).toString(),
    shortBreakSeconds: Math.round((settings.shortBreakDuration % 1) * 60).toString(),
    longBreakMinutes: Math.floor(settings.longBreakDuration).toString(),
    longBreakSeconds: Math.round((settings.longBreakDuration % 1) * 60).toString(),
    longBreakInterval: settings.longBreakInterval.toString()
  });

  const handleSave = () => {
    // Dakika ve saniyeleri toplam dakika değerine çevir
    const workMinutes = parseInt(localSettings.workMinutes) || 0;
    const workSeconds = parseInt(localSettings.workSeconds) || 0;
    const shortBreakMinutes = parseInt(localSettings.shortBreakMinutes) || 0;
    const shortBreakSeconds = parseInt(localSettings.shortBreakSeconds) || 0;
    const longBreakMinutes = parseInt(localSettings.longBreakMinutes) || 0;
    const longBreakSeconds = parseInt(localSettings.longBreakSeconds) || 0;
    
    const workDuration = workMinutes + (workSeconds / 60);
    const shortBreakDuration = shortBreakMinutes + (shortBreakSeconds / 60);
    const longBreakDuration = longBreakMinutes + (longBreakSeconds / 60);
    const longBreakInterval = parseInt(localSettings.longBreakInterval) || 4;

    onSave({
      workDuration: workDuration || 25, // Minimum 1 dakika
      shortBreakDuration: shortBreakDuration || 5,
      longBreakDuration: longBreakDuration || 15,
      longBreakInterval: longBreakInterval
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                {t('home.timerSettings')}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>
                {t('settings.workDuration')}
              </Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.workMinutes}
                  onChangeText={(text) => setLocalSettings({...localSettings, workMinutes: text})}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="25"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>dk</Text>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.workSeconds}
                  onChangeText={(text) => setLocalSettings({...localSettings, workSeconds: text})}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>sn</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>
                {t('settings.shortBreakDuration')}
              </Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.shortBreakMinutes}
                  onChangeText={(text) => setLocalSettings({...localSettings, shortBreakMinutes: text})}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="5"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>dk</Text>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.shortBreakSeconds}
                  onChangeText={(text) => setLocalSettings({...localSettings, shortBreakSeconds: text})}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>sn</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>
                {t('settings.longBreakDuration')}
              </Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.longBreakMinutes}
                  onChangeText={(text) => setLocalSettings({...localSettings, longBreakMinutes: text})}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="15"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>dk</Text>
                <TextInput
                  style={[styles.timeInput, isDarkMode && styles.darkTimeInput]}
                  value={localSettings.longBreakSeconds}
                  onChangeText={(text) => setLocalSettings({...localSettings, longBreakSeconds: text})}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
                />
                <Text style={[styles.timeUnit, isDarkMode && styles.darkText]}>sn</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>
                {t('settings.longBreakInterval')}
              </Text>
              <TextInput
                style={[styles.intervalInput, isDarkMode && styles.darkTimeInput]}
                value={localSettings.longBreakInterval}
                onChangeText={(text) => setLocalSettings({...localSettings, longBreakInterval: text})}
                keyboardType="numeric"
                maxLength={2}
                placeholder="4"
                placeholderTextColor={isDarkMode ? "#555" : "#ccc"}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.resetButton, isDarkMode && styles.resetButtonDark]} 
                onPress={onReset}
              >
                <Text style={[styles.resetButtonText, isDarkMode && styles.darkText]}>
                  {t('settings.resetToDefault')}
                </Text>
              </TouchableOpacity>
              <Button
                title={t('common.save')}
                onPress={handleSave}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// Görev Seçim Modalı
const TaskSelectionModal = React.memo(({
  visible,
  onClose,
  tasks,
  onSelectTask,
  isDarkMode,
  navigation
}: {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  isDarkMode: boolean;
  navigation: NativeStackNavigationProp<any>;
}) => {
  const { t } = useTranslation();
  const incompleteTasks = tasks.filter(task => !task.completed);

  const renderTaskItem = ({ item }: { item: Task }) => {
    return (
      <TouchableOpacity
        style={[styles.taskItem, isDarkMode && styles.darkTaskItem]}
        onPress={() => onSelectTask(item)}
      >
        <View>
          <Text style={[styles.itemTitle, isDarkMode && styles.darkText]}>
            {item.title}
          </Text>
          <Text style={[styles.itemProgress, isDarkMode && styles.darkText]}>
            {`${item.completed_pomodoros}/${item.estimated_pomodoros} ${t('stats.pomodoros')}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
        <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
              {t('tasks.selectTask')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          {incompleteTasks.length === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <Text style={[styles.emptyTasksText, isDarkMode && styles.darkText]}>
                {t('tasks.noTasks')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={incompleteTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              style={styles.taskList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [taskSelectionModalVisible, setTaskSelectionModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const timerRef = useRef<PomodoroTimerRef>(null);
  const appState = useRef(AppState.currentState);

  const defaultSettings = {
    workDuration: 25, // dakika
    shortBreakDuration: 5, // dakika
    longBreakDuration: 15, // dakika
    longBreakInterval: 4,
  };

  const [timerSettings, setTimerSettings] = useState(defaultSettings);

  // Timer çalışırken ekranın uyanık kalmasını sağla
  useKeepAwake();

  // Her ekran odaklandığında çalışacak useCallback ile paketlenmiş fonksiyon
  useFocusEffect(
    useCallback(() => {
      loadUserTasks();
      
      return () => {
        // Ekrandan çıkıldığında cleanup
      };
    }, [user])
  );

  useEffect(() => {
    loadSettings();
    setupNotifications();
    loadUserTasks(); // Kullanıcının görevlerini yükle

    // Uygulama durumunu takip et
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Bildirimleri yapılandır
  const setupNotifications = async () => {
    const enabled = await configureNotifications();
    setNotificationsEnabled(enabled);
  };

  // App state değiştiğinde, örneğin arka plandan öne geldiğinde
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Uygulama arka plandan öne getirildi, timer devam ediyor olabilir
      console.log('App has come to the foreground!');
    }
    
    appState.current = nextAppState;
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await getUserSettings(user.id);
      
      if (result.data) {
        const userSettings = result.data;
        setTimerSettings({
          workDuration: userSettings.work_duration, // dakika
          shortBreakDuration: userSettings.short_break_duration, // dakika
          longBreakDuration: userSettings.long_break_duration, // dakika
          longBreakInterval: userSettings.long_break_interval,
        });
      }
    } catch (error) {
      console.error('Settings yüklenirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimerComplete = async (type: 'work' | 'shortBreak' | 'longBreak') => {
    // Zamanlayıcı tamamlandığında çalışmayı durdur
    setIsRunning(false);
    
    // Zamanlayıcı tamamlandığında bildirim gönder
    if (notificationsEnabled) {
      await sendTimerCompletionNotification(type);
    }
    console.log(`${type} timer completed`);
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    // Timer'ı ref üzerinden sıfırla
    if (timerRef.current) {
      timerRef.current.reset();
    }
  };

  const saveTimerSettings = async (newSettings: any) => {
    if (!user) return;
    
    setTimerSettings(newSettings);
    setSettingsModalVisible(false);
    
    // Timer'ı sıfırla
    resetTimer();
    
    // Ayarları veritabanına kaydet
    try {
      await updateUserSettings(user.id, {
        work_duration: newSettings.workDuration,
        short_break_duration: newSettings.shortBreakDuration,
        long_break_duration: newSettings.longBreakDuration,
        long_break_interval: newSettings.longBreakInterval
      });
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error);
    }
  };

  const resetToDefaultSettings = () => {
    setTimerSettings(defaultSettings);
    setSettingsModalVisible(false);
    
    // Timer'ı sıfırla
    resetTimer();
    
    // Varsayılan ayarları veritabanına kaydet
    if (user) {
      try {
        updateUserSettings(user.id, {
          work_duration: defaultSettings.workDuration,
          short_break_duration: defaultSettings.shortBreakDuration,
          long_break_duration: defaultSettings.longBreakDuration,
          long_break_interval: defaultSettings.longBreakInterval
        });
      } catch (error) {
        console.error('Varsayılan ayarlar kaydedilemedi:', error);
      }
    }
  };

  const toggleAutoMode = () => {
    setAutoModeEnabled(prev => !prev);
    
    // Auto mode değiştiğinde zamanlayıcıyı sıfırlama
    if (isRunning) {
      // Çalışıyorsa önce durdur
      setIsRunning(false);
      
      // Kısa bir gecikme ile timer'ı sıfırla
      setTimeout(() => {
        if (timerRef.current) {
          timerRef.current.reset();
        }
      }, 100);
    }
  };

  // Görevleri yükle
  const loadUserTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getTasks(user.id);
      if (error) throw error;
      
      if (data) {
        setUserTasks(data);
        
        // Tamamlanmamış ve aktif bir görev varsa seç
        const activeTask = data.find(task => !task.completed && task.active);
        if (activeTask) {
          setActiveTask(activeTask);
        }
      }
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    }
  };

  const handleSessionComplete = async () => {
    // Aktif görev varsa tamamlanan pomodoro sayısını artır
    if (activeTask) {
      try {
        // Pomodoro sayısını artır
        const { error } = await incrementCompletedPomodoros(activeTask.id);
        if (error) throw error;
        
        // Görevin tamamlanıp tamamlanmadığını kontrol et
        // Not: incrementCompletedPomodoros fonksiyonu zaten completed değerini güncelliyor,
        // bu adım ek bir kontrol olarak eklenmiştir
        await checkAndCompleteTask(activeTask.id);
        
        // Başarıyla güncellendiğinde görevleri yeniden yükle
        await loadUserTasks();
        
        // Eğer tüm pomodorolar tamamlandıysa bildirim veya görsel geri bildirim ekleyin
        const updatedTask = await getTasks(user!.id).then(
          response => response.data?.find(t => t.id === activeTask.id)
        );
        
        if (updatedTask && updatedTask.completed) {
          // Aktif görevi temizle
          setActiveTask(null);
          
          // Görev tamamlandı bildirimi
          Alert.alert(
            t('notifications.taskCompleted'),
            t('notifications.selectAnotherTask'),
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Kullanıcı başka bir görev seçmek isteyebilir
                  setTaskSelectionModalVisible(true);
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Pomodoro sayısı güncellenemedi:', error);
      }
    }
  };

  // Görev seçme fonksiyonu
  const handleSelectTask = async (task: Task) => {
    if (!user) return;
    
    try {
      // Görevi aktif olarak işaretle
      await markTaskAsActive(user.id, task.id);
      
      // UI'ı güncelle
      setActiveTask(task);
      setTaskSelectionModalVisible(false);
      
      // Görevlerin pomodoro sayısına göre longBreakInterval değerini güncelle
      // Eğer görevin tahmini pomodoro sayısı varsa, longBreakInterval değerini buna eşitle
      if (task.estimated_pomodoros > 0) {
        const newSettings = {
          ...timerSettings,
          longBreakInterval: task.estimated_pomodoros
        };
        
        setTimerSettings(newSettings);
        
        // Timer'ı sıfırla
        resetTimer();
        
        // Veritabanında ayarları güncelle
        if (user) {
          try {
            await updateUserSettings(user.id, {
              work_duration: newSettings.workDuration,
              short_break_duration: newSettings.shortBreakDuration,
              long_break_duration: newSettings.longBreakDuration,
              long_break_interval: newSettings.longBreakInterval
            });
          } catch (error) {
            console.error('Zamanlayıcı ayarları güncellenemedi:', error);
          }
        }
      }
      
      // Görevleri yeniden yükle (aktif görev güncellemeleri için)
      loadUserTasks();
    } catch (error) {
      console.error('Aktif görev ayarlanamadı:', error);
    }
  };

  // Aktif görevi kaldır
  const removeActiveTask = async () => {
    if (!user || !activeTask) return;
    
    try {
      // Görevin aktif özelliğini kaldır
      await supabase
        .from('tasks')
        .update({ active: false })
        .eq('id', activeTask.id);
      
      // UI'ı güncelle
      setActiveTask(null);
      
      // Görevleri yeniden yükle
      await loadUserTasks();
      
      // Bildirim göster
      Alert.alert(
        t('tasks.removeSuccess'),
        '',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Aktif görev kaldırılamadı:', error);
    }
  };

  return (
    <Container useScrollView={false} padded={false}>
      <LinearGradient
        colors={[
          isDarkMode ? '#121920' : '#f8f9fa',
          isDarkMode ? '#1E2A38' : '#ffffff'
        ]}
        style={[StyleSheet.absoluteFill]}
      />
      
      <View style={{flex: 1, width: '100%', justifyContent: 'flex-start'}}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t('home.title')}
          </Text>
          <IconButton
            icon="cog-outline"
            iconColor={isDarkMode ? "#ecf0f1" : "#2c3e50"}
            size={24}
            style={styles.headerIcon}
            onPress={() => setSettingsModalVisible(true)}
          />
        </View>
        
        <View style={styles.content}>
          {!isLoading ? (
            <View style={styles.contentWrapper}>
              {/* Görev Seçim Kartı */}
              <Surface style={[styles.taskCard, isDarkMode && styles.darkCard]} elevation={3}>
                {activeTask ? (
                  <View style={styles.taskCardContent}>
                    <PaperText variant="titleMedium" style={[styles.taskTitle, isDarkMode && styles.darkText]}>
                      {activeTask.title}
                    </PaperText>
                    <PaperText variant="bodyMedium" style={[styles.taskProgress, isDarkMode && styles.darkSubText]}>
                      {`${activeTask.completed_pomodoros}/${activeTask.estimated_pomodoros} Pomodoros`}
                    </PaperText>
                    <View style={styles.taskButtonsContainer}>
                      <IconButton
                        icon="close"
                        iconColor={isDarkMode ? "#ff6b6b" : "#e74c3c"}
                        size={18}
                        style={styles.taskActionButton}
                        onPress={removeActiveTask}
                      />
                      <IconButton
                        icon="swap-horizontal"
                        iconColor={isDarkMode ? "#ecf0f1" : "#2c3e50"}
                        size={18}
                        style={styles.taskActionButton}
                        onPress={() => setTaskSelectionModalVisible(true)}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyTaskContainer}>
                    <PaperButton 
                      mode="contained-tonal"
                      icon="plus-circle-outline"
                      onPress={() => setTaskSelectionModalVisible(true)}
                      style={styles.selectTaskButton}
                      buttonColor={isDarkMode ? "#3d5a80" : "#e2e8f0"}
                      textColor={isDarkMode ? "#ecf0f1" : "#2c3e50"}
                    >
                      {t('tasks.selectTask')}
                    </PaperButton>
                  </View>
                )}
              </Surface>

              {/* Timer Bölümü */}
              <Surface style={[styles.timerSurface, isDarkMode && styles.darkTimerSurface]} elevation={3}>
                <PomodoroTimer
                  ref={timerRef}
                  workDuration={timerSettings.workDuration}
                  shortBreakDuration={timerSettings.shortBreakDuration}
                  longBreakDuration={timerSettings.longBreakDuration}
                  longBreakInterval={timerSettings.longBreakInterval}
                  isRunning={isRunning}
                  setIsRunning={setIsRunning}
                  autoMode={autoModeEnabled}
                  onTimerComplete={handleTimerComplete}
                  onSessionComplete={handleSessionComplete}
                  size={230}
                />
              </Surface>
              
              {/* Kontrol Butonları */}
              <Surface style={[styles.controlsSurface, isDarkMode && styles.darkSurface]} elevation={3}>
                <View style={styles.autoModeContainer}>
                  <PaperText variant="labelLarge" style={[styles.autoModeText, isDarkMode && styles.darkText]}>
                    {t('settings.autoMode')}
                  </PaperText>
                  <Switch
                    value={autoModeEnabled}
                    onValueChange={toggleAutoMode}
                    trackColor={{ false: '#767577', true: isDarkMode ? '#5B8EF9' : '#81b0ff' }}
                  />
                </View>
                
                <View style={styles.controlsContainer}>
                  <PaperButton
                    mode="outlined"
                    icon="refresh"
                    onPress={resetTimer}
                    style={[styles.resetButton, isDarkMode && styles.darkOutlinedButton]}
                    labelStyle={[styles.resetButtonText, isDarkMode && styles.darkButtonText]}
                  >
                    {t('pomodoro.reset')}
                  </PaperButton>
                  
                  <PaperButton
                    mode="contained"
                    icon={isRunning ? "pause" : "play"}
                    onPress={toggleTimer}
                    style={[
                      styles.startButton,
                      isRunning ? styles.pauseButton : null,
                      isDarkMode && (isRunning ? styles.darkPauseButton : styles.darkStartButton)
                    ]}
                    labelStyle={styles.startButtonText}
                    contentStyle={styles.startButtonContent}
                  >
                    {isRunning ? t('pomodoro.pause') : t('pomodoro.start')}
                  </PaperButton>
                </View>
              </Surface>
            </View>
          ) : (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={isDarkMode ? '#ecf0f1' : '#2c3e50'} />
            </View>
          )}
        </View>
      </View>

      <TimerSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        settings={timerSettings}
        onSave={saveTimerSettings}
        onReset={resetToDefaultSettings}
        isDarkMode={isDarkMode}
      />
      
      <TaskSelectionModal
        visible={taskSelectionModalVisible}
        onClose={() => setTaskSelectionModalVisible(false)}
        tasks={userTasks}
        onSelectTask={handleSelectTask}
        isDarkMode={isDarkMode}
        navigation={navigation}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  headerIcon: {
    margin: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 0,
    width: '100%',
    marginTop: 0,
  },
  contentWrapper: {
    justifyContent: 'flex-start',
    width: '100%',
    gap: 16,
  },
  taskCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 0,
    overflow: 'hidden',
    backgroundColor: '#263850',
  },
  darkCard: {
    backgroundColor: '#263850',
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskTitle: {
    fontWeight: '600',
    flex: 1,
    fontSize: 16,
  },
  taskProgress: {
    marginHorizontal: 8,
    opacity: 0.8,
    fontSize: 14,
  },
  darkSubText: {
    color: '#cbd5e0',
  },
  taskButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskActionButton: {
    margin: 0,
    marginLeft: 4,
  },
  emptyTaskContainer: {
    alignItems: 'center',
    padding: 16,
  },
  selectTaskButton: {
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timerSurface: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    padding: 20,
    width: '100%',
    backgroundColor: '#242f3d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    height: 280,
  },
  darkTimerSurface: {
    backgroundColor: '#242f3d',
  },
  controlsSurface: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    marginTop: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  darkSurface: {
    backgroundColor: '#263850',
  },
  autoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    marginBottom: 12,
  },
  autoModeText: {
    marginRight: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#2d3748',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  resetButton: {
    marginRight: 10,
    borderRadius: 25,
    paddingVertical: 6,
    borderWidth: 1.5,
  },
  darkOutlinedButton: {
    borderColor: '#4a5568',
  },
  startButton: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#38b2ac',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: 45,
    maxHeight: 45,
  },
  startButtonContent: {
    height: 45,
    paddingHorizontal: 8, 
  },
  darkStartButton: {
    backgroundColor: '#319795',
  },
  pauseButton: {
    backgroundColor: '#ed8936',
  },
  darkPauseButton: {
    backgroundColor: '#dd6b20',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  darkButtonText: {
    color: '#e2e8f0',
  },
  startButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  darkText: {
    color: '#f7fafc',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  darkModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalFooter: {
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
  },
  settingRow: {
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    width: 60,
    marginRight: 5,
    textAlign: 'center',
  },
  darkTimeInput: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#333',
  },
  timeUnit: {
    marginRight: 10,
    color: '#2c3e50',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    width: 60,
    textAlign: 'center',
  },
  taskList: {
    maxHeight: 300,
    marginTop: 10,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkTaskItem: {
    borderBottomColor: '#333',
  },
  emptyTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTasksText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  createTaskButton: {
    marginTop: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemProgress: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resetButtonDark: {
    backgroundColor: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 