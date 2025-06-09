export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id?: string;
  start_time: string; // ISO string formatı
  end_time: string; // ISO string formatı
  duration: number; // dakika cinsinden
  type: 'work' | 'break';
  completed: boolean;
} 