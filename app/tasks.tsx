import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Plus, Trash2, Edit3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

const CATEGORIES = [
  { value: '', label: 'None' },
  { value: 'Work', label: '💼 Work' },
  { value: 'Personal', label: '👤 Personal' },
  { value: 'Shopping', label: '🛒 Shopping' },
  { value: 'Health', label: '💪 Health' },
  { value: 'Finance', label: '💰 Finance' },
];

export default function TasksScreen() {
  const { tasks, taskLists, addTask, updateTask, deleteTask, toggleTask } = useData();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);

  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskListId, setTaskListId] = useState<number | null>(null);
  const [taskCategory, setTaskCategory] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < new Date(today);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (selectedList !== null && task.listId !== selectedList) {
      return false;
    }

    switch (filter) {
      case 'completed':
        return task.completed;
      case 'today':
        return task.date === today && !task.completed;
      case 'overdue':
        return task.date && isPast(task.date) && !task.completed;
      case 'upcoming':
        return task.date && !isPast(task.date) && !task.completed;
      default:
        return !task.completed;
    }
  });

  const resetForm = () => {
    setTaskName('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDate('');
    setTaskTime('');
    setTaskListId(null);
    setTaskCategory('');
    setEditingTask(null);
  };

  const handleSaveTask = () => {
    if (!taskName.trim()) return;

    if (editingTask) {
      updateTask(editingTask, {
        name: taskName.trim(),
        desc: taskDesc,
        priority: taskPriority,
        date: taskDate,
        time: taskTime,
        listId: taskListId,
        category: taskCategory,
      });
    } else {
      addTask({
        name: taskName.trim(),
        desc: taskDesc,
        priority: taskPriority,
        date: taskDate,
        time: taskTime,
        recurring: 'none',
        completed: false,
        listId: taskListId,
        category: taskCategory,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setModalVisible(false);
  };

  const handleEditTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setTaskName(task.name);
      setTaskDesc(task.desc);
      setTaskPriority(task.priority);
      setTaskDate(task.date);
      setTaskTime(task.time);
      setTaskListId(task.listId || null);
      setTaskCategory(task.category || '');
      setModalVisible(true);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTask(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ];

  const priorityColors = {
    high: Colors.danger,
    medium: Colors.warning,
    low: Colors.success,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>✅ Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.addButtonGradient}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.listsScroll}
        contentContainerStyle={styles.listsContainer}
      >
        <TouchableOpacity
          style={[styles.listChip, selectedList === null && styles.listChipActive]}
          onPress={() => setSelectedList(null)}
        >
          <Text style={[styles.listChipText, selectedList === null && styles.listChipTextActive]}>
            All Tasks
          </Text>
        </TouchableOpacity>
        {taskLists.map(list => (
          <TouchableOpacity
            key={list.id}
            style={[
              styles.listChip,
              selectedList === list.id && styles.listChipActive,
              selectedList === list.id && { borderColor: list.color },
            ]}
            onPress={() => setSelectedList(list.id)}
          >
            <Text style={styles.listChipIcon}>{list.icon}</Text>
            <Text style={[styles.listChipText, selectedList === list.id && styles.listChipTextActive]}>
              {list.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        style={styles.searchInput}
        placeholder="Search tasks..."
        placeholderTextColor={Colors.textDim}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks found</Text>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = task.date && isPast(task.date) && !task.completed;
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  task.completed && styles.taskItemCompleted,
                  isOverdue && styles.taskItemOverdue,
                ]}
                onPress={() => {
                  toggleTask(task.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: priorityColors[task.priority] },
                      ]}
                    />
                    <Text
                      style={[styles.taskName, task.completed && styles.taskNameCompleted]}
                      numberOfLines={1}
                    >
                      {task.name}
                    </Text>
                  </View>
                  {task.desc ? (
                    <Text style={styles.taskDesc} numberOfLines={1}>
                      {task.desc}
                    </Text>
                  ) : null}
                  <View style={styles.taskMeta}>
                    {task.date && (
                      <Text style={[styles.taskMetaText, isOverdue && styles.taskMetaOverdue]}>
                        📅 {task.date}
                      </Text>
                    )}
                    {task.time && <Text style={styles.taskMetaText}>⏰ {task.time}</Text>}
                    <Text
                      style={[
                        styles.taskPriority,
                        { color: priorityColors[task.priority] },
                      ]}
                    >
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.taskActionButton}
                    onPress={() => handleEditTask(task.id)}
                  >
                    <Edit3 size={18} color={Colors.textDim} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.taskActionButton}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? '✏️ Edit Task' : 'Add Task'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Task name *"
              placeholderTextColor={Colors.textDim}
              value={taskName}
              onChangeText={setTaskName}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description"
              placeholderTextColor={Colors.textDim}
              value={taskDesc}
              onChangeText={setTaskDesc}
              multiline
            />

            <View style={styles.prioritySelector}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      taskPriority === p && styles.priorityButtonActive,
                      taskPriority === p && { backgroundColor: priorityColors[p] },
                    ]}
                    onPress={() => setTaskPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        taskPriority === p && styles.priorityButtonTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={Colors.textDim}
                value={taskDate}
                onChangeText={setTaskDate}
              />
              <View style={{ width: 8 }} />
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Time (HH:MM)"
                placeholderTextColor={Colors.textDim}
                value={taskTime}
                onChangeText={setTaskTime}
              />
            </View>

            <View style={styles.listSelector}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.listOption, taskCategory === cat.value && styles.listOptionActive]}
                    onPress={() => setTaskCategory(cat.value)}
                  >
                    <Text style={styles.listOptionText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.listSelector}>
              <Text style={styles.inputLabel}>List</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.listOption, taskListId === null && styles.listOptionActive]}
                  onPress={() => setTaskListId(null)}
                >
                  <Text style={styles.listOptionText}>None</Text>
                </TouchableOpacity>
                {taskLists.map(list => (
                  <TouchableOpacity
                    key={list.id}
                    style={[styles.listOption, taskListId === list.id && styles.listOptionActive]}
                    onPress={() => setTaskListId(list.id)}
                  >
                    <Text style={styles.listOptionText}>
                      {list.icon} {list.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveTask}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save Task</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  listsScroll: {
    maxHeight: 50,
  },
  listsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  listChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listChipIcon: {
    fontSize: 14,
  },
  listChipText: {
    fontSize: 13,
    color: Colors.textDim,
  },
  listChipTextActive: {
    color: 'white',
  },
  filtersScroll: {
    maxHeight: 50,
    marginTop: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textDim,
  },
  filterChipTextActive: {
    color: 'white',
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    marginTop: 40,
    fontSize: 14,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskItemCompleted: {
    opacity: 0.5,
  },
  taskItemOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
  },
  taskDesc: {
    fontSize: 13,
    color: Colors.textDim,
    marginTop: 4,
    marginLeft: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  taskMetaText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  taskMetaOverdue: {
    color: Colors.danger,
    fontWeight: '700' as const,
  },
  taskPriority: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskActionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  modalTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
  },
  prioritySelector: {
    marginBottom: 12,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityButtonActive: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  listSelector: {
    marginBottom: 16,
  },
  listOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listOptionText: {
    fontSize: 13,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
});
