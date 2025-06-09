import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, RefreshControl, Platform, FlatList, TouchableOpacity, Dimensions, ScrollView, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Container } from '../../components/common/Container';
import { Ionicons } from '@expo/vector-icons';
import { getStatsSummary, getDailyStats, getWeeklyStats, PomodoroStat, getStreak, getMostProductiveTime, ProductivityData } from '../../services/stats';
import { format, parseISO, subDays, addDays, startOfWeek, endOfWeek, isWithinInterval, formatDistance, Locale } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Surface, Text as PaperText, Card, Divider, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tek bir item render bileşeni (bunu dışarı çıkararak optimize ediyoruz)
const DayBarItem = ({ item, maxValue, isDarkMode, locale }: { item: PomodoroStat; maxValue: number; isDarkMode: boolean; locale: Locale }) => {
  // Animasyon için
  const barHeight = useSharedValue(0);
  
  useEffect(() => {
    // Görünüm yüklendiğinde yumuşak animasyon başlat
    barHeight.value = withTiming((item.pomodoros / maxValue) * 100, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [maxValue, item.pomodoros]);
  
  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      height: `${Math.max(barHeight.value, 5)}%`,
    };
  });
  
  const date = parseISO(item.date);
  
  // Günün kısaltması (Pazartesi için Pt, Salı için Sa, vb.)
  const getTurkishDayShortName = (date: Date) => {
    const dayIndex = date.getDay(); // 0-6 (0: Pazar, 1: Pazartesi, ...)
    const dayShortNames = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    return dayShortNames[dayIndex];
  };
  
  const dayName = getTurkishDayShortName(date);
  
  return (
    <View style={styles.barColumn}>
      <View style={styles.barWrapper}>
        <Animated.View 
          style={[
            styles.bar, 
            animatedBarStyle,
            isDarkMode ? styles.darkBar : null
          ]} 
        />
      </View>
      <Text style={[styles.barLabel, isDarkMode && styles.darkText]}>
        {dayName}
      </Text>
      <Text style={[styles.barValue, isDarkMode && styles.darkText]}>
        {item.pomodoros}
      </Text>
    </View>
  );
};

// Haftalık bar item bileşeni
const WeekBarItem = ({ item, maxValue, isDarkMode }: { item: PomodoroStat; maxValue: number; isDarkMode: boolean }) => {
  // Animasyon için
  const barHeight = useSharedValue(0);
  
  useEffect(() => {
    // Görünüm yüklendiğinde yumuşak animasyon başlat
    barHeight.value = withTiming((item.pomodoros / maxValue) * 100, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [maxValue, item.pomodoros]);
  
  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      height: `${Math.max(barHeight.value, 5)}%`,
    };
  });
  
  // Ay-Hafta formatındaki string'i parçalamak için split kullan
  const weekNum = item.date.split('-H')[1];
  
  return (
    <View style={styles.barColumn}>
      <View style={styles.barWrapper}>
        <Animated.View 
          style={[
            styles.bar, 
            animatedBarStyle,
            isDarkMode ? styles.darkBar : styles.weekBar
          ]} 
        />
      </View>
      <Text style={[styles.barLabel, isDarkMode && styles.darkText]}>
        {weekNum}. Hafta
      </Text>
      <Text style={[styles.barValue, isDarkMode && styles.darkText]}>
        {item.pomodoros}
      </Text>
    </View>
  );
};

// Section tipi
type Section = {
  id: string;
  type: 'title' | 'summary' | 'daily' | 'weekly' | 'tasks';
};

// Zaman dilimi seçici
const TimeFrameSelector = ({ 
  selectedTimeFrame, 
  onSelect, 
  isDarkMode 
}: { 
  selectedTimeFrame: 'daily' | 'weekly'; 
  onSelect: (timeFrame: 'daily' | 'weekly') => void;
  isDarkMode: boolean;
}) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.timeFrameContainer}>
      <TouchableOpacity 
        style={[
          styles.timeFrameButton, 
          selectedTimeFrame === 'daily' && styles.selectedTimeFrame,
          isDarkMode && styles.darkTimeFrameButton,
          selectedTimeFrame === 'daily' && isDarkMode && styles.darkSelectedTimeFrame
        ]} 
        onPress={() => onSelect('daily')}
      >
        <Text style={[
          styles.timeFrameText,
          selectedTimeFrame === 'daily' && styles.selectedTimeFrameText,
          isDarkMode && styles.darkText
        ]}>
          {t('stats.daily')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.timeFrameButton, 
          selectedTimeFrame === 'weekly' && styles.selectedTimeFrame,
          isDarkMode && styles.darkTimeFrameButton,
          selectedTimeFrame === 'weekly' && isDarkMode && styles.darkSelectedTimeFrame
        ]} 
        onPress={() => onSelect('weekly')}
      >
        <Text style={[
          styles.timeFrameText,
          selectedTimeFrame === 'weekly' && styles.selectedTimeFrameText,
          isDarkMode && styles.darkText
        ]}>
          {t('stats.weeklyProgress')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Grafik bileşeni
const TimeBasedGraph = ({ data, timeFrame }: { data: PomodoroStat[], timeFrame: 'daily' | 'weekly' }) => {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Grafik verilerini hazırla
  const chartData = useMemo(() => {
    return {
      labels: data.map(item => {
        if (timeFrame === 'daily') {
          // Günlük görünüm için tarihi formatlama
          const date = parseISO(item.date);
          return format(date, 'E, d MMM'); // Örn: "Pzt, 15 Ara"
        } else {
          // Haftalık görünüm için Türkçe hafta gösterimi
          const [month, week] = item.date.split('-H');
          return `${week}. Hafta`;
        }
      }),
      datasets: [
        {
          data: data.map(item => item.pomodoros),
          color: () => isDarkMode ? '#5DADEC' : '#3776F6', 
          strokeWidth: 2
        }
      ]
    };
  }, [data, timeFrame, isDarkMode]);
  
  return null; // Bu bileşen henüz kullanılmıyor, ileride implementasyon yapılacak
};

export const StatsScreen = () => {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalPomodoros: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    dailyAverage: 0,
    completedTasks: 0
  });
  const [dailyStats, setDailyStats] = useState<PomodoroStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<PomodoroStat[]>([]);
  const [streak, setStreak] = useState(0);
  const [productivityData, setProductivityData] = useState<ProductivityData>({
    mostProductiveDay: '',
    mostProductiveHour: 0,
    dayCount: 0,
    hourCount: 0
  });
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly'>('daily');
  const [displayData, setDisplayData] = useState<PomodoroStat[]>([]);

  // Dil seçimi
  const locale = i18n.language === 'tr' ? tr : enUS;
  
  // Debug bilgisi
  console.log('StatsScreen render, user:', user?.id, 'Platform:', Platform.OS);

  // useFocusEffect ile sayfa odaklandığında veri yükle
  useFocusEffect(
    useCallback(() => {
      loadStats();
      return () => {
        // Temizleme işlemleri (gerekirse)
      };
    }, [user])
  );

  useEffect(() => {
    // Zaman dilimine göre gösterilecek veriyi belirle
    updateDisplayData();
  }, [timeFrame, dailyStats, weeklyStats]);

  const updateDisplayData = () => {
    if (timeFrame === 'daily' && dailyStats.length > 0) {
      setDisplayData(dailyStats);
    } else if (timeFrame === 'weekly' && weeklyStats.length > 0) {
      setDisplayData(weeklyStats);
    } else {
      // Aylık veriler (şu an için haftalık verilerle aynı)
      setDisplayData(weeklyStats);
    }
  };

  const loadStats = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setRefreshing(true);
    
    try {
      // Tüm API çağrıları paralel olarak yapılsın ve hataları yakalayalım
      const results = await Promise.allSettled([
        getStatsSummary(user.id),
        getDailyStats(user.id, 7),  // Son 7 gün
        getWeeklyStats(user.id, 4), // Son 4 hafta
        getStreak(user.id),
        getMostProductiveTime(user.id)
      ]);
      
      // Her bir sonucu kontrol et
      if (results[0].status === 'fulfilled') {
        setSummary(results[0].value);
      }
      
      if (results[1].status === 'fulfilled') {
        setDailyStats(results[1].value);
      }
      
      if (results[2].status === 'fulfilled') {
        setWeeklyStats(results[2].value);
      }
      
      if (results[3].status === 'fulfilled') {
        setStreak(results[3].value);
      }
      
      if (results[4].status === 'fulfilled') {
        setProductivityData(results[4].value);
      }
      
      // Hataları konsola yaz
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`İstatistik verisi ${index} yüklenemedi:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Stats loading error:', error);
      // Hata durumunda boş verileri göster
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Dakikaları saat:dakika formatına çevir
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ${t('stats.hours')} ${mins} ${t('stats.minutes')}`;
  };

  const renderSummaryCard = (icon: string, title: string, value: string | number, unit: string) => {
    return (
      <Card style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]} elevation={2}>
        <Card.Content style={styles.cardContent}>
          <Ionicons name={icon as any} size={28} color={isDarkMode ? '#3498db' : '#2980b9'} style={styles.cardIcon} />
          <Text style={[styles.summaryTitle, isDarkMode && styles.darkText]}>{title}</Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.darkText]}>{value}</Text>
          <Text style={[styles.summaryUnit, isDarkMode && styles.darkText]}>{unit}</Text>
        </Card.Content>
      </Card>
    );
  };

  const renderDailyChart = () => {
    if (!displayData || displayData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
            Henüz veri yok
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContent}>
        <FlatList
          data={displayData}
          renderItem={({item}) => (
            <DayBarItem 
              item={item} 
              maxValue={Math.max(...displayData.map(i => i.pomodoros), 1)} 
              isDarkMode={isDarkMode}
              locale={locale}
            />
          )}
          keyExtractor={(item, index) => `bar-${index}`}
          horizontal={false}
          numColumns={7}
          contentContainerStyle={styles.barContainer}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderWeeklyChart = () => {
    if (!weeklyStats || weeklyStats.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
            {t('stats.noData')}
          </Text>
        </View>
      );
    }

    // Her hafta için basit bir bar grafiği gösterelim
    const maxPomodoros = Math.max(...weeklyStats.map(week => week.pomodoros), 1);

    // Gösterilecek hafta verilerini filtrele - mevcut ayın 4 haftası
    const filteredWeeklyStats = weeklyStats.slice(0, 4);

    return (
      <View style={styles.chartContent}>
        <FlatList
          data={filteredWeeklyStats}
          renderItem={({item}) => <WeekBarItem item={item} maxValue={maxPomodoros} isDarkMode={isDarkMode} />}
          keyExtractor={(item, index) => `week-${index}`}
          horizontal={true}
          scrollEnabled={false}
          contentContainerStyle={styles.barContainer}
        />
      </View>
    );
  };

  // Haftanın gününü text olarak döndür
  const getDayName = (dayNumber: string | number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[Number(dayNumber)];
  };

  // Refresh işlemi
  const onRefresh = () => {
    loadStats();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#3498db' : '#2980b9'} />
          <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
            {t('stats.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Veri nesneleri hazırla
  const sections = [
    { id: 'title', type: 'title' },
    { id: 'summary', type: 'summary' },
    { id: 'daily', type: 'daily' },
    { id: 'weekly', type: 'weekly' },
    { id: 'tasks', type: 'tasks' }
  ] as Section[];

  // Her bir bölümü render etme fonksiyonu
  const renderSection = ({ item }: { item: Section }) => {
    switch (item.type) {
      case 'title':
        return (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              {t('stats.title')}
            </Text>
          </View>
        );
      case 'summary':
        return (
          <View style={styles.summaryContainer}>
            {renderSummaryCard('timer-outline', t('stats.total'), summary.totalPomodoros, t('stats.pomodoros'))}
            {renderSummaryCard('time-outline', t('stats.focusTime'), formatTime(summary.totalFocusTime), t('stats.hours'))}
            {renderSummaryCard('cafe-outline', t('stats.breakTime'), formatTime(summary.totalBreakTime), t('stats.hours'))}
            {renderSummaryCard('analytics-outline', t('stats.daily'), summary.dailyAverage.toFixed(1), t('stats.average'))}
          </View>
        );
      case 'daily':
        return (
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, isDarkMode && styles.darkText]}>
                {t('stats.dailyProgress')}
              </Text>
              <TimeFrameSelector
                selectedTimeFrame={timeFrame}
                onSelect={setTimeFrame}
                isDarkMode={isDarkMode}
              />
            </View>
            {renderDailyChart()}
          </View>
        );
      case 'weekly':
        return (
          <View style={styles.chartSection}>
            <Text style={[styles.chartTitle, isDarkMode && styles.darkText]}>
              {t('stats.weeklyProgress')}
            </Text>
            {renderWeeklyChart()}
          </View>
        );
      case 'tasks':
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
              {t('stats.completedTasks')}
            </Text>
            <View style={[styles.statBox, isDarkMode && styles.darkStatBox]}>
              <View style={styles.statRow}>
                <Ionicons name="checkmark-circle-outline" size={24} color={isDarkMode ? '#2ecc71' : '#27ae60'} />
                <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
                  {t('stats.completedTasks')}:
                </Text>
                <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
                  {summary.completedTasks}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="trending-up-outline" size={24} color={isDarkMode ? '#3498db' : '#2980b9'} />
                <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
                  {t('stats.averagePerDay')}:
                </Text>
                <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
                  {summary.dailyAverage.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Başlık */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t('stats.title')}
          </Text>
        </View>

        {/* Genel Bakış (Dashboard) */}
        <View style={styles.dashboardContainer}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('stats.summary')}
          </Text>
          
          <View style={styles.cardRow}>
            {/* Toplam Pomodoro Süresi */}
            <Card style={[styles.dashboardCard, isDarkMode && styles.darkCard]} elevation={2}>
              <Card.Content>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="time-outline" size={24} color={isDarkMode ? '#3498db' : '#2980b9'} />
                </View>
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
                  {t('stats.totalFocusTime')}
                </Text>
                <Text style={[styles.cardValue, isDarkMode && styles.darkText]}>
                  {formatTime(summary.totalFocusTime)}
                </Text>
              </Card.Content>
            </Card>
            
            {/* Tamamlanan Görevler */}
            <Card style={[styles.dashboardCard, isDarkMode && styles.darkCard]} elevation={2}>
              <Card.Content>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="checkmark-done-outline" size={24} color={isDarkMode ? '#3498db' : '#2980b9'} />
                </View>
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
                  {t('stats.completedTasks')}
                </Text>
                <Text style={[styles.cardValue, isDarkMode && styles.darkText]}>
                  {summary.completedTasks}
                </Text>
              </Card.Content>
            </Card>
          </View>
          
          {/* En Verimli Zaman */}
          <Card style={[styles.productivityCard, isDarkMode && styles.darkCard]} elevation={2}>
            <Card.Content style={styles.productivityCardContent}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="analytics-outline" size={24} color={isDarkMode ? '#3498db' : '#2980b9'} />
              </View>
              <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
                {t('stats.mostProductiveTime')}
              </Text>
              <View style={styles.productivityDetails}>
                <View style={styles.productivityItem}>
                  <Text style={[styles.productivityLabel, isDarkMode && styles.darkText]}>
                    {t('stats.mostProductiveDay')}:
                  </Text>
                  <Text style={[styles.productivityValue, isDarkMode && styles.darkText]}>
                    {getDayName(productivityData.mostProductiveDay)} ({productivityData.dayCount} {t('stats.pomodoros')})
                  </Text>
                </View>
                <View style={styles.productivityItem}>
                  <Text style={[styles.productivityLabel, isDarkMode && styles.darkText]}>
                    {t('stats.mostProductiveTime')}:
                  </Text>
                  <Text style={[styles.productivityValue, isDarkMode && styles.darkText]}>
                    {productivityData.mostProductiveHour}:00 ({productivityData.hourCount} {t('stats.pomodoros')})
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
        
        {/* Zaman Bazlı Grafikler */}
        <View style={styles.chartsContainer}>
          <View style={styles.chartHeaderRow}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              {timeFrame === 'daily' ? t('stats.dailyProgress') : t('stats.weeklyProgress')}
            </Text>
            <TimeFrameSelector
              selectedTimeFrame={timeFrame}
              onSelect={setTimeFrame}
              isDarkMode={isDarkMode}
            />
          </View>
          
          {/* Grafik Bileşeni */}
          <Card style={[styles.chartCard, isDarkMode && styles.darkCard]} elevation={2}>
            <Card.Content>
              {displayData.length > 0 ? renderDailyChart() : (
                <View style={styles.emptyChartContainer}>
                  <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
                    {t('stats.noData')}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
        
        {/* Streak Bölümü */}
        <View style={styles.streakContainer}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('stats.longestStreak')}
          </Text>
          
          <Card style={[styles.streakCard, isDarkMode && styles.darkCard]} elevation={2}>
            <Card.Content>
              <View style={styles.streakContent}>
                <Ionicons 
                  name="flame-outline" 
                  size={36} 
                  color={isDarkMode ? '#ff9f43' : '#e67e22'} 
                  style={styles.streakIcon} 
                />
                <Text style={[styles.streakValue, isDarkMode && styles.darkText]}>
                  {streak}
                </Text>
                <Text style={[styles.streakLabel, isDarkMode && styles.darkText]}>
                  {t('stats.longestStreak')}
                </Text>
                <Text style={[styles.streakSubtext, isDarkMode && styles.darkText]}>
                  {streak > 0 
                    ? t('stats.streakMessage') 
                    : t('stats.startStreakMessage')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  dashboardContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dashboardCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  productivityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productivityCardContent: {
    padding: 8,
  },
  productivityDetails: {
    marginTop: 8,
  },
  productivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productivityLabel: {
    fontSize: 14,
    color: '#666',
  },
  productivityValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chartsContainer: {
    marginBottom: 24,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeFrameContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    padding: 2,
  },
  darkTimeFrameButton: {
    backgroundColor: '#333',
  },
  timeFrameButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  selectedTimeFrame: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  darkSelectedTimeFrame: {
    backgroundColor: '#555',
  },
  timeFrameText: {
    fontSize: 12,
    color: '#555',
  },
  selectedTimeFrameText: {
    fontWeight: 'bold',
    color: '#333',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  chartContent: {
    height: 200,
    marginTop: 12,
  },
  barContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: 12,
    height: '80%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#3498db',
    borderRadius: 6,
  },
  darkBar: {
    backgroundColor: '#3498db',
  },
  weekBar: {
    backgroundColor: '#2ecc71',
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  streakContainer: {
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  streakContent: {
    alignItems: 'center',
    padding: 16,
  },
  streakIcon: {
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  darkText: {
    color: '#f1f1f1',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    width: SCREEN_WIDTH * 0.44,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkSummaryCard: {
    backgroundColor: '#1E2A38',
  },
  cardContent: {
    alignItems: 'center',
    padding: 12,
  },
  cardIcon: {
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  summaryUnit: {
    fontSize: 12,
    color: '#95a5a6',
  },
  section: {
    marginBottom: 24,
  },
  darkSectionTitle: {
    color: '#ecf0f1',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkStatBox: {
    backgroundColor: '#2c3e50',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  resetButtonContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  resetButton: {
    width: '80%',
    borderRadius: 30,
    backgroundColor: '#3498db',
  },
  darkResetButton: {
    backgroundColor: '#2980b9',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  divider: {
    marginVertical: 16,
  },
});