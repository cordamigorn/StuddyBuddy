import { supabase } from './supabase';
import { Task } from '../types/task';

// Kullanıcının görevlerini getir
export const getTasks = async (userId: string) => {
  return await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

// Yeni görev oluştur
export const createTask = async (taskData: Partial<Task>) => {
  try {
    // Tam hata ayıklama için girdi verilerini yazdıralım
    console.log('createTask input data:', JSON.stringify(taskData, null, 2));
    
    // Gerekli alanları kontrol et
    if (!taskData.user_id) {
      console.error('createTask error: user_id missing');
      return { 
        data: null, 
        error: { message: 'user_id is required', code: 'invalid_input' } 
      };
    }
    
    if (!taskData.title) {
      console.error('createTask error: title missing');
      return { 
        data: null, 
        error: { message: 'title is required', code: 'invalid_input' } 
      };
    }
    
    // Temel veri modelini oluştur (minimum gerekli alanlar)
    const safeTaskData = {
      user_id: taskData.user_id,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 2,
      estimated_pomodoros: taskData.estimated_pomodoros || 1,
      completed_pomodoros: 0,
      completed: false,
      active: false
    };
    
    console.log('Sending to database:', JSON.stringify(safeTaskData, null, 2));
    
    // Veritabanına ekle
    const result = await supabase
      .from('tasks')
      .insert(safeTaskData);
      
    if (result.error) {
      console.error('Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('createTask unexpected error:', error);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred', details: error } 
    };
  }
};

// Görevi güncelle
export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  return await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
};

// Görevi sil
export const deleteTask = async (taskId: string) => {
  return await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
};

// Görev tamamlama durumunu değiştir
export const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
  try {
    // Önce tablo şemasını kontrol edelim
    const { error: schemaError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    // Eğer completed sütunu yoksa hata oluşacak, güvenli bir şekilde işlemi atlayalım
    if (schemaError && schemaError.message.includes('completed')) {
      console.log('completed sütunu bulunamadı, işlem atlanıyor');
      return { data: null, error: null };
    }
    
    return await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', taskId);
  } catch (error) {
    console.error('toggleTaskCompletion error:', error);
    return { data: null, error };
  }
};

// Bir görevde tamamlanan pomodoro sayısını artır
export const incrementCompletedPomodoros = async (taskId: string) => {
  // Önce mevcut değeri al
  const { data, error } = await supabase
    .from('tasks')
    .select('completed_pomodoros, estimated_pomodoros')
    .eq('id', taskId)
    .single();
  
  if (error || !data) {
    return { data: null, error };
  }
  
  const completedPomodoros = data.completed_pomodoros + 1;
  
  // Tamamlanan pomodoro sayısı tahmin edileni geçmesin
  const updatedValue = Math.min(completedPomodoros, data.estimated_pomodoros);
  
  // Tüm pomodorolar tamamlandı mı kontrol et
  const isTaskCompleted = updatedValue >= data.estimated_pomodoros;
  
  // Değeri güncelle
  return await supabase
    .from('tasks')
    .update({ 
      completed_pomodoros: updatedValue,
      completed: isTaskCompleted // Tüm pomodorolar tamamlandıysa görevi de tamamlanmış olarak işaretle
    })
    .eq('id', taskId);
};

// Görev tamamlanma durumunu kontrol et ve gerekirse işaretle
export const checkAndCompleteTask = async (taskId: string) => {
  try {
    // Görev bilgisini al
    const { data, error } = await supabase
      .from('tasks')
      .select('completed_pomodoros, estimated_pomodoros, completed')
      .eq('id', taskId)
      .single();
    
    if (error || !data) {
      console.error('Task data fetch error:', error);
      return { data: null, error };
    }
    
    // Eğer tüm pomodorolar tamamlandıysa ve görev henüz tamamlanmış olarak işaretlenmediyse
    if (data.completed_pomodoros >= data.estimated_pomodoros && !data.completed) {
      console.log(`Task ${taskId} completed. Marking as done.`);
      
      // Görevi tamamlanmış olarak işaretle
      return await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('checkAndCompleteTask error:', error);
    return { data: null, error };
  }
};

// Görev filtreleme - tamamlanmış görevler
export const getCompletedTasks = async (userId: string) => {
  try {
    // Önce tablo şemasını kontrol edelim
    const { error: schemaError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    // Eğer completed sütunu yoksa tüm görevleri getirelim
    if (schemaError && schemaError.message.includes('completed')) {
      console.log('completed sütunu bulunamadı, tüm görevler getiriliyor');
      return await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    }
    
    return await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('updated_at', { ascending: false });
  } catch (error) {
    console.error('getCompletedTasks error:', error);
    return { data: null, error };
  }
};

// Görev filtreleme - tamamlanmamış görevler
export const getIncompleteTasks = async (userId: string) => {
  try {
    // Önce tablo şemasını kontrol edelim
    const { error: schemaError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    // Eğer completed sütunu yoksa tüm görevleri getirelim
    if (schemaError && schemaError.message.includes('completed')) {
      console.log('completed sütunu bulunamadı, tüm görevler getiriliyor');
      return await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    }
    
    return await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('getIncompleteTasks error:', error);
    return { data: null, error };
  }
};

// Görev arama
export const searchTasks = async (userId: string, searchTerm: string) => {
  return await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .ilike('title', `%${searchTerm}%`)
    .order('created_at', { ascending: false });
};

// Görevi aktif olarak işaretle ve diğer görevleri pasif yap
export const setActiveTask = async (userId: string, taskId: string) => {
  // Önce tüm görevleri pasif yap
  await supabase
    .from('tasks')
    .update({ active: false })
    .eq('user_id', userId);
  
  // Sonra seçili görevi aktif yap
  return await supabase
    .from('tasks')
    .update({ active: true })
    .eq('id', taskId);
}; 