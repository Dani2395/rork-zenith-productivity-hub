import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { Holiday } from '@/types';
import DateTimePicker from '@/components/DateTimePicker';

export default function CalendarScreen() {
  const { events, tasks, workouts, notes, addEvent, holidays, addHoliday, updateHoliday, deleteHoliday } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(todayString);
  const [modalVisible, setModalVisible] = useState(false);
  const [animationParticles, setAnimationParticles] = useState<any[]>([]);
  const animationRef = useRef<number | null>(null);

  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidayEmoji, setHolidayEmoji] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayAnimation, setHolidayAnimation] = useState<Holiday['animation']>('sparkles');
  const [holidayImage, setHolidayImage] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getHoliday = (dateStr: string) => {
    return holidays.find(h => h.date === dateStr);
  };

  const getDateEvents = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const getDateTasks = (dateStr: string) => {
    return tasks.filter(t => t.date === dateStr && !t.completed);
  };

  const getDateWorkouts = (dateStr: string) => {
    return workouts.filter(w => w.date === dateStr);
  };

  const getDateNotes = (dateStr: string) => {
    return notes.filter(n => n.date === dateStr);
  };

  const handleDatePress = (day: number) => {
    const dateStr = getDateStr(day);
    setSelectedDate(dateStr);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const holiday = getHoliday(dateStr);
    if (holiday?.animation) {
      startAnimation(holiday.animation);
    }
  };

  const startAnimation = (type: string) => {
    const particleCount = type === 'fireworks' ? 60 : type === 'snow' ? 50 : type === 'confetti' ? 70 : type === 'stars' ? 40 : 45;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      let startX, startY, endX, endY, duration, delay;
      
      switch(type) {
        case 'fireworks':
          startX = 50;
          startY = 80;
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
          const distance = 30 + Math.random() * 50;
          endX = startX + Math.cos(angle) * distance;
          endY = startY - Math.sin(angle) * distance;
          duration = 1200 + Math.random() * 800;
          delay = Math.random() * 300;
          break;
        case 'snow':
          startX = Math.random() * 100;
          startY = -20 - Math.random() * 30;
          endX = startX + (Math.random() - 0.5) * 30;
          endY = 120;
          duration = 3000 + Math.random() * 3000;
          delay = Math.random() * 1000;
          break;
        case 'hearts':
          startX = Math.random() * 100;
          startY = 120;
          endX = startX + (Math.random() - 0.5) * 40;
          endY = -20;
          duration = 2500 + Math.random() * 1500;
          delay = Math.random() * 500;
          break;
        case 'confetti':
          startX = Math.random() * 100;
          startY = -20;
          endX = startX + (Math.random() - 0.5) * 60;
          endY = 120;
          duration = 2000 + Math.random() * 1500;
          delay = Math.random() * 700;
          break;
        case 'stars':
          startX = Math.random() * 100;
          startY = Math.random() * 100;
          endX = startX;
          endY = startY;
          duration = 1000 + Math.random() * 1000;
          delay = Math.random() * 400;
          break;
        default:
          startX = Math.random() * 100;
          startY = Math.random() * 50;
          endX = startX + (Math.random() - 0.5) * 30;
          endY = 100 + Math.random() * 20;
          duration = 1800 + Math.random() * 1200;
          delay = Math.random() * 500;
      }
      
      particles.push({
        id: i,
        x: startX,
        y: startY,
        endX,
        endY,
        delay,
        duration,
        rotation: Math.random() * 720,
        scale: 0.6 + Math.random() * 1.2,
        opacity: new Animated.Value(1),
      });
    }
    
    setAnimationParticles(particles);
    
    particles.forEach(particle => {
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: particle.duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
    
    setTimeout(() => setAnimationParticles([]), 8000);
  };

  useEffect(() => {
    const currentRef = animationRef.current;
    return () => {
      if (currentRef) {
        cancelAnimationFrame(currentRef);
      }
    };
  }, []);

  const handleAddEvent = () => {
    if (!eventName.trim() || !selectedDate) return;

    addEvent({
      name: eventName.trim(),
      desc: eventDesc,
      date: selectedDate,
      time: eventTime,
      recurring: 'none',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEventName('');
    setEventDesc('');
    setEventTime('');
    setModalVisible(false);
  };

  const handleSaveHoliday = () => {
    if (!holidayName.trim() || !holidayDate.trim()) return;

    const holidayData = {
      name: holidayName.trim(),
      date: holidayDate.trim(),
      emoji: holidayEmoji || '🎉',
      animation: holidayAnimation,
      img: holidayImage || undefined,
    };

    if (editingHoliday) {
      updateHoliday(editingHoliday.id, holidayData);
    } else {
      addHoliday(holidayData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHolidayModalVisible(false);
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayEmoji('');
    setHolidayDate('');
    setHolidayAnimation('sparkles');
    setHolidayImage('');
  };

  const handleDeleteHoliday = (id: number) => {
    deleteHoliday(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayName(holiday.name);
    setHolidayEmoji(holiday.emoji);
    setHolidayDate(holiday.date);
    setHolidayAnimation(holiday.animation);
    setHolidayImage(holiday.img || '');
    setHolidayModalVisible(true);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(todayString);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderCalendarDays = () => {
    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateStr(day);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const holiday = getHoliday(dateStr);
      const hasEvents = getDateEvents(dateStr).length > 0;
      const hasTasks = getDateTasks(dateStr).length > 0;

      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
            holiday && styles.calendarDayHoliday,
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isToday && styles.calendarDayTextToday,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
          {holiday && (
            <View style={styles.holidayContainer}>
              {holiday.img ? (
                <Image source={{ uri: holiday.img }} style={styles.holidayImage} />
              ) : (
                <Text style={styles.holidayEmoji}>{holiday.emoji}</Text>
              )}
            </View>
          )}
          {(hasEvents || hasTasks) && !holiday && (
            <View style={styles.dotContainer}>
              {hasEvents && <View style={[styles.dot, { backgroundColor: Colors.primary }]} />}
              {hasTasks && <View style={[styles.dot, { backgroundColor: Colors.warning }]} />}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return calendarDays;
  };

  const selectedDateEvents = selectedDate ? getDateEvents(selectedDate) : [];
  const selectedDateTasks = selectedDate ? getDateTasks(selectedDate) : [];
  const selectedDateWorkouts = selectedDate ? getDateWorkouts(selectedDate) : [];
  const selectedDateNotes = selectedDate ? getDateNotes(selectedDate) : [];
  const selectedHoliday = selectedDate ? getHoliday(selectedDate) : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.weekHeader}>
          {days.map((day, index) => (
            <Text key={index} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {renderCalendarDays()}
        </View>
      </View>

      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          {animationParticles.length > 0 && (
            <View style={styles.animationOverlay}>
              {animationParticles.map((particle) => {
                const holiday = selectedHoliday;
                let emojis = ['✨', '⭐', '💫'];
                if (holiday?.animation === 'snow') emojis = ['❄️', '⛄', '☃️', '🌨️', '❄️'];
                if (holiday?.animation === 'fireworks') emojis = ['🎆', '🎇', '✨', '💥', '🌟', '💫', '🎆'];
                if (holiday?.animation === 'hearts') emojis = ['💕', '💖', '💗', '💝', '💘', '💓'];
                if (holiday?.animation === 'confetti') emojis = ['🎊', '🎉', '🎈', '✨', '🎀', '🎁'];
                if (holiday?.animation === 'stars') emojis = ['⭐', '🌟', '✨', '💫', '⭐'];
                
                const emoji = emojis[particle.id % emojis.length];
                
                return (
                  <Animated.Text
                    key={particle.id}
                    style={[
                      styles.animationParticle,
                      {
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        opacity: particle.opacity,
                        transform: [
                          {
                            translateX: particle.opacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [particle.endX - particle.x, 0],
                            }),
                          },
                          {
                            translateY: particle.opacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [particle.endY - particle.y, 0],
                            }),
                          },
                          {
                            rotate: particle.opacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [`${particle.rotation}deg`, '0deg'],
                            }),
                          },
                          {
                            scale: particle.scale,
                          },
                        ],
                      },
                    ]}
                  >
                    {emoji}
                  </Animated.Text>
                );
              })}
            </View>
          )}
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {selectedHoliday && (
              <View style={styles.holidayCard}>
                <View style={styles.holidayCardContent}>
                  <Text style={styles.holidayName}>
                    {selectedHoliday.emoji} {selectedHoliday.name}
                  </Text>
                  <View style={styles.holidayCardActions}>
                    <TouchableOpacity
                      style={styles.holidayActionBtn}
                      onPress={() => handleEditHoliday(selectedHoliday)}
                    >
                      <Edit2 size={16} color={Colors.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.holidayActionBtn}
                      onPress={() => handleDeleteHoliday(selectedHoliday.id)}
                    >
                      <Trash2 size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 && selectedDateWorkouts.length === 0 && selectedDateNotes.length === 0 && !selectedHoliday && (
              <Text style={styles.emptyText}>Nothing scheduled for this day</Text>
            )}

            {selectedDateEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Text style={styles.eventIconText}>📅</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  {event.time && <Text style={styles.eventTime}>{event.time}</Text>}
                  {event.desc && <Text style={styles.eventDesc}>{event.desc}</Text>}
                </View>
              </View>
            ))}

            {selectedDateTasks.map(task => (
              <View key={task.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Text style={styles.eventIconText}>✅</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventName}>{task.name}</Text>
                  {task.time && <Text style={styles.eventTime}>{task.time}</Text>}
                </View>
              </View>
            ))}

            {selectedDateWorkouts.map(workout => (
              <View key={workout.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Text style={styles.eventIconText}>💪</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventName}>{workout.name}</Text>
                  {workout.duration > 0 && <Text style={styles.eventTime}>{workout.duration} min</Text>}
                  {workout.notes && <Text style={styles.eventDesc}>{workout.notes}</Text>}
                </View>
              </View>
            ))}

            {selectedDateNotes.map(note => (
              <View key={note.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Text style={styles.eventIconText}>📝</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventName}>{note.name}</Text>
                  <Text style={styles.eventDesc} numberOfLines={2}>{note.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Event</Text>
            <Text style={styles.modalSubtitle}>
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Event name *"
              placeholderTextColor={Colors.textDim}
              value={eventName}
              onChangeText={setEventName}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description"
              placeholderTextColor={Colors.textDim}
              value={eventDesc}
              onChangeText={setEventDesc}
              multiline
            />

            <DateTimePicker
              label="Event Time"
              date={selectedDate || ''}
              time={eventTime}
              onDateChange={() => {}}
              onTimeChange={setEventTime}
              showDate={false}
              showTime={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleAddEvent}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save Event</Text>
                </LinearGradient>
              </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={holidayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setHolidayModalVisible(false);
          setEditingHoliday(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Holiday name *"
                placeholderTextColor={Colors.textDim}
                value={holidayName}
                onChangeText={setHolidayName}
              />

              <DateTimePicker
                label="Holiday Date *"
                date={holidayDate}
                time=""
                onDateChange={setHolidayDate}
                onTimeChange={() => {}}
                showDate={true}
                showTime={false}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Emoji (optional)"
                placeholderTextColor={Colors.textDim}
                value={holidayEmoji}
                onChangeText={setHolidayEmoji}
                maxLength={2}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Image URL (optional)"
                placeholderTextColor={Colors.textDim}
                value={holidayImage}
                onChangeText={setHolidayImage}
              />

              <View style={styles.animationSelector}>
                <Text style={styles.animationLabel}>Animation:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animationOptions}>
                  {(['fireworks', 'snow', 'hearts', 'sparkles', 'confetti', 'stars'] as const).map((anim) => (
                    <TouchableOpacity
                      key={anim}
                      style={[
                        styles.animationOption,
                        holidayAnimation === anim && styles.animationOptionActive,
                      ]}
                      onPress={() => setHolidayAnimation(anim)}
                    >
                      <Text style={[
                        styles.animationOptionText,
                        holidayAnimation === anim && styles.animationOptionTextActive,
                      ]}>
                        {anim === 'fireworks' && '🎆'}
                        {anim === 'snow' && '❄️'}
                        {anim === 'hearts' && '💝'}
                        {anim === 'sparkles' && '✨'}
                        {anim === 'confetti' && '🎉'}
                        {anim === 'stars' && '⭐'}
                      </Text>
                      <Text style={[
                        styles.animationOptionLabel,
                        holidayAnimation === anim && styles.animationOptionTextActive,
                      ]}>
                        {anim}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setHolidayModalVisible(false);
                    setEditingHoliday(null);
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveHoliday}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>{editingHoliday ? 'Update' : 'Add'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setHolidayModalVisible(true)}
      >
        <LinearGradient
          colors={[Colors.warning, '#f59e0b']}
          style={styles.fabGradient}
        >
          <Sparkles size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  todayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'white',
  },
  calendarContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: Colors.primary,
  },
  calendarDaySelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayHoliday: {
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: '700' as const,
  },
  calendarDayTextSelected: {
    fontWeight: '700' as const,
  },
  holidayContainer: {
    position: 'absolute',
    bottom: 2,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayEmoji: {
    fontSize: 8,
  },
  holidayImage: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDateContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addEventButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    marginTop: 20,
  },
  holidayCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  holidayCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.warning,
    flex: 1,
  },
  holidayCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  holidayActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 20,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.textDim,
    marginTop: 4,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
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
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 1000,
  },
  animationParticle: {
    position: 'absolute',
    fontSize: 28,
  },
  animationSelector: {
    marginBottom: 16,
  },
  animationLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  animationOptions: {
    flexDirection: 'row',
  },
  animationOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  animationOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  animationOptionText: {
    fontSize: 20,
    marginBottom: 4,
  },
  animationOptionLabel: {
    fontSize: 11,
    color: Colors.textDim,
    textTransform: 'capitalize',
  },
  animationOptionTextActive: {
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
