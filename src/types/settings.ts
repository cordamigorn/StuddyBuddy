export interface UserSettings {
  user_id: string;
  work_duration: number; // dakika
  short_break_duration: number; // dakika
  long_break_duration: number; // dakika
  long_break_interval: number; // x pomodoro'dan sonra uzun mola
  notifications_enabled: boolean;
  dark_mode: boolean;
} 