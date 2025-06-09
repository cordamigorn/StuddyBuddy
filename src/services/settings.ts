import { supabase } from './supabase';
import { UserSettings } from '../types/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@user_settings';

// Kullanıcı ayarlarını getir
export const getUserSettings = async (userId: string) => {
  try {
    // Önce local storage'dan ayarları almayı dene
    const localSettings = await getLocalSettings(userId);
    if (localSettings) {
      return {
        data: localSettings,
        error: null
      };
    }

    // Supabase'den ayarları almayı dene
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204') { // Tablo/sütun bulunamadı hatası
          console.log('Settings tablosu veya sütunu bulunamadı, varsayılan ayarlar kullanılacak');
          const defaultSettings = getDefaultSettings(userId);
          // Varsayılan ayarları lokale kaydet
          await saveLocalSettings(userId, defaultSettings);
          return { data: defaultSettings, error: null };
        }
        throw error;
      }
      
      // Veritabanından alınan ayarları lokale kaydet
      if (data) {
        // Eksik değerleri varsayılan ayarlardan al
        const defaultSettings = getDefaultSettings(userId);
        const mergedSettings = {
          ...defaultSettings,
          ...data,
        };
        await saveLocalSettings(userId, mergedSettings);
        return { data: mergedSettings, error: null };
      }

      // Ayarlar bulunmadıysa varsayılan ayarları döndür
      if (!data) {
        const defaultSettings = getDefaultSettings(userId);
        await saveLocalSettings(userId, defaultSettings);
        return {
          data: defaultSettings,
          error: null
        };
      }

      return { data, error: null };
    } catch (dbError) {
      console.error('Veritabanı hatası:', dbError);
      
      // Veritabanı hatası durumunda varsayılan ayarları kullan
      const defaultSettings = getDefaultSettings(userId);
      await saveLocalSettings(userId, defaultSettings);
      return { data: defaultSettings, error: null };
    }
  } catch (error) {
    console.error('Ayarlar yüklenirken hata oluştu:', error);
    
    // Herhangi bir hata durumunda varsayılan ayarları döndür
    const defaultSettings = getDefaultSettings(userId);
    return { data: defaultSettings, error };
  }
};

// Kullanıcı ayarlarını güncelle
export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  try {
    // Önce local storage'a kaydet
    const currentSettings = await getLocalSettings(userId) || getDefaultSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    await saveLocalSettings(userId, updatedSettings);
    
    // Supabase için sütun hatalarından kaçınma
    // Sadece user_id ve temel çalışma sürelerini veritabanına gönderelim
    // diğer kalan özellikleri yerel depolamada tutalım
    const dbSafeSettings = {
      user_id: userId,
      work_duration: settings.work_duration !== undefined ? settings.work_duration : currentSettings.work_duration,
      short_break_duration: settings.short_break_duration !== undefined ? settings.short_break_duration : currentSettings.short_break_duration,
      long_break_duration: settings.long_break_duration !== undefined ? settings.long_break_duration : currentSettings.long_break_duration,
      long_break_interval: settings.long_break_interval !== undefined ? settings.long_break_interval : currentSettings.long_break_interval,
    };
    
    // Supabase'e kaydetmeyi dene
    try {
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', userId)
        .single();
      
      let result;
      
      // Ayarlar henüz oluşturulmadıysa, yeni bir kayıt oluştur (sadece temel ayarlar)
      if (!existingSettings) {
        result = await supabase
          .from('settings')
          .insert([dbSafeSettings])
          .select();
      } else {
        // Ayarlar varsa, güncelle (sadece temel ayarlar)
        result = await supabase
          .from('settings')
          .update(dbSafeSettings)
          .eq('user_id', userId)
          .select();
      }

      const { data, error } = result;
      
      if (error) {
        // Veritabanı hatası ama lokale kaydedildi
        console.error('Veritabanına kaydedilemedi ama lokal değişiklikler saklandı:', error);
        return { data: updatedSettings, error: null };
      }
      
      return { data: updatedSettings, error: null };
    } catch (dbError) {
      // Veritabanı bağlantı hatası ama lokale kaydedildi
      console.error('Veritabanı bağlantı hatası:', dbError);
      return { data: updatedSettings, error: null };
    }
  } catch (error) {
    console.error('Update user settings error:', error);
    return { data: null, error };
  }
};

// Local storage'dan kullanıcı ayarlarını al
const getLocalSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const settingsJson = await AsyncStorage.getItem(`${SETTINGS_STORAGE_KEY}_${userId}`);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    return null;
  } catch (error) {
    console.error('Local settings get error:', error);
    return null;
  }
};

// Local storage'a kullanıcı ayarlarını kaydet
const saveLocalSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${SETTINGS_STORAGE_KEY}_${userId}`, JSON.stringify(settings));
  } catch (error) {
    console.error('Local settings save error:', error);
  }
};

// Varsayılan kullanıcı ayarlarını oluştur
export const getDefaultSettings = (userId: string): UserSettings => {
  return {
    user_id: userId,
    work_duration: 25, // dakika
    short_break_duration: 5, // dakika
    long_break_duration: 15, // dakika
    long_break_interval: 4, // 4 Pomodoro'dan sonra uzun mola
    notifications_enabled: true,
    dark_mode: false
  };
}; 