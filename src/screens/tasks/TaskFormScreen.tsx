import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { createTask, updateTask } from '../../services/tasks';
import { TasksStackParamList } from '../../navigation';
import { Task } from '../../types/task';

type TaskFormScreenProps = {
  navigation: NativeStackNavigationProp<TasksStackParamList, 'TaskForm'>;
  route: RouteProp<TasksStackParamList, 'TaskForm'>;
};

export const TaskFormScreen = ({ navigation, route }: TaskFormScreenProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const taskToEdit = route.params?.task as Task | undefined;
  const isEditing = !!taskToEdit;
  
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [priority, setPriority] = useState(taskToEdit?.priority || 2); // Orta öncelik varsayılan
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(
    taskToEdit?.estimated_pomodoros?.toString() || '1'
  );
  const [completed, setCompleted] = useState(taskToEdit?.completed || false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('tasks.titleRequired'));
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isEditing && taskToEdit) {
        // Mevcut görevi güncelle
        console.log('Updating task with ID:', taskToEdit.id);
        
        const updates: Partial<Task> = {
          title,
          description,
          priority,
          estimated_pomodoros: parseInt(estimatedPomodoros) || 1,
          completed
        };
        
        console.log('Update data:', updates);
        
        const { data, error } = await updateTask(taskToEdit.id, updates);
        
        if (error) {
          console.error('Task update error:', JSON.stringify(error, null, 2));
          throw new Error(`Update failed: ${error.message || JSON.stringify(error)}`);
        }
        
        console.log('Task updated successfully:', data);
        Alert.alert(t('common.success'), t('tasks.updateSuccess'));
      } else {
        // Yeni görev oluştur
        console.log('Creating new task for user:', user.id);
        
        const newTask: Partial<Task> = {
          user_id: user.id,
          title,
          description,
          priority,
          estimated_pomodoros: parseInt(estimatedPomodoros) || 1,
          completed_pomodoros: 0,
          completed: false,
          active: false
        };
        
        console.log('New task data:', newTask);
        
        const { data, error } = await createTask(newTask);
        
        if (error) {
          console.error('Task creation error:', JSON.stringify(error, null, 2));
          
          // Tam hata mesajını göster
          const errorMessage = `${t('tasks.createError')}: ${error.message || JSON.stringify(error)}`;
          Alert.alert(t('common.error'), errorMessage);
          setIsLoading(false);
          return;
        }
        
        console.log('Task created successfully:', data);
        Alert.alert(t('common.success'), t('tasks.createSuccess'));
      }
      
      navigation.goBack();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Save task error:', errorMessage);
      Alert.alert(
        t('common.error'), 
        isEditing 
          ? `${t('tasks.updateError')}: ${errorMessage}` 
          : `${t('tasks.createError')}: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderPrioritySelector = () => {
    return (
      <View style={styles.prioritySelector}>
        <TouchableOpacity
          style={[
            styles.priorityOption,
            { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
            isDarkMode && styles.darkPriorityOption,
            priority === 1 && styles.lowPrioritySelected
          ]}
          onPress={() => setPriority(1)}
        >
          <Text style={[
            styles.priorityText,
            isDarkMode && styles.darkPriorityText,
            priority === 1 && styles.selectedPriorityText
          ]}>
            {t('tasks.low')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.priorityOption,
            isDarkMode && styles.darkPriorityOption,
            priority === 2 && styles.mediumPrioritySelected
          ]}
          onPress={() => setPriority(2)}
        >
          <Text style={[
            styles.priorityText,
            isDarkMode && styles.darkPriorityText,
            priority === 2 && styles.selectedPriorityText
          ]}>
            {t('tasks.medium')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.priorityOption,
            { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
            isDarkMode && styles.darkPriorityOption,
            priority === 3 && styles.highPrioritySelected
          ]}
          onPress={() => setPriority(3)}
        >
          <Text style={[
            styles.priorityText,
            isDarkMode && styles.darkPriorityText,
            priority === 3 && styles.selectedPriorityText
          ]}>
            {t('tasks.high')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Container useScrollView={false}>
      <ScrollView style={styles.container}>
        <Text style={[
          styles.title,
          isDarkMode && styles.darkTitle
        ]}>
          {isEditing ? t('tasks.editTask') : t('tasks.addTask')}
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>
            {t('tasks.taskTitle')} *
          </Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode && styles.darkInput
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('tasks.taskTitle')}
            placeholderTextColor={isDarkMode ? '#95a5a6' : '#bdc3c7'}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>
            {t('tasks.taskDescription')}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              isDarkMode && styles.darkInput
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('tasks.taskDescription')}
            placeholderTextColor={isDarkMode ? '#95a5a6' : '#bdc3c7'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>
            {t('tasks.priority')}
          </Text>
          {renderPrioritySelector()}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[
            styles.label,
            isDarkMode && styles.darkLabel
          ]}>
            {t('tasks.estimatedPomodoros')}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.numberInput,
              isDarkMode && styles.darkInput
            ]}
            value={estimatedPomodoros}
            onChangeText={setEstimatedPomodoros}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={isDarkMode ? '#95a5a6' : '#bdc3c7'}
          />
        </View>
        
        {isEditing && (
          <View style={styles.switchContainer}>
            <Text style={[
              styles.switchLabel,
              isDarkMode && styles.darkLabel
            ]}>
              {t('tasks.completed')}
            </Text>
            <Switch
              value={completed}
              onValueChange={setCompleted}
              trackColor={{ false: '#95a5a6', true: '#2ecc71' }}
              thumbColor={completed ? '#27ae60' : '#7f8c8d'}
            />
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleSave}
            title={isLoading ? '' : (isEditing ? t('tasks.updateTask') : t('tasks.createTask'))}
            disabled={isLoading}
          >
            {isLoading && <ActivityIndicator color="#fff" />}
          </Button>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={[
              styles.cancelButtonText,
              isDarkMode && styles.darkCancelButtonText
            ]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  darkLabel: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  darkInput: {
    backgroundColor: '#34495e',
    borderColor: '#2c3e50',
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
  },
  numberInput: {
    width: '30%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  prioritySelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPriorityOption: {
    backgroundColor: '#34495e',
    borderColor: '#2c3e50',
  },
  priorityText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  darkPriorityText: {
    color: '#bdc3c7',
  },
  selectedPriority: {
    borderWidth: 2,
  },
  selectedPriorityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  lowPrioritySelected: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
    borderWidth: 2,
  },
  mediumPrioritySelected: {
    backgroundColor: '#f39c12',
    borderColor: '#e67e22',
    borderWidth: 2,
  },
  highPrioritySelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
    borderWidth: 2,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  darkCancelButtonText: {
    color: '#2980b9',
  },
}); 