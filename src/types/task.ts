export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3; // 1: Düşük, 2: Orta, 3: Yüksek
  estimated_pomodoros: number;
  completed_pomodoros: number;
  completed: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
} 