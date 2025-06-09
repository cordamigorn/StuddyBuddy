import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getTasks, toggleTaskCompletion, deleteTask } from '../../services/tasks';
import { Task } from '../../types/task';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TasksStackParamList } from '../../navigation';

type TasksScreenProps = {
  navigation: NativeStackNavigationProp<TasksStackParamList, 'TasksList'>;
};

export const TasksScreen = ({ navigation }: TasksScreenProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    
    // Görevler listesini her görüntülendiğinde güncelle
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await getTasks(user.id);
      
      if (error) {
        console.error('Load tasks error:', error);
        return;
      }
      
      setTasks(data || []);
    } catch (error) {
      console.error('Load tasks error:', error);
      Alert.alert(t('common.error'), t('tasks.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompletion = async (task: Task) => {
    try {
      const { error } = await toggleTaskCompletion(task.id, !task.completed);
      
      if (error) {
        throw error;
      }
      
      // Yerel durumu güncelle
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error('Toggle task completion error:', error);
      Alert.alert(t('common.error'), t('tasks.updateError'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      t('tasks.deleteConfirmation'),
      t('tasks.deleteWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteTask(taskId);
              
              if (error) {
                throw error;
              }
              
              // Yerel durumu güncelle
              setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            } catch (error) {
              console.error('Delete task error:', error);
              Alert.alert(t('common.error'), t('tasks.deleteError'));
            }
          } 
        }
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    return (
      <View 
        style={[
          styles.taskItem,
          isDarkMode && styles.darkTaskItem
        ]}
      >
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => navigation.navigate('TaskForm', { task: item })}
        >
          <Text style={[
            styles.taskTitle,
            isDarkMode && styles.darkTaskTitle,
            item.completed && styles.completedTaskTitle
          ]}>
            {item.title}
          </Text>
          
          {item.description ? (
            <Text 
              style={[
                styles.taskDescription,
                isDarkMode && styles.darkTaskDescription,
                item.completed && styles.completedTaskDescription
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.priorityContainer}>
            <Text style={[
              styles.priorityLabel,
              isDarkMode && styles.darkText
            ]}>
              {t('tasks.priority')}:
            </Text>
            <View style={[
              styles.priorityBadge,
              item.priority === 1 && styles.lowPriority,
              item.priority === 2 && styles.mediumPriority,
              item.priority === 3 && styles.highPriority,
            ]} />
            <Text style={[
              styles.priorityText,
              isDarkMode && styles.darkText
            ]}>
              {item.priority === 1 && t('tasks.low')}
              {item.priority === 2 && t('tasks.medium')}
              {item.priority === 3 && t('tasks.high')}
            </Text>
          </View>
          
          <View style={styles.pomodoroCount}>
            <Ionicons 
              name="timer-outline" 
              size={16} 
              color={isDarkMode ? "#95a5a6" : "#7f8c8d"} 
            />
            <Text style={[
              styles.pomodoroCountText,
              isDarkMode && styles.darkText
            ]}>
              {item.completed_pomodoros}/{item.estimated_pomodoros}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.taskActions}>
          <TouchableOpacity 
            style={styles.taskStatusAction}
            onPress={() => handleToggleCompletion(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <View style={[
              styles.statusIndicator,
              item.completed ? styles.completedIndicator : styles.pendingIndicator
            ]} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDeleteTask(item.id)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MaterialIcons 
              name="delete-outline" 
              size={22} 
              color={isDarkMode ? "#e74c3c" : "#c0392b"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="list-outline" 
          size={64} 
          color={isDarkMode ? "#555555" : "#dddddd"} 
        />
        <Text style={[
          styles.emptyText,
          isDarkMode && styles.darkEmptyText
        ]}>
          {t('tasks.noTasks')}
        </Text>
        <Text style={[
          styles.emptySubText,
          isDarkMode && styles.darkEmptySubText
        ]}>
          {t('tasks.addTasksToGetStarted')}
        </Text>
      </View>
    );
  };

  return (
    <Container useScrollView={false}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[
            styles.title,
            isDarkMode && styles.darkTitle
          ]}>{t('tasks.title')}</Text>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('TaskForm')}
          >
            <Ionicons 
              name="add-circle" 
              size={32} 
              color={isDarkMode ? "#3498db" : "#2980b9"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.listContainer}>
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshing={isLoading}
          onRefresh={loadTasks}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          initialNumToRender={10}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkTaskItem: {
    backgroundColor: '#2c3e50',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  darkTaskTitle: {
    color: '#ecf0f1',
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  darkTaskDescription: {
    color: '#95a5a6',
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 4,
  },
  priorityBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  lowPriority: {
    backgroundColor: '#2ecc71',
  },
  mediumPriority: {
    backgroundColor: '#f39c12',
  },
  highPriority: {
    backgroundColor: '#e74c3c',
  },
  priorityText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  darkText: {
    color: '#95a5a6',
  },
  pomodoroCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pomodoroCountText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  taskActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  taskStatusAction: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  deleteAction: {
    paddingTop: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  pendingIndicator: {
    borderColor: '#e9ecef',
    backgroundColor: '#FFFFFF',
  },
  completedIndicator: {
    borderColor: '#2ecc71',
    backgroundColor: '#2ecc71',
  },
  addButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  darkEmptyText: {
    color: '#ecf0f1',
  },
  emptySubText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  darkEmptySubText: {
    color: '#95a5a6',
  },
}); 