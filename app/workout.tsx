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
import { Plus, Trash2, Clock, Edit3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

export default function WorkoutScreen() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<number | null>(null);

  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const resetForm = () => {
    setWorkoutDate(new Date().toISOString().split('T')[0]);
    setWorkoutName('');
    setWorkoutExercises('');
    setWorkoutDuration('');
    setWorkoutNotes('');
    setEditingWorkout(null);
  };

  const handleSaveWorkout = () => {
    if (!workoutDate || !workoutExercises.trim()) return;

    if (editingWorkout) {
      updateWorkout(editingWorkout, {
        date: workoutDate,
        name: workoutName.trim() || 'Workout',
        exercises: workoutExercises.trim(),
        duration: parseInt(workoutDuration) || 0,
        notes: workoutNotes.trim(),
      });
    } else {
      addWorkout({
        date: workoutDate,
        name: workoutName.trim() || 'Workout',
        exercises: workoutExercises.trim(),
        duration: parseInt(workoutDuration) || 0,
        notes: workoutNotes.trim(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setModalVisible(false);
  };

  const handleEditWorkout = (workoutId: number) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setEditingWorkout(workoutId);
      setWorkoutDate(workout.date);
      setWorkoutName(workout.name);
      setWorkoutExercises(workout.exercises);
      setWorkoutDuration(workout.duration.toString());
      setWorkoutNotes(workout.notes);
      setModalVisible(true);
    }
  };

  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const thisWeekWorkouts = sortedWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo && workoutDate <= today;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>💪 Workout Log</Text>
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
            <Text style={styles.addButtonText}>Log Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{thisWeekWorkouts.length}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {thisWeekWorkouts.reduce((sum, w) => sum + w.duration, 0)}
          </Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      <ScrollView style={styles.workoutList} showsVerticalScrollIndicator={false}>
        {sortedWorkouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts logged yet</Text>
        ) : (
          sortedWorkouts.map(workout => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDate}>{workout.date}</Text>
                </View>
                <View style={styles.workoutActions}>
                  {workout.duration > 0 && (
                    <View style={styles.durationBadge}>
                      <Clock size={12} color={Colors.primary} />
                      <Text style={styles.durationText}>{workout.duration} min</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditWorkout(workout.id)}
                  >
                    <Edit3 size={18} color={Colors.textDim} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      deleteWorkout(workout.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <Trash2 size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.exercisesContainer}>
                <Text style={styles.exercisesText}>{workout.exercises}</Text>
              </View>
              {workout.notes ? (
                <Text style={styles.workoutNotes}>{workout.notes}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingWorkout ? '✏️ Edit Workout' : '💪 Log Workout'}</Text>

              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textDim}
                value={workoutDate}
                onChangeText={setWorkoutDate}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Workout name (optional)"
                placeholderTextColor={Colors.textDim}
                value={workoutName}
                onChangeText={setWorkoutName}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Exercises (one per line)&#10;Example:&#10;Bench Press - 3x10 @ 135lbs&#10;Squats - 4x8 @ 185lbs"
                placeholderTextColor={Colors.textDim}
                value={workoutExercises}
                onChangeText={setWorkoutExercises}
                multiline
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Duration (minutes)"
                placeholderTextColor={Colors.textDim}
                value={workoutDuration}
                onChangeText={setWorkoutDuration}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textDim}
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                multiline
              />

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
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveWorkout}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Log Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  workoutList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    marginTop: 40,
    fontSize: 14,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  workoutDate: {
    fontSize: 14,
    color: Colors.textDim,
    marginTop: 2,
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
  },
  exercisesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  workoutNotes: {
    fontSize: 13,
    color: Colors.textDim,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalScroll: {
    flex: 1,
    marginTop: 80,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
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
    minHeight: 120,
    textAlignVertical: 'top',
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
