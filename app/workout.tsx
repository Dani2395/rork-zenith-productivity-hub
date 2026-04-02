import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Trash2, Clock, Edit3, Camera, TrendingUp, X, Dumbbell, Copy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import type { ProgressImage } from '@/types';
import DateTimePicker from '@/components/DateTimePicker';

export default function WorkoutScreen() {
  const { 
    workouts, 
    addWorkout, 
    updateWorkout, 
    deleteWorkout,
    workoutTemplates,
    addWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
  } = useData();
  const [activeTab, setActiveTab] = useState<'workouts' | 'routines'>('workouts');
  const [modalVisible, setModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<number | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<number | null>(null);

  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutWeight, setWorkoutWeight] = useState('');
  const [progressImages, setProgressImages] = useState<ProgressImage[]>([]);

  const [progressWeight, setProgressWeight] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [progressImage, setProgressImage] = useState('');
  
  const [routineName, setRoutineName] = useState('');
  const [routineExercises, setRoutineExercises] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');

  const resetForm = () => {
    setWorkoutDate(new Date().toISOString().split('T')[0]);
    setWorkoutName('');
    setWorkoutExercises('');
    setWorkoutDuration('');
    setWorkoutNotes('');
    setWorkoutWeight('');
    setProgressImages([]);
    setEditingWorkout(null);
  };

  const resetRoutineForm = () => {
    setRoutineName('');
    setRoutineExercises('');
    setRoutineNotes('');
    setEditingRoutine(null);
  };

  const pickProgressImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProgressImage(result.assets[0].uri);
    }
  };

  const handleAddProgressImage = () => {
    if (!progressImage) return;

    const newImage: ProgressImage = {
      id: Date.now(),
      uri: progressImage,
      timestamp: new Date().toISOString(),
      weight: progressWeight ? parseFloat(progressWeight) : undefined,
      notes: progressNotes || undefined,
    };

    setProgressImages([...progressImages, newImage]);
    setProgressImage('');
    setProgressWeight('');
    setProgressNotes('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        weight: workoutWeight ? parseFloat(workoutWeight) : undefined,
        progressImages: progressImages.length > 0 ? progressImages : undefined,
      });
    } else {
      addWorkout({
        date: workoutDate,
        name: workoutName.trim() || 'Workout',
        exercises: workoutExercises.trim(),
        duration: parseInt(workoutDuration) || 0,
        notes: workoutNotes.trim(),
        weight: workoutWeight ? parseFloat(workoutWeight) : undefined,
        progressImages: progressImages.length > 0 ? progressImages : undefined,
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
      setWorkoutWeight(workout.weight?.toString() || '');
      setProgressImages(workout.progressImages || []);
      setModalVisible(true);
    }
  };

  const handleSaveRoutine = () => {
    if (!routineName.trim() || !routineExercises.trim()) return;

    if (editingRoutine) {
      updateWorkoutTemplate(editingRoutine, {
        name: routineName.trim(),
        exercises: routineExercises.trim(),
        notes: routineNotes.trim(),
      });
    } else {
      addWorkoutTemplate({
        name: routineName.trim(),
        exercises: routineExercises.trim(),
        notes: routineNotes.trim(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetRoutineForm();
    setRoutineModalVisible(false);
  };

  const handleEditRoutine = (routineId: number) => {
    const routine = workoutTemplates.find(r => r.id === routineId);
    if (routine) {
      setEditingRoutine(routineId);
      setRoutineName(routine.name);
      setRoutineExercises(routine.exercises);
      setRoutineNotes(routine.notes);
      setRoutineModalVisible(true);
    }
  };

  const handleUseRoutine = (routineId: number) => {
    const routine = workoutTemplates.find(r => r.id === routineId);
    if (routine) {
      resetForm();
      setWorkoutName(routine.name);
      setWorkoutExercises(routine.exercises);
      setWorkoutNotes(routine.notes);
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

  const allProgressImages = workouts
    .flatMap(w => (w.progressImages || []).map(img => ({ ...img, workoutDate: w.date })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const weightHistory = workouts
    .filter(w => w.weight !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(w => ({ date: w.date, weight: w.weight! }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>💪 Workout</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.progressButton}
            onPress={() => setProgressModalVisible(true)}
          >
            <TrendingUp size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (activeTab === 'workouts') {
                resetForm();
                setModalVisible(true);
              } else {
                resetRoutineForm();
                setRoutineModalVisible(true);
              }
            }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.addButtonGradient}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>{activeTab === 'workouts' ? 'Log' : 'Routine'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workouts' && styles.tabActive]}
          onPress={() => {
            setActiveTab('workouts');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Clock size={18} color={activeTab === 'workouts' ? Colors.primary : Colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.tabTextActive]}>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routines' && styles.tabActive]}
          onPress={() => {
            setActiveTab('routines');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Dumbbell size={18} color={activeTab === 'routines' ? Colors.primary : Colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'routines' && styles.tabTextActive]}>Routines</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'workouts' && (
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
      )}

      {activeTab === 'workouts' ? (
        <ScrollView style={styles.workoutList} showsVerticalScrollIndicator={false}>
          {sortedWorkouts.length === 0 ? (
            <Text style={styles.emptyText}>No workouts logged yet</Text>
          ) : (
            sortedWorkouts.map(workout => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDate}>{workout.date}</Text>
                  {workout.weight && (
                    <Text style={styles.workoutWeight}>⚖️ {workout.weight} lbs</Text>
                  )}
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
              
              {workout.progressImages && workout.progressImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.progressImagesScroll}>
                  {workout.progressImages.map(img => (
                    <Image key={img.id} source={{ uri: img.uri }} style={styles.progressImageThumb} />
                  ))}
                </ScrollView>
              )}

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
      ) : (
        <ScrollView style={styles.workoutList} showsVerticalScrollIndicator={false}>
          {workoutTemplates.length === 0 ? (
            <Text style={styles.emptyText}>No routines created yet</Text>
          ) : (
            workoutTemplates.map(routine => (
              <View key={routine.id} style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineExercisesPreview} numberOfLines={2}>
                      {routine.exercises}
                    </Text>
                  </View>
                  <View style={styles.routineActions}>
                    <TouchableOpacity
                      style={styles.useButton}
                      onPress={() => handleUseRoutine(routine.id)}
                    >
                      <Copy size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditRoutine(routine.id)}
                    >
                      <Edit3 size={18} color={Colors.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        deleteWorkoutTemplate(routine.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                    >
                      <Trash2 size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {routine.notes ? (
                  <Text style={styles.routineNotes}>{routine.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}

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

              <DateTimePicker
                label="Workout Date"
                date={workoutDate}
                time=""
                onDateChange={setWorkoutDate}
                onTimeChange={() => {}}
                showDate={true}
                showTime={false}
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

              <View style={styles.row}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Duration (min)"
                  placeholderTextColor={Colors.textDim}
                  value={workoutDuration}
                  onChangeText={setWorkoutDuration}
                  keyboardType="numeric"
                />
                <View style={{ width: 12 }} />
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Weight (lbs)"
                  placeholderTextColor={Colors.textDim}
                  value={workoutWeight}
                  onChangeText={setWorkoutWeight}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textDim}
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                multiline
              />

              <Text style={styles.inputLabel}>Progress Photos</Text>
              <View style={styles.progressSection}>
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickProgressImage}>
                  <Camera size={20} color={Colors.primary} />
                  <Text style={styles.addPhotoText}>Add Progress Photo</Text>
                </TouchableOpacity>

                {progressImage && (
                  <View style={styles.newProgressContainer}>
                    <Image source={{ uri: progressImage }} style={styles.newProgressImage} />
                    <View style={styles.newProgressInputs}>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="Weight (lbs)"
                        placeholderTextColor={Colors.textDim}
                        value={progressWeight}
                        onChangeText={setProgressWeight}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.smallInput, { flex: 1 }]}
                        placeholder="Notes (optional)"
                        placeholderTextColor={Colors.textDim}
                        value={progressNotes}
                        onChangeText={setProgressNotes}
                      />
                      <TouchableOpacity style={styles.addImageButton} onPress={handleAddProgressImage}>
                        <Plus size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {progressImages.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.progressImagesRow}>
                      {progressImages.map(img => (
                        <View key={img.id} style={styles.progressImageContainer}>
                          <Image source={{ uri: img.uri }} style={styles.progressImageSmall} />
                          <TouchableOpacity
                            style={styles.removeImageBtn}
                            onPress={() => setProgressImages(progressImages.filter(i => i.id !== img.id))}
                          >
                            <X size={12} color="white" />
                          </TouchableOpacity>
                          {img.weight && (
                            <Text style={styles.progressImageWeight}>{img.weight} lbs</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
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
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveWorkout}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Save Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={progressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📈 Progress Tracking</Text>

              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Weight History</Text>
                {weightHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No weight data yet</Text>
                ) : (
                  <View style={styles.weightHistoryList}>
                    {weightHistory.slice(-10).reverse().map((entry, idx) => (
                      <View key={idx} style={styles.weightHistoryItem}>
                        <Text style={styles.weightDate}>{entry.date}</Text>
                        <Text style={styles.weightValue}>{entry.weight} lbs</Text>
                        {idx < weightHistory.length - 1 && (
                          <Text style={[
                            styles.weightChange,
                            entry.weight < weightHistory[weightHistory.length - idx - 2].weight
                              ? styles.weightDown
                              : styles.weightUp
                          ]}>
                            {entry.weight < weightHistory[weightHistory.length - idx - 2].weight ? '↓' : '↑'}
                            {Math.abs(entry.weight - weightHistory[weightHistory.length - idx - 2].weight).toFixed(1)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.sectionTitle}>Progress Photos</Text>
                {allProgressImages.length === 0 ? (
                  <Text style={styles.emptyText}>No progress photos yet</Text>
                ) : (
                  <View style={styles.progressPhotosGrid}>
                    {allProgressImages.map((img) => (
                      <TouchableOpacity
                        key={img.id}
                        style={styles.progressPhotoCard}
                        onPress={() => {
                          Alert.alert(
                            'Progress Photo',
                            `Date: ${img.workoutDate}\n${img.weight ? `Weight: ${img.weight} lbs\n` : ''}${img.notes || ''}`
                          );
                        }}
                      >
                        <Image source={{ uri: img.uri }} style={styles.progressPhotoImage} />
                        <View style={styles.progressPhotoInfo}>
                          <Text style={styles.progressPhotoDate}>{img.workoutDate}</Text>
                          {img.weight && (
                            <Text style={styles.progressPhotoWeight}>{img.weight} lbs</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setProgressModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={routineModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoutineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingRoutine ? '✏️ Edit Routine' : '🏋️ New Routine'}</Text>

              <Text style={styles.inputLabel}>Routine Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Push Day, Leg Day, Full Body"
                placeholderTextColor={Colors.textDim}
                value={routineName}
                onChangeText={setRoutineName}
              />

              <Text style={styles.inputLabel}>Exercises *</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="List exercises (one per line)&#10;Example:&#10;Bench Press - 3x10&#10;Incline Dumbbell Press - 3x12&#10;Cable Flyes - 3x15"
                placeholderTextColor={Colors.textDim}
                value={routineExercises}
                onChangeText={setRoutineExercises}
                multiline
              />

              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 80 }]}
                placeholder="Add any notes, tips, or reminders for this routine"
                placeholderTextColor={Colors.textDim}
                value={routineNotes}
                onChangeText={setRoutineNotes}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    resetRoutineForm();
                    setRoutineModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButtonPrimary, (!routineName.trim() || !routineExercises.trim()) && styles.buttonDisabled]} 
                  onPress={handleSaveRoutine}
                  disabled={!routineName.trim() || !routineExercises.trim()}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Save Routine</Text>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  progressButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 20,
    marginBottom: 20,
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
  workoutWeight: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600' as const,
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
  progressImagesScroll: {
    marginBottom: 12,
  },
  progressImageThumb: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  routineCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  routineExercisesPreview: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 20,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  useButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineNotes: {
    fontSize: 13,
    color: Colors.textDim,
    fontStyle: 'italic' as const,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  newProgressContainer: {
    marginBottom: 12,
  },
  newProgressImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  newProgressInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  smallInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    color: Colors.text,
    fontSize: 13,
    width: 90,
  },
  addImageButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressImagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressImageContainer: {
    position: 'relative',
  },
  progressImageSmall: {
    width: 100,
    height: 130,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressImageWeight: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    color: 'white',
    fontWeight: '600' as const,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  weightHistoryList: {
    marginBottom: 24,
  },
  weightHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightDate: {
    fontSize: 13,
    color: Colors.textDim,
    flex: 1,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginRight: 12,
  },
  weightChange: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  weightDown: {
    color: Colors.success,
  },
  weightUp: {
    color: Colors.danger,
  },
  progressPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressPhotoCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressPhotoImage: {
    width: '100%',
    height: 200,
  },
  progressPhotoInfo: {
    padding: 8,
  },
  progressPhotoDate: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: 4,
  },
  progressPhotoWeight: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
