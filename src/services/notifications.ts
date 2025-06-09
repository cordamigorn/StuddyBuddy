import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';

// Bildirim servisini yapılandır
export const configureNotifications = async () => {
  // Bildirim gösterim yapılandırması
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // İzinleri kontrol et
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // İzin verilmemişse talep et
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // İzin alınmadıysa false döndür
  if (finalStatus !== 'granted') {
    console.log('Bildirim izni alınamadı');
    return false;
  }

  // Android için özel kanallar oluştur
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
};

// Zamanlayıcı tamamlandığında bildirim gönder
export const sendTimerCompletionNotification = async (type: 'work' | 'shortBreak' | 'longBreak') => {
  let title = '';
  let body = '';

  // Bildirim içeriğini kullanıcı dilinde ayarla
  switch (type) {
    case 'work':
      title = i18n.t('notifications.workCompleted');
      body = i18n.t('notifications.timeForShortBreak');
      break;
    case 'shortBreak':
      title = i18n.t('notifications.breakOver');
      body = i18n.t('notifications.startWorkingAgain');
      break;
    case 'longBreak':
      title = i18n.t('notifications.longBreakCompleted');
      body = i18n.t('notifications.readyForNewSession');
      break;
  }

  // Bildirimi gönder
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // Anında göster
  });
}; 