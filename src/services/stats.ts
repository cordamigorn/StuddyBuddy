import { supabase } from './supabase';
import { PomodoroSession } from '../types/session';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, parseISO } from 'date-fns';

// Kullanıcının tüm Pomodoro oturumlarını getir
export const getAllSessions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get all sessions error:', error);
    return { data: null, error };
  }
};

// Belirli bir tarih aralığındaki oturumları getir
export const getSessionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get sessions by date range error:', error);
    return { data: null, error };
  }
};

// Yeni bir Pomodoro oturumu kaydet
export const createSession = async (
  session: Omit<PomodoroSession, 'id'>
) => {
  try {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert([session])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Create session error:', error);
    return { data: null, error };
  }
};

export interface PomodoroStat {
  date: string;
  pomodoros: number;
  focusTime: number; // dakika
  breakTime: number; // dakika
}

export interface StatsSummary {
  totalPomodoros: number;
  totalFocusTime: number; // dakika
  totalBreakTime: number; // dakika
  dailyAverage: number;
  completedTasks: number;
}

// Tüm zamanların istatistik özeti
export const getStatsSummary = async (userId: string): Promise<StatsSummary> => {
  try {
    if (!userId) {
      return {
        totalPomodoros: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        dailyAverage: 0,
        completedTasks: 0
      };
    }

    // Tüm tamamlanan oturumları getir
    const { data: sessionData, error: sessionError } = await supabase
      .from('pomodoro_sessions')
      .select('id, duration, start_time')
      .eq('user_id', userId)
      .eq('completed', true);

    if (sessionError) {
      console.error('Get pomodoro sessions error:', sessionError);
      return {
        totalPomodoros: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        dailyAverage: 0,
        completedTasks: 0
      };
    }

    // Oturum sayısı ve toplam süre
    const totalPomodoros = sessionData?.length || 0;
    const totalFocusTime = sessionData?.reduce((total, session) => total + (session.duration || 0), 0) || 0;

    // Tamamlanan görevler
    const { count: taskCount, error: taskError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    if (taskError) {
      console.error('Get completed tasks error:', taskError);
      return {
        totalPomodoros,
        totalFocusTime,
        totalBreakTime: 0,
        dailyAverage: 0,
        completedTasks: 0
      };
    }

    // Günlük ortalama hesapla
    let dailyAverage = 0;
    if (totalPomodoros > 0 && sessionData && sessionData.length > 0) {
      // İlk ve son oturumun tarihlerini bul
      const sortedSessions = [...sessionData].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      const firstDate = new Date(sortedSessions[0].start_time);
      const lastDate = new Date(sortedSessions[sortedSessions.length - 1].start_time);
      const daysDiff = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      dailyAverage = totalPomodoros / daysDiff;
    }

    return {
      totalPomodoros,
      totalFocusTime,
      totalBreakTime: 0, // Şu aşamada mola sürelerini hesaplamıyoruz
      dailyAverage,
      completedTasks: taskCount || 0
    };
  } catch (error) {
    console.error('Get stats summary error:', error);
    return {
      totalPomodoros: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      dailyAverage: 0,
      completedTasks: 0
    };
  }
};

// Günlük istatistikler
export const getDailyStats = async (userId: string, days: number = 7): Promise<PomodoroStat[]> => {
  try {
    if (!userId) {
      return Array(days).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          pomodoros: 0,
          focusTime: 0,
          breakTime: 0
        };
      }).reverse();
    }

    // Bugünden başlayarak son 7 günün başlangıç gününü bul (Pazartesi)
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0-6 (0: Pazar, 1: Pazartesi, ...)
    
    // Pazartesi gününü bul (eğer bugün pazar ise 6 gün geriye git, pazartesi ise 0 gün)
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - daysToSubtract);
    
    // Pazartesiden başlayarak 7 gün için veri hazırla
    const endDate = new Date(mondayDate);
    endDate.setDate(mondayDate.getDate() + 6); // Pazar
    
    // Bugünden geriye doğru 'days' gün için verileri getir
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('start_time', startOfDay(mondayDate).toISOString())
      .lte('start_time', endOfDay(endDate).toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Get daily stats error:', error);
      return getEmptyWeekStats(mondayDate);
    }
    
    // Günlük bazda verileri grupla
    const dailyStats: Record<string, PomodoroStat> = {};

    // Pazartesiden Pazara 7 gün için tarih oluştur
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      const dateString = format(date, 'yyyy-MM-dd');
      dailyStats[dateString] = {
        date: dateString,
        pomodoros: 0,
        focusTime: 0,
        breakTime: 0
      };
    }

    // Verileri günlük olarak grupla
    if (data) {
      data.forEach(session => {
        const date = format(parseISO(session.start_time), 'yyyy-MM-dd');
        
        // Sadece bu haftaya ait günlerdeki verileri işle
        if (dailyStats[date]) {
          dailyStats[date].pomodoros += 1;
          dailyStats[date].focusTime += session.duration || 0;
        }
      });
    }

    // Objeyi diziye dönüştür ve pazartesiden pazara doğru sırala
    const result = Object.values(dailyStats).sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    return result;
  } catch (error) {
    console.error('Get daily stats error:', error);
    // Hata durumunda boş veri dön
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - daysToSubtract);
    
    return getEmptyWeekStats(mondayDate);
  }
};

// Boş haftalık veri oluştur (Pazartesiden Pazara)
const getEmptyWeekStats = (mondayDate: Date): PomodoroStat[] => {
  const result: PomodoroStat[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(mondayDate);
    date.setDate(mondayDate.getDate() + i);
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    });
  }
  
  return result;
};

// Haftalık istatistikler
export const getWeeklyStats = async (userId: string, weeks: number = 4): Promise<PomodoroStat[]> => {
  try {
    if (!userId) {
      return getEmptyMonthWeeks();
    }
    
    // Mevcut ay için hafta bilgilerini oluştur
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Ayın ilk günü
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Ayın son günü
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Haftalık verileri getir
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('start_time', firstDayOfMonth.toISOString())
      .lte('start_time', lastDayOfMonth.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Get weekly stats error:', error);
      return getEmptyMonthWeeks();
    }

    // Ayın haftalarını oluştur (4 hafta)
    const weeklyStats = getEmptyMonthWeeks();

    // Verileri haftalara göre gruplandır
    if (data && data.length > 0) {
      data.forEach(session => {
        const sessionDate = parseISO(session.start_time);
        const dayOfMonth = sessionDate.getDate();
        
        // Tarihe göre hangi haftaya ait olduğunu belirle (basit bir yaklaşım)
        let weekIndex = 0;
        if (dayOfMonth <= 7) {
          weekIndex = 0; // 1. Hafta
        } else if (dayOfMonth <= 14) {
          weekIndex = 1; // 2. Hafta
        } else if (dayOfMonth <= 21) {
          weekIndex = 2; // 3. Hafta
        } else {
          weekIndex = 3; // 4. Hafta
        }
        
        weeklyStats[weekIndex].pomodoros += 1;
        weeklyStats[weekIndex].focusTime += session.duration || 0;
      });
    }

    return weeklyStats;
  } catch (error) {
    console.error('Get weekly stats error:', error);
    return getEmptyMonthWeeks();
  }
};

// Boş aylık hafta verileri oluştur
const getEmptyMonthWeeks = (): PomodoroStat[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  return [
    {
      date: `${monthNames[currentMonth]}-H1`,
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    },
    {
      date: `${monthNames[currentMonth]}-H2`,
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    },
    {
      date: `${monthNames[currentMonth]}-H3`,
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    },
    {
      date: `${monthNames[currentMonth]}-H4`,
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    }
  ];
};

// Bugünün istatistikleri
export const getTodayStats = async (userId: string): Promise<PomodoroStat> => {
  try {
    if (!userId) {
      return {
        date: format(new Date(), 'yyyy-MM-dd'),
        pomodoros: 0,
        focusTime: 0,
        breakTime: 0
      };
    }
    
    const today = new Date();
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('start_time', startOfDay(today).toISOString())
      .lte('start_time', endOfDay(today).toISOString());

    if (error) throw error;

    let pomoCount = 0;
    let focusMinutes = 0;
    let breakMinutes = 0;

    if (data) {
      data.forEach(session => {
        if (session.session_type === 'work') {
          pomoCount += 1;
          focusMinutes += session.duration || 0;
        } else {
          breakMinutes += session.duration || 0;
        }
      });
    }

    return {
      date: format(today, 'yyyy-MM-dd'),
      pomodoros: pomoCount,
      focusTime: focusMinutes,
      breakTime: breakMinutes
    };
  } catch (error) {
    console.error('Get today stats error:', error);
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      pomodoros: 0,
      focusTime: 0,
      breakTime: 0
    };
  }
};

// Kullanıcının aralıksız kaç gün çalıştığını hesapla (streak)
export const getStreak = async (userId: string): Promise<number> => {
  try {
    if (!userId) {
      return 0;
    }
    
    // Son 100 günlük verileri getir (yeterince uzun bir aralık)
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('completed', true)
      // .eq('session_type', 'work') // session_type sütunu olmadığı için bu filtreyi kaldırıyoruz
      .order('start_time', { ascending: false })
      .limit(1000); // Yeterince veri almak için
    
    if (error) {
      console.error('Streak data fetch error:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Tarihleri gün formatında grupla (her gün için en az 1 pomodoro)
    const dailyMap = new Map<string, boolean>();
    
    data.forEach(session => {
      const dateStr = format(parseISO(session.start_time), 'yyyy-MM-dd');
      dailyMap.set(dateStr, true);
    });
    
    // Bugünden geriye doğru aralıksız günleri say
    const today = new Date();
    let currentDate = today;
    let streakCount = 0;
    
    // Bugün için kontrol et
    const todayStr = format(today, 'yyyy-MM-dd');
    let hasToday = dailyMap.has(todayStr);
    
    // Bugün çalışılmışsa streak'e dahil et
    if (hasToday) {
      streakCount = 1;
    }
    
    // Dünden başlayarak geriye doğru kontrol et
    currentDate = subDays(today, 1);
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const hasPomodoro = dailyMap.has(dateStr);
      
      // Eğer bu günde pomodoro yoksa streak kesilmiş demektir
      if (!hasPomodoro) {
        break;
      }
      
      // Bu günde pomodoro varsa streak'i arttır
      streakCount++;
      
      // Bir önceki güne geç
      currentDate = subDays(currentDate, 1);
    }
    
    return streakCount;
  } catch (error) {
    console.error('Get streak error:', error);
    return 0;
  }
};

// Kullanıcının en verimli gününü ve saatini bul
export interface ProductivityData {
  mostProductiveDay: string; // Haftanın günü (Pazartesi, Salı, vb.)
  mostProductiveHour: number; // 0-23 arası saat
  dayCount: number; // En verimli gündeki toplam pomodoro
  hourCount: number; // En verimli saatteki toplam pomodoro
}

export const getMostProductiveTime = async (userId: string): Promise<ProductivityData> => {
  try {
    if (!userId) {
      return {
        mostProductiveDay: '',
        mostProductiveHour: 0,
        dayCount: 0,
        hourCount: 0
      };
    }
    
    // Son 60 günlük verileri getir
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('completed', true)
      // .eq('session_type', 'work') // session_type sütunu olmadığı için bu filtreyi kaldırıyoruz
      .order('start_time', { ascending: false })
      .limit(2000); // Yeterince veri
    
    if (error) {
      console.error('Most productive time data fetch error:', error);
      return {
        mostProductiveDay: '',
        mostProductiveHour: 0,
        dayCount: 0,
        hourCount: 0
      };
    }
    
    if (!data || data.length === 0) {
      return {
        mostProductiveDay: '',
        mostProductiveHour: 0,
        dayCount: 0,
        hourCount: 0
      };
    }
    
    // Haftanın günleri ve saatler için sayaçlar
    const dayMap = new Map<number, number>(); // 0 (Pazar) - 6 (Cumartesi)
    const hourMap = new Map<number, number>(); // 0-23 arası saatler
    
    // Verileri güne ve saate göre grupla
    data.forEach(session => {
      const date = parseISO(session.start_time);
      const dayOfWeek = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      
      // Güne göre sayaç arttır
      dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + 1);
      
      // Saate göre sayaç arttır
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    
    // En verimli günü bul
    let mostProductiveDay = 0;
    let maxDayCount = 0;
    
    dayMap.forEach((count, day) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProductiveDay = day;
      }
    });
    
    // En verimli saati bul
    let mostProductiveHour = 0;
    let maxHourCount = 0;
    
    hourMap.forEach((count, hour) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostProductiveHour = hour;
      }
    });

    return {
      mostProductiveDay: mostProductiveDay.toString(),
      mostProductiveHour,
      dayCount: maxDayCount,
      hourCount: maxHourCount
    };
  } catch (error) {
    console.error('Get most productive time error:', error);
    return {
      mostProductiveDay: '',
      mostProductiveHour: 0,
      dayCount: 0,
      hourCount: 0
    };
  }
}; 