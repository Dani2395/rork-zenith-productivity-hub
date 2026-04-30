import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Home,
  CheckSquare,
  Calendar,
  Star,
  Dumbbell,
  BookOpen,
  Wallet,
  Gift,
  Target,
  FileText,
  Menu,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Settings,
  Brain,
  Mic,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import styles from '@/styles/indexStyles';
import { useData } from '@/contexts/DataContext';
import { updatePrioritiesWidget, updateTasksWidget, updateHabitsWidget, updateCalendarWidget, updateNotesWidget, updateGiftsWidget, updateBingoWidget, updateLockScreenPrioritiesWidget } from '@/widgets/widgetTaskHandler';
import { SubTask, Holiday, Task, Event, Workout, Note, MoodEntry } from '@/types';
import DateTimePicker from '@/components/DateTimePicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NAV_ITEMS = [
  { name: 'Home', icon: Home, route: '/' },
  { name: 'Tasks', icon: CheckSquare, route: '/tasks' },
  { name: 'Calendar', icon: Calendar, route: '/calendar' },
  { name: 'Habits', icon: Star, route: '/habits' },
  { name: 'Workout', icon: Dumbbell, route: '/workout' },
  { name: 'Notes', icon: FileText, route: '/notes' },
  { name: 'Brain Dump', icon: Brain, route: '/brain-dump' },
  { name: 'Books', icon: BookOpen, route: '/books' },
  { name: 'Budget', icon: Wallet, route: '/budget' },
  { name: 'Gifts', icon: Gift, route: '/gifts' },
  { name: 'Bingo', icon: Target, route: '/bingo' },
  { name: 'Settings', icon: Settings, route: '/settings' },
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    tasks,
    habits,
    habitCompletions,
    priorities,
    moods,
    notes,
    events,
    workouts,
    holidays,
    addPriority,
    updatePriority,
    togglePriority,
    deletePriority,
    toggleHabitCompletion,
    addMoodEntry,
    rolloverPriorities,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    addEvent,
    deleteEvent,
    addNote,
    deleteNote,
    deleteWorkout,
    giftPeople,
    bingoData,
    hasOnboarded,
    isLoading,
  } = useData();

  // Redirect to onboarding on first launch
  useEffect(() => {
    if (!isLoading && !hasOnboarded) {
      router.replace('/onboarding');
    }
  }, [isLoading, hasOnboarded]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [newPriority, setNewPriority] = useState('');
  const [priorityDate, setPriorityDate] = useState('');
  const [priorityTime, setPriorityTime] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingPriority, setEditingPriority] = useState<{ id: number; task: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [selectedDateForHoliday, setSelectedDateForHoliday] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayEmoji, setHolidayEmoji] = useState('🎉');
  const [holidayAnimation, setHolidayAnimation] = useState<Holiday['animation']>('sparkles');
  const [holidayImage, setHolidayImage] = useState('');
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);
  const [animatingDate, setAnimatingDate] = useState<string | null>(null);
  const animationValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    location: string;
    icon: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const weatherAnimValue = useRef(new Animated.Value(0)).current;
  const [quickAccessVisible, setQuickAccessVisible] = useState(false);
  const [scheduleItemModalVisible, setScheduleItemModalVisible] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<{
    type: 'task' | 'event' | 'note' | 'workout' | 'holiday';
    item: Task | Event | Note | Workout | Holiday;
  } | null>(null);

  // Quick Add Modal States
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'event' | 'note' | null>(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDesc, setQuickAddDesc] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  const [quickAddTime, setQuickAddTime] = useState('');
  const [quickAddPriority, setQuickAddPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const sidebarAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;

  const today = new Date().toISOString().split('T')[0];
  const todayPriorities = (priorities[today] || []);
  const pinnedNotes = notes.filter(n => n.pinned);

  const fetchWeather = useCallback(async () => {
    const getWeatherCondition = (code: number): string => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 67) return 'Rainy';
      if (code <= 77) return 'Snowy';
      if (code <= 82) return 'Showers';
      if (code <= 99) return 'Stormy';
      return 'Clear';
    };

    const getWeatherIcon = (code: number): string => {
      if (code === 0) return '☀️';
      if (code <= 3) return '⛅';
      if (code <= 48) return '🌫️';
      if (code <= 67) return '🌧️';
      if (code <= 77) return '❄️';
      if (code <= 82) return '🌦️';
      if (code <= 99) return '⛈️';
      return '☀️';
    };

    const fetchWithTimeout = (url: string, ms = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
    };

    const getWeatherData = async (lat: number, lon: number) => {
      const weatherRes = await fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      if (!weatherRes.ok) throw new Error(`Weather API ${weatherRes.status}`);
      const data = await weatherRes.json();
      if (!data?.current?.weather_code == null) throw new Error('Unexpected weather response');

      const weatherCode = data.current.weather_code;
      const geoRes = await fetchWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
      );
      const geoData = geoRes.ok ? await geoRes.json() : null;
      const locationName = geoData?.results?.[0]?.name || 'Your Location';

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(weatherCode),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        location: locationName,
        icon: getWeatherIcon(weatherCode),
      });
      setWeatherError(false);
    };

    setWeatherLoading(true);
    setWeatherError(false);

    try {
      if (Platform.OS === 'web') {
        if (!('geolocation' in navigator)) throw new Error('Geolocation unavailable');
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
              try { await getWeatherData(coords.latitude, coords.longitude); resolve(); }
              catch (e) { reject(e); }
            },
            (e) => reject(e),
            { timeout: 8000 }
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await getWeatherData(loc.coords.latitude, loc.coords.longitude);
      }
    } catch {
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    if (!isLoading) {
      rolloverPriorities();
    }
  }, [isLoading, rolloverPriorities]);

  // Priorities widget data + smart notifications
  useEffect(() => {
    const completedCount = todayPriorities.filter(p => p.completed).length;
    const nextPriority = todayPriorities.find(p => !p.completed)?.task ?? '';
    const dateObj = new Date();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const todayLabel = `${dayNames[dateObj.getDay()]}, ${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

    updatePrioritiesWidget({
      todayLabel,
      completedCount,
      totalCount: todayPriorities.length,
      nextPriority,
      priorities: todayPriorities.map((p: any) => ({
        id: p.id,
        task: p.task,
        completed: p.completed,
        overdue: p.overdue ?? false,
        subtaskTotal: p.subtasks?.length ?? 0,
        subtaskDone: p.subtasks?.filter((s: any) => s.completed).length ?? 0,
      })),
    });

    updateLockScreenPrioritiesWidget({
      completedCount,
      totalCount: todayPriorities.length,
      priorities: todayPriorities.map((p: any) => ({
        id: p.id,
        task: p.task,
        completed: p.completed,
        overdue: p.overdue ?? false,
      })),
    });

    // Weekly digest: count across last 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    let weekTotal = 0, weekCompleted = 0;
    for (const [date, prioList] of Object.entries(priorities)) {
      if (date >= weekStartStr) {
        weekTotal += prioList.length;
        weekCompleted += prioList.filter(p => p.completed).length;
      }
    }

  }, [todayPriorities, priorities]);

  // Save all other widget data on startup so widgets populate without needing to visit each screen
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Tasks widget
    const todayTasks = tasks.filter((t: any) => !t.completed && t.date === todayStr);
    const completedToday = tasks.filter((t: any) => t.completed && t.completedDate === todayStr);
    const overdueTasks = tasks.filter((t: any) => !t.completed && t.date && t.date < todayStr);
    updateTasksWidget({
      tasks: [
        ...overdueTasks.slice(0, 2).map((t: any) => ({ id: t.id, name: t.name, completed: false, overdue: true, priority: t.priority ?? 'medium', time: t.time || '' })),
        ...todayTasks.slice(0, 4).map((t: any) => ({ id: t.id, name: t.name, completed: false, overdue: false, priority: t.priority ?? 'medium', time: t.time || '' })),
        ...completedToday.slice(0, 2).map((t: any) => ({ id: t.id, name: t.name, completed: true, overdue: false, priority: t.priority ?? 'medium', time: t.time || '' })),
      ].slice(0, 5) as any,
      todayTotal: todayTasks.length,
      todayDone: completedToday.length,
      overdueCount: overdueTasks.length,
      nextTask: todayTasks[0]?.name ?? '',
    });

    // Habits widget
    const todayCompletions: string[] = habitCompletions[todayStr] ?? [];
    const doneTodayCount = todayCompletions.length;
    let bestStreakName = '';
    let bestStreakDays = 0;
    for (const habit of habits) {
      let streak = 0;
      const check = new Date();
      for (let i = 0; i < 365; i++) {
        const d = check.toISOString().split('T')[0];
        if ((habitCompletions[d] ?? []).includes(String(habit.id))) { streak++; check.setDate(check.getDate() - 1); }
        else break;
      }
      if (streak > bestStreakDays) { bestStreakDays = streak; bestStreakName = habit.name; }
    }
    const habitItems = habits.slice(0, 7).map((h: any) => ({
      id: h.id, name: h.name,
      doneToday: !!habitCompletions[`${h.id}-${todayStr}`],
      streakDays: (() => {
        let streak = 0;
        const base = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(base); d.setDate(d.getDate() - i);
          if (habitCompletions[`${h.id}-${d.toISOString().split('T')[0]}`]) { streak++; } else if (i > 0) { break; }
        }
        return streak;
      })(),
    }));
    updateHabitsWidget({ habits: habitItems as any, doneTodayCount, totalHabits: habits.length, bestStreakName, bestStreakDays });

    // Calendar widget
    const dateObj = new Date();
    const dayNames2 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const todayLabel2 = `${dayNames2[dateObj.getDay()]}, ${monthNames2[dateObj.getMonth()]} ${dateObj.getDate()}`;
    const todayEvents = events.filter((e: any) => e.date === todayStr).sort((a: any, b: any) => (a.time ?? '').localeCompare(b.time ?? ''));
    const nextEvent = todayEvents[0];
    updateCalendarWidget({ todayLabel: todayLabel2, eventCount: todayEvents.length, nextEventName: nextEvent?.name ?? '', nextEventTime: nextEvent?.time ?? '' });

    // Notes widget
    const pinnedNotes = notes.filter((n: any) => n.pinned);
    const sortedNotes = [
      ...pinnedNotes.sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? '')),
      ...notes.filter((n: any) => !n.pinned).sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? '')),
    ];
    const latestNote = sortedNotes[0];
    const recentNotes = sortedNotes.map((n: any) => ({
      id: n.id,
      title: n.name ?? n.title ?? 'Untitled',
      date: n.date ?? '',
      pinned: !!n.pinned,
      preview: typeof (n.content ?? n.text) === 'string' && (n.content ?? n.text) ? (n.content ?? n.text).replace(/\n/g, ' ').slice(0, 120) : undefined,
    }));
    updateNotesWidget({ totalNotes: notes.length, pinnedCount: pinnedNotes.length, latestNoteTitle: latestNote?.name ?? '', latestNoteDate: latestNote?.date ?? '', recentNotes, currentIndex: 0 });

    // Gifts widget
    const allGifts = giftPeople.flatMap((p: any) => p.gifts);
    const purchasedCount = allGifts.filter((g: any) => g.purchased).length;
    updateGiftsWidget({ peopleCount: giftPeople.length, totalGifts: allGifts.length, purchasedCount, nextEventLabel: '' });

    // Bingo widget
    const completedBingo = bingoData.filter((item: any) => item.d).length;
    const recentGoal = [...bingoData].reverse().find((item: any) => item.d && item.t !== 'FREE SPACE')?.t ?? '';
    const bingoCells = bingoData.map((item: any) => ({ emoji: item.e ?? '', text: item.t ?? '', done: item.d ?? false, isFreeSpace: item.t === 'FREE SPACE' }));
    updateBingoWidget({ cells: bingoCells as any, completedCount: completedBingo, hasBingo: false, recentGoal });
  }, [tasks, habits, habitCompletions, events, notes, giftPeople, bingoData]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(weatherAnimValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(weatherAnimValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [weatherAnimValue]);

  const toggleSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(sidebarAnim, {
      toValue: sidebarOpen ? -SCREEN_WIDTH * 0.8 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setSidebarOpen(!sidebarOpen);
  };

  const navigateTo = (route: string) => {
    toggleSidebar();
    if (route !== '/') {
      router.push(route as any);
    }
  };

  const handleSavePriority = () => {
    if (newPriority.trim()) {
      if (editingPriority) {
        updatePriority(today, editingPriority.id, {
          task: newPriority.trim(),
          date: priorityDate || undefined,
          time: priorityTime || undefined,
          subtasks: subtasks,
        });
        setEditingPriority(null);
      } else {
        addPriority(today, newPriority.trim(), priorityDate || undefined, priorityTime || undefined);
      }
      setNewPriority('');
      setPriorityDate('');
      setPriorityTime('');
      setSubtasks([]);
      setPriorityModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleEditPriority = (priority: any) => {
    setEditingPriority(priority);
    setNewPriority(priority.task);
    setPriorityDate(priority.date || '');
    setPriorityTime(priority.time || '');
    setSubtasks(priority.subtasks || []);
    setPriorityModalVisible(true);
  };

  const handleCompletePriority = (id: number) => {
    togglePriority(today, id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeletePriority = (id: number) => {
    deletePriority(today, id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveMood = () => {
    if (selectedMood) {
      addMoodEntry(today, selectedMood, moodNote);
      setSelectedMood(null);
      setMoodNote('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleQuickAdd = () => {
    if (!quickAddName.trim()) {
      Alert.alert('Missing Information', 'Please enter a name');
      return;
    }

    const timestamp = new Date().toISOString();
    const dateToUse = quickAddDate || today;

    if (quickAddType === 'task') {
      addTask({
        name: quickAddName.trim(),
        desc: quickAddDesc.trim(),
        priority: quickAddPriority,
        date: dateToUse,
        time: quickAddTime,
        recurring: 'none',
        completed: false,
      });
    } else if (quickAddType === 'event') {
      addEvent({
        name: quickAddName.trim(),
        desc: quickAddDesc.trim(),
        date: dateToUse,
        time: quickAddTime,
        recurring: 'none',
      });
    } else if (quickAddType === 'note') {
      addNote({
        name: quickAddName.trim(),
        text: quickAddDesc.trim(),
        locked: false,
        pinned: false,
        date: dateToUse,
        time: quickAddTime || undefined,
        category: '',
        createdDate: timestamp,
        lastModified: timestamp,
      });
    }

    setQuickAddName('');
    setQuickAddDesc('');
    setQuickAddDate('');
    setQuickAddTime('');
    setQuickAddPriority('medium');
    setQuickAddModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openQuickAdd = (type: 'task' | 'event' | 'note') => {
    setQuickAddType(type);
    setQuickAddDate(today);
    setQuickAccessVisible(false);
    setQuickAddModalVisible(true);
  };

  // Today's items
  const todayTasks = tasks.filter(t => t.date === today);
  const todayEvents = events.filter(e => e.date === today);
  const todayWorkouts = workouts.filter(w => w.date === today);
  const todayNotes = notes.filter(n => n.date === today);
  const todayHolidays = holidays.filter(h => h.date === today);
  const todayMoods = moods[today]?.entries || [];

  // Overdue tasks (from previous days that weren't completed)
  const overdueTasks = tasks.filter(t => t.date < today && !t.completed);

  // Timeline items
  const getTimelineItems = () => {
    const items: {
      time: string;
      type: 'task' | 'event' | 'note' | 'workout' | 'holiday' | 'mood';
      data: Task | Event | Note | Workout | Holiday | MoodEntry;
      sortTime: string;
    }[] = [];

    todayTasks.forEach(task => {
      items.push({
        time: task.time || '',
        type: 'task',
        data: task,
        sortTime: task.time || '99:99',
      });
    });

    todayEvents.forEach(event => {
      items.push({
        time: event.time || '',
        type: 'event',
        data: event,
        sortTime: event.time || '99:99',
      });
    });

    todayNotes.forEach(note => {
      if (note.time) {
        items.push({
          time: note.time,
          type: 'note',
          data: note,
          sortTime: note.time,
        });
      }
    });

    todayWorkouts.forEach(workout => {
      items.push({
        time: '',
        type: 'workout',
        data: workout,
        sortTime: '99:99',
      });
    });

    todayHolidays.forEach(holiday => {
      items.push({
        time: '',
        type: 'holiday',
        data: holiday,
        sortTime: '00:00',
      });
    });

    todayMoods.forEach(mood => {
      items.push({
        time: mood.time || '',
        type: 'mood',
        data: mood,
        sortTime: mood.time || '99:99',
      });
    });

    return items.sort((a, b) => a.sortTime.localeCompare(b.sortTime));
  };

  const timelineItems = getTimelineItems();
  const itemsWithTime = timelineItems.filter(item => item.time && item.sortTime !== '99:99');
  const itemsWithoutTime = timelineItems.filter(item => !item.time || item.sortTime === '99:99');

  const moodEmojis = ['😄', '😊', '😐', '😔', '😢'];
  const moodCounts = moodEmojis.reduce((acc, emoji) => {
    acc[emoji] = todayMoods.filter(m => m.emoji === emoji).length;
    return acc;
  }, {} as Record<string, number>);

  const getHolidayForDate = (dateStr: string) => {
    return holidays.find(h => h.date === dateStr);
  };

  const triggerHolidayAnimation = (dateStr: string, animation: Holiday['animation']) => {
    setAnimatingDate(dateStr);
    if (!animationValues[dateStr]) {
      animationValues[dateStr] = new Animated.Value(0);
    }
    
    Animated.sequence([
      Animated.timing(animationValues[dateStr], {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(animationValues[dateStr], {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimatingDate(null);
    });
  };

  const renderAnimation = (animation: Holiday['animation'], dateStr: string) => {
    const animValue = animationValues[dateStr] || new Animated.Value(0);
    
    switch (animation) {
      case 'fireworks':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3, 4].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.fireworkParticle,
                  {
                    left: '50%',
                    top: '50%',
                    transform: [
                      {
                        translateX: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.cos(i * 72 * Math.PI / 180) * 80],
                        }),
                      },
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.sin(i * 72 * Math.PI / 180) * 80],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1, 0],
                    }),
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>✨</Text>
              </Animated.View>
            ))}
          </View>
        );
      case 'snow':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3, 4].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.snowflake,
                  {
                    left: `${i * 20}%`,
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 100],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>❄️</Text>
              </Animated.View>
            ))}
          </View>
        );
      case 'hearts':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.heartParticle,
                  {
                    left: `${30 + i * 15}%`,
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, -60],
                        }),
                      },
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.5, 1.2, 0.8],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [1, 1, 0],
                    }),
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>💖</Text>
              </Animated.View>
            ))}
          </View>
        );
      case 'sparkles':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.sparkleParticle,
                  {
                    left: `${25 + i * 15}%`,
                    top: `${20 + (i % 2) * 30}%`,
                    transform: [
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.5, 0],
                        }),
                      },
                      {
                        rotate: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>✨</Text>
              </Animated.View>
            ))}
          </View>
        );
      case 'confetti':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiParticle,
                  {
                    left: `${i * 15}%`,
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 100],
                        }),
                      },
                      {
                        rotate: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '720deg'],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [1, 1, 0],
                    }),
                  },
                ]}
              >
                <View style={[styles.confettiPiece, { backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94'][i % 5] }]} />
              </Animated.View>
            ))}
          </View>
        );
      case 'stars':
        return (
          <View style={StyleSheet.absoluteFill}>
            {[0, 1, 2, 3].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.starParticle,
                  {
                    left: `${20 + i * 18}%`,
                    top: `${15 + (i % 2) * 35}%`,
                    transform: [
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.3, 0.5],
                        }),
                      },
                    ],
                    opacity: animValue.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>⭐</Text>
              </Animated.View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const handleManageHolidays = () => {
    setHolidayModalVisible(true);
  };

  const handleSaveHoliday = () => {
    if (selectedDateForHoliday && holidayName) {
      if (editingHolidayId) {
        updateHoliday(editingHolidayId, {
          date: selectedDateForHoliday,
          name: holidayName,
          emoji: holidayEmoji,
          animation: holidayAnimation,
          img: holidayImage || undefined,
        });
      } else {
        addHoliday({
          date: selectedDateForHoliday,
          name: holidayName,
          emoji: holidayEmoji,
          animation: holidayAnimation,
          img: holidayImage || undefined,
        });
      }
      setHolidayModalVisible(false);
      setSelectedDateForHoliday('');
      setHolidayName('');
      setHolidayEmoji('🎉');
      setHolidayAnimation('sparkles');
      setHolidayImage('');
      setEditingHolidayId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderMiniCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const holiday = getHolidayForDate(dateStr);
      const isAnimating = animatingDate === dateStr;

      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isToday && styles.calendarDayToday]}
          onPress={() => {
            if (holiday) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              triggerHolidayAnimation(dateStr, holiday.animation);
            } else {
              router.push('/calendar' as any);
            }
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setSelectedDateForHoliday(dateStr);
            if (holiday) {
              setHolidayName(holiday.name);
              setHolidayEmoji(holiday.emoji);
              setHolidayAnimation(holiday.animation);
              setHolidayImage(holiday.img || '');
              setEditingHolidayId(holiday.id);
            }
            setHolidayModalVisible(true);
          }}
        >
          {holiday?.img ? (
            <Image
              source={{ uri: holiday.img }}
              style={styles.calendarDayImage}
              resizeMode="cover"
            />
          ) : null}
          <Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
            {day}
          </Text>
          {holiday && (
            <Text style={styles.calendarDayEmoji}>{holiday.emoji}</Text>
          )}
          {isAnimating && renderAnimation(holiday!.animation, dateStr)}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <ChevronLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <ChevronRight size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleManageHolidays} style={styles.holidaySettingsBtn}>
            <Settings size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarDaysHeader}>
          {days.map((d, i) => (
            <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>{calendarDays}</View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarAnim }] },
        ]}
      >
        <SafeAreaView style={styles.sidebarContent}>
          <View style={styles.sidebarHeader}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>Z</Text>
            </LinearGradient>
            <Text style={styles.sidebarTitle}>Zenith</Text>
            <Text style={styles.sidebarSubtitle}>Your productivity hub</Text>
          </View>
          <ScrollView style={styles.sidebarNav}>
            {NAV_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sidebarItem,
                  item.route === '/' && styles.sidebarItemActive,
                ]}
                onPress={() => navigateTo(item.route)}
              >
                <item.icon
                  size={22}
                  color={item.route === '/' ? Colors.primary : Colors.text}
                />
                <Text
                  style={[
                    styles.sidebarItemText,
                    item.route === '/' && styles.sidebarItemTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {sidebarOpen && (
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
      )}

      <SafeAreaView style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {weather && (
              <TouchableOpacity onPress={fetchWeather} style={styles.headerWeatherIcon}>
                <Animated.Text
                  style={[
                    styles.headerWeatherEmoji,
                    {
                      transform: [
                        {
                          scale: weatherAnimValue.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.15, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {weather.icon}
                </Animated.Text>
                <Text style={styles.headerWeatherTemp}>{weather.temp}°</Text>
              </TouchableOpacity>
            )}
            {weatherLoading && (
              <View style={styles.headerWeatherIcon}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            {weatherError && !weatherLoading && (
              <TouchableOpacity
                style={styles.headerWeatherIcon}
                onPress={() => { setWeatherError(false); fetchWeather(); }}
              >
                <Text style={{ fontSize: 18 }}>🌡️</Text>
                <Text style={{ fontSize: 9, color: Colors.textDim }}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              {sidebarOpen ? (
                <X size={24} color={Colors.text} />
              ) : (
                <Menu size={24} color={Colors.text} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Zenith</Text>
            <Text style={styles.headerSubtitle}>Home</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >


          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>🔥 Top 5 Priorities</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setPriorityModalVisible(true)}
              >
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {todayPriorities.length === 0 ? (
              <Text style={styles.emptyText}>No priorities set</Text>
            ) : (
              todayPriorities.slice(0, 5).map((priority, index) => (
                <TouchableOpacity
                  key={priority.id}
                  style={styles.priorityItem}
                  onPress={() => handleEditPriority(priority)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.priorityNumber}
                  >
                    <Text style={styles.priorityNumberText}>{index + 1}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text
                        style={[
                          styles.priorityText,
                          priority.completed && styles.priorityTextCompleted,
                          { flex: 1 },
                        ]}
                        numberOfLines={2}
                      >
                        {priority.task}
                      </Text>
                      {priority.overdue && (
                        <View style={styles.overdueTag}>
                          <Text style={styles.overdueTagText}>OVERDUE</Text>
                        </View>
                      )}
                    </View>
                    {(priority.date || priority.time) && (
                      <Text style={styles.priorityDateTime}>
                        {priority.date && `📅 ${priority.date}`}
                        {priority.time && ` ⏰ ${priority.time}`}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.priorityDeleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePriority(priority.id);
                    }}
                  >
                    <Trash2 size={14} color={Colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityCheckBtn,
                      priority.completed && styles.priorityCheckBtnCompleted,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCompletePriority(priority.id);
                    }}
                  >
                    <Text style={styles.priorityCheckText}>{priority.completed ? '✓' : '○'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>

          {pinnedNotes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📌 Pinned Notes</Text>
              <View style={styles.pinnedNote}>
                <Text style={styles.pinnedNoteTitle}>
                  {pinnedNotes[pinnedIndex]?.name}
                </Text>
                <Text style={styles.pinnedNoteText} numberOfLines={4}>
                  {pinnedNotes[pinnedIndex]?.text}
                </Text>
              </View>
              {pinnedNotes.length > 1 && (
                <View style={styles.pinnedNav}>
                  <TouchableOpacity
                    onPress={() =>
                      setPinnedIndex((pinnedIndex - 1 + pinnedNotes.length) % pinnedNotes.length)
                    }
                  >
                    <ChevronLeft size={20} color={Colors.textDim} />
                  </TouchableOpacity>
                  <Text style={styles.pinnedIndicator}>
                    {pinnedIndex + 1} / {pinnedNotes.length}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPinnedIndex((pinnedIndex + 1) % pinnedNotes.length)}
                  >
                    <ChevronRight size={20} color={Colors.textDim} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Today&apos;s Habits</Text>
            {habits.length === 0 ? (
              <Text style={styles.emptyText}>No habits</Text>
            ) : (
              habits.slice(0, 5).map(habit => {
                const isCompleted = habitCompletions[`${habit.id}-${today}`];
                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={styles.habitItem}
                    onPress={() => {
                      toggleHabitCompletion(habit.id, today);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.habitText} numberOfLines={2}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitCheck}>
                      {isCompleted ? '✅' : '⬜'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Calendar</Text>
            {renderMiniCalendar()}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Today&apos;s Timeline</Text>
            {timelineItems.length === 0 && overdueTasks.length === 0 ? (
              <Text style={styles.emptyText}>Nothing scheduled for today 🎉</Text>
            ) : (
              <View>
                {overdueTasks.length > 0 && (
                  <View style={styles.timelineSection}>
                    <View style={styles.timelineSectionHeader}>
                      <View style={styles.timelineDot} />
                      <Text style={styles.timelineSectionTitle}>⚠️ Overdue</Text>
                    </View>
                    {overdueTasks.map(task => (
                      <TouchableOpacity
                        key={`overdue-${task.id}`}
                        style={[
                          styles.timelineItem,
                          { borderLeftColor: Colors.danger },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          updateTask(task.id, { completed: !task.completed, completedDate: !task.completed ? today : undefined });
                        }}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedScheduleItem({ type: 'task', item: task });
                          setScheduleItemModalVisible(true);
                        }}
                      >
                        <Text style={styles.timelineItemIcon}>{task.completed ? '✅' : '⬜'}</Text>
                        <View style={styles.timelineItemContent}>
                          <Text style={styles.timelineItemTitle}>{task.name}</Text>
                          <Text style={styles.timelineItemTime}>
                            {task.time || 'No time'} • {task.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {itemsWithTime.length > 0 && (
                  <View style={styles.timelineSection}>
                    <View style={styles.timelineSectionHeader}>
                      <View style={styles.timelineDot} />
                      <Text style={styles.timelineSectionTitle}>⏰ Scheduled</Text>
                    </View>
                    {itemsWithTime.map((item, index) => {
                      const showTime = index === 0 || item.time !== itemsWithTime[index - 1]?.time;
                      return (
                        <View key={`timeline-${item.type}-${index}-${(item.data as any).id ?? 'no-id'}`}>
                          {showTime && item.time && (
                            <View style={styles.timeMarker}>
                              <View style={styles.timeLine} />
                              <View style={styles.timeMarkerDot} />
                              <Text style={styles.timeMarkerText}>{item.time}</Text>
                            </View>
                          )}
                          {item.type === 'task' && (
                            <TouchableOpacity
                              style={[
                                styles.timelineItem,
                                { borderLeftColor: (item.data as Task).priority === 'high' ? Colors.danger : (item.data as Task).priority === 'medium' ? Colors.warning : Colors.success },
                                (item.data as Task).completed && { opacity: 0.6 },
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                updateTask((item.data as Task).id, { completed: !(item.data as Task).completed, completedDate: !(item.data as Task).completed ? today : undefined });
                              }}
                              onLongPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setSelectedScheduleItem({ type: 'task', item: item.data as Task });
                                setScheduleItemModalVisible(true);
                              }}
                            >
                              <Text style={styles.timelineItemIcon}>{(item.data as Task).completed ? '✅' : '⬜'}</Text>
                              <View style={styles.timelineItemContent}>
                                <Text style={[
                                  styles.timelineItemTitle,
                                  (item.data as Task).completed && { textDecorationLine: 'line-through', color: Colors.textDim }
                                ]}>
                                  {(item.data as Task).name}
                                </Text>
                                {(item.data as Task).desc && (
                                  <Text style={styles.timelineItemDesc} numberOfLines={1}>
                                    {(item.data as Task).desc}
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          )}
                          {item.type === 'event' && (
                            <TouchableOpacity
                              style={[styles.timelineItem, { borderLeftColor: Colors.secondary }]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedScheduleItem({ type: 'event', item: item.data as Event });
                                setScheduleItemModalVisible(true);
                              }}
                            >
                              <Text style={styles.timelineItemIcon}>📅</Text>
                              <View style={styles.timelineItemContent}>
                                <Text style={styles.timelineItemTitle}>{(item.data as Event).name}</Text>
                                {(item.data as Event).desc && (
                                  <Text style={styles.timelineItemDesc} numberOfLines={1}>
                                    {(item.data as Event).desc}
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          )}
                          {item.type === 'note' && (
                            <TouchableOpacity
                              style={[styles.timelineItem, { borderLeftColor: '#A7D8F0' }]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedScheduleItem({ type: 'note', item: item.data as Note });
                                setScheduleItemModalVisible(true);
                              }}
                            >
                              <Text style={styles.timelineItemIcon}>📝</Text>
                              <View style={styles.timelineItemContent}>
                                <Text style={styles.timelineItemTitle}>{(item.data as Note).name}</Text>
                                <Text style={styles.timelineItemDesc} numberOfLines={2}>
                                  {(item.data as Note).text}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          {item.type === 'mood' && (
                            <View style={[styles.timelineItem, { borderLeftColor: Colors.primary }]}>
                              <Text style={styles.timelineItemIcon}>{(item.data as MoodEntry).emoji}</Text>
                              <View style={styles.timelineItemContent}>
                                <Text style={styles.timelineItemTitle}>Mood Entry</Text>
                                {(item.data as MoodEntry).note && (
                                  <Text style={styles.timelineItemDesc} numberOfLines={1}>
                                    {(item.data as MoodEntry).note}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {itemsWithoutTime.length > 0 && (
                  <View style={styles.timelineSection}>
                    <View style={styles.timelineSectionHeader}>
                      <View style={styles.timelineDot} />
                      <Text style={styles.timelineSectionTitle}>📋 All Day</Text>
                    </View>
                    {itemsWithoutTime.map((item, index) => (
                      <View key={`allday-${item.type}-${index}-${(item.data as any).id ?? 'no-id'}`}>
                        {item.type === 'task' && (
                          <TouchableOpacity
                            style={[
                              styles.timelineItem,
                              { borderLeftColor: (item.data as Task).priority === 'high' ? Colors.danger : (item.data as Task).priority === 'medium' ? Colors.warning : Colors.success },
                              (item.data as Task).completed && { opacity: 0.6 },
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              updateTask((item.data as Task).id, { completed: !(item.data as Task).completed, completedDate: !(item.data as Task).completed ? today : undefined });
                            }}
                            onLongPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setSelectedScheduleItem({ type: 'task', item: item.data as Task });
                              setScheduleItemModalVisible(true);
                            }}
                          >
                            <Text style={styles.timelineItemIcon}>{(item.data as Task).completed ? '✅' : '⬜'}</Text>
                            <View style={styles.timelineItemContent}>
                              <Text style={[
                                styles.timelineItemTitle,
                                (item.data as Task).completed && { textDecorationLine: 'line-through', color: Colors.textDim }
                              ]}>
                                {(item.data as Task).name}
                              </Text>
                              {(item.data as Task).desc && (
                                <Text style={styles.timelineItemDesc} numberOfLines={1}>
                                  {(item.data as Task).desc}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                        {item.type === 'event' && (
                          <TouchableOpacity
                            style={[styles.timelineItem, { borderLeftColor: Colors.secondary }]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedScheduleItem({ type: 'event', item: item.data as Event });
                              setScheduleItemModalVisible(true);
                            }}
                          >
                            <Text style={styles.timelineItemIcon}>📅</Text>
                            <View style={styles.timelineItemContent}>
                              <Text style={styles.timelineItemTitle}>{(item.data as Event).name}</Text>
                              {(item.data as Event).desc && (
                                <Text style={styles.timelineItemDesc} numberOfLines={1}>
                                  {(item.data as Event).desc}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                        {item.type === 'workout' && (
                          <TouchableOpacity
                            style={[styles.timelineItem, { borderLeftColor: '#10b981' }]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedScheduleItem({ type: 'workout', item: item.data as Workout });
                              setScheduleItemModalVisible(true);
                            }}
                          >
                            <Text style={styles.timelineItemIcon}>💪</Text>
                            <View style={styles.timelineItemContent}>
                              <Text style={styles.timelineItemTitle}>{(item.data as Workout).name}</Text>
                              {(item.data as Workout).duration > 0 && (
                                <Text style={styles.timelineItemDesc}>
                                  {(item.data as Workout).duration} min
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                        {item.type === 'holiday' && (
                          <TouchableOpacity
                            style={[styles.timelineItem, { borderLeftColor: '#fbbf24' }]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedScheduleItem({ type: 'holiday', item: item.data as Holiday });
                              setScheduleItemModalVisible(true);
                            }}
                          >
                            <Text style={styles.timelineItemIcon}>{(item.data as Holiday).emoji}</Text>
                            <View style={styles.timelineItemContent}>
                              <Text style={styles.timelineItemTitle}>{(item.data as Holiday).name}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>😊 How are you feeling?</Text>
            <View style={styles.moodRow}>
              {moodEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodEmoji,
                    selectedMood === emoji && styles.moodEmojiSelected,
                  ]}
                  onPress={() => setSelectedMood(emoji)}
                >
                  <Text style={styles.moodEmojiText}>{emoji}</Text>
                  <View style={styles.moodCount}>
                    <Text style={styles.moodCountText}>{moodCounts[emoji]}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.moodInput}
              placeholder="Add note (optional)"
              placeholderTextColor={Colors.textDim}
              value={moodNote}
              onChangeText={setMoodNote}
            />
            <TouchableOpacity
              style={[styles.button, !selectedMood && styles.buttonDisabled]}
              onPress={handleSaveMood}
              disabled={!selectedMood}
            >
              <LinearGradient
                colors={selectedMood ? [Colors.primary, Colors.secondary] : [Colors.card, Colors.card]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Log Mood</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setQuickAccessVisible(true);
          }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.fabGradient}
          >
            <Plus size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={priorityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPriorityModalVisible(false);
          setEditingPriority(null);
          setNewPriority('');
          setPriorityDate('');
          setPriorityTime('');
          setSubtasks([]);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingPriority ? 'Edit Priority' : 'Add Priority'}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What's your priority?"
                placeholderTextColor={Colors.textDim}
                value={newPriority}
                onChangeText={setNewPriority}
                autoFocus
              />
              <DateTimePicker
                label="Schedule (Optional)"
                date={priorityDate}
                time={priorityTime}
                onDateChange={setPriorityDate}
                onTimeChange={setPriorityTime}
              />
              <View style={styles.subtasksSection}>
                <Text style={styles.subtasksLabel}>Subtasks:</Text>
                {subtasks.map((subtask) => (
                  <View key={subtask.id} style={styles.subtaskItem}>
                    <TouchableOpacity
                      style={styles.subtaskCheck}
                      onPress={() => {
                        setSubtasks(subtasks.map(st => 
                          st.id === subtask.id ? { ...st, completed: !st.completed } : st
                        ));
                      }}
                    >
                      <Text style={styles.subtaskCheckText}>{subtask.completed ? '✓' : '○'}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.subtaskText, subtask.completed && styles.subtaskTextCompleted]}>
                      {subtask.text}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSubtasks(subtasks.filter(st => st.id !== subtask.id))}
                    >
                      <Text style={styles.subtaskDelete}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.addSubtaskRow}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add subtask"
                    placeholderTextColor={Colors.textDim}
                    value={newSubtask}
                    onChangeText={setNewSubtask}
                    onSubmitEditing={() => {
                      if (newSubtask.trim()) {
                        setSubtasks([...subtasks, { id: Date.now(), text: newSubtask.trim(), completed: false }]);
                        setNewSubtask('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addSubtaskBtn}
                    onPress={() => {
                      if (newSubtask.trim()) {
                        setSubtasks([...subtasks, { id: Date.now(), text: newSubtask.trim(), completed: false }]);
                        setNewSubtask('');
                      }
                    }}
                  >
                    <Text style={styles.addSubtaskBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setPriorityModalVisible(false);
                    setEditingPriority(null);
                    setNewPriority('');
                    setPriorityDate('');
                    setPriorityTime('');
                    setSubtasks([]);
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={handleSavePriority}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>{editingPriority ? 'Update' : 'Save'}</Text>
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
        animationType="fade"
        onRequestClose={() => {
          setHolidayModalVisible(false);
          setSelectedDateForHoliday('');
          setHolidayName('');
          setHolidayEmoji('🎉');
          setHolidayAnimation('sparkles');
          setHolidayImage('');
          setEditingHolidayId(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingHolidayId ? 'Edit Holiday' : 'Add Holiday'}</Text>
              
              <DateTimePicker
                label="Holiday Date"
                date={selectedDateForHoliday}
                time=""
                onDateChange={setSelectedDateForHoliday}
                onTimeChange={() => {}}
                showDate={true}
                showTime={false}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Holiday Name"
                placeholderTextColor={Colors.textDim}
                value={holidayName}
                onChangeText={setHolidayName}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Emoji (e.g., 🎄)"
                placeholderTextColor={Colors.textDim}
                value={holidayEmoji}
                onChangeText={setHolidayEmoji}
              />
              
              <TextInput
                style={styles.modalInput}
                placeholder="Image URL (optional)"
                placeholderTextColor={Colors.textDim}
                value={holidayImage}
                onChangeText={setHolidayImage}
              />
              
              <Text style={styles.subtasksLabel}>Animation Style:</Text>
              <View style={styles.animationGrid}>
                {(['fireworks', 'snow', 'hearts', 'sparkles', 'confetti', 'stars'] as Holiday['animation'][]).map(anim => (
                  <TouchableOpacity
                    key={anim}
                    style={[
                      styles.animationOption,
                      holidayAnimation === anim && styles.animationOptionSelected,
                    ]}
                    onPress={() => setHolidayAnimation(anim)}
                  >
                    <Text style={styles.animationOptionText}>
                      {anim === 'fireworks' && '🎆'}
                      {anim === 'snow' && '❄️'}
                      {anim === 'hearts' && '💖'}
                      {anim === 'sparkles' && '✨'}
                      {anim === 'confetti' && '🎊'}
                      {anim === 'stars' && '⭐'}
                    </Text>
                    <Text style={styles.animationOptionLabel}>{anim}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {holidays.length > 0 && (
                <View style={styles.holidaysList}>
                  <Text style={styles.subtasksLabel}>Saved Holidays:</Text>
                  {holidays.map(h => (
                    <View key={h.id} style={styles.holidayListItem}>
                      <Text style={styles.holidayListText}>
                        {h.emoji} {h.name} - {h.date}
                      </Text>
                      <View style={styles.holidayListActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingHolidayId(h.id);
                            setSelectedDateForHoliday(h.date);
                            setHolidayName(h.name);
                            setHolidayEmoji(h.emoji);
                            setHolidayAnimation(h.animation);
                            setHolidayImage(h.img || '');
                          }}
                          style={styles.holidayEditBtn}
                        >
                          <Text style={styles.holidayEditText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            deleteHoliday(h.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }}
                        >
                          <Trash2 size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setHolidayModalVisible(false);
                    setSelectedDateForHoliday('');
                    setHolidayName('');
                    setHolidayEmoji('🎉');
                    setHolidayAnimation('sparkles');
                    setHolidayImage('');
                    setEditingHolidayId(null);
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={handleSaveHoliday}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>{editingHolidayId ? 'Update' : 'Save'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={quickAccessVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickAccessVisible(false)}
      >
        <Pressable style={styles.quickAccessOverlay} onPress={() => setQuickAccessVisible(false)}>
          <View style={styles.quickAccessMenu}>
            <Text style={styles.quickAccessTitle}>Quick Add</Text>
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() => openQuickAdd('task')}
            >
              <View style={styles.quickAccessIconContainer}>
                <CheckSquare size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickAccessText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() => openQuickAdd('event')}
            >
              <View style={styles.quickAccessIconContainer}>
                <Calendar size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.quickAccessText}>Add Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() => openQuickAdd('note')}
            >
              <View style={styles.quickAccessIconContainer}>
                <FileText size={24} color={Colors.success} />
              </View>
              <Text style={styles.quickAccessText}>Add Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessOption}
              onPress={() => {
                setQuickAccessVisible(false);
                router.push('/voice-add' as any);
              }}
            >
              <View style={[styles.quickAccessIconContainer, { backgroundColor: Colors.warning + '22' }]}>
                <Mic size={24} color={Colors.warning} />
              </View>
              <Text style={styles.quickAccessText}>Voice Command</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Quick Add Modal */}
      <Modal
        visible={quickAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuickAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {quickAddType === 'task' && '✅ Quick Add Task'}
                {quickAddType === 'event' && '📅 Quick Add Event'}
                {quickAddType === 'note' && '📝 Quick Add Note'}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder={quickAddType === 'note' ? 'Note title *' : 'Name *'}
                placeholderTextColor={Colors.textDim}
                value={quickAddName}
                onChangeText={setQuickAddName}
                autoFocus
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder={quickAddType === 'note' ? 'Note content' : 'Description'}
                placeholderTextColor={Colors.textDim}
                value={quickAddDesc}
                onChangeText={setQuickAddDesc}
                multiline
              />

              {quickAddType === 'task' && (
                <View style={styles.prioritySelector}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <View style={styles.priorityButtons}>
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityButton,
                          quickAddPriority === p && styles.priorityButtonActive,
                          p === 'low' && { borderColor: Colors.success, backgroundColor: quickAddPriority === p ? Colors.success : 'transparent' },
                          p === 'medium' && { borderColor: Colors.warning, backgroundColor: quickAddPriority === p ? Colors.warning : 'transparent' },
                          p === 'high' && { borderColor: Colors.danger, backgroundColor: quickAddPriority === p ? Colors.danger : 'transparent' },
                        ]}
                        onPress={() => setQuickAddPriority(p)}
                      >
                        <Text style={[styles.priorityButtonText, quickAddPriority === p && styles.priorityButtonTextActive]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <DateTimePicker
                label="Schedule"
                date={quickAddDate}
                time={quickAddTime}
                onDateChange={setQuickAddDate}
                onTimeChange={setQuickAddTime}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setQuickAddModalVisible(false);
                    setQuickAddName('');
                    setQuickAddDesc('');
                    setQuickAddDate('');
                    setQuickAddTime('');
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={handleQuickAdd}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={scheduleItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScheduleItemModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setScheduleItemModalVisible(false)}>
          <View style={styles.scheduleItemModal} onStartShouldSetResponder={() => true}>
            {selectedScheduleItem && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedScheduleItem.type === 'task' && '✅ Task'}
                  {selectedScheduleItem.type === 'event' && '📅 Event'}
                  {selectedScheduleItem.type === 'note' && '📝 Note'}
                  {selectedScheduleItem.type === 'workout' && '💪 Workout'}
                  {selectedScheduleItem.type === 'holiday' && `${(selectedScheduleItem.item as Holiday).emoji} Holiday`}
                </Text>

                {selectedScheduleItem.type === 'task' && (
                  <View style={styles.scheduleItemDetails}>
                    <Text style={styles.scheduleItemName}>{(selectedScheduleItem.item as Task).name}</Text>
                    <Text style={styles.scheduleItemInfo}>
                      Priority: {(selectedScheduleItem.item as Task).priority}
                    </Text>
                    <Text style={styles.scheduleItemInfo}>
                      Date: {(selectedScheduleItem.item as Task).date}
                    </Text>
                    {(selectedScheduleItem.item as Task).time && (
                      <Text style={styles.scheduleItemInfo}>
                        Time: {(selectedScheduleItem.item as Task).time}
                      </Text>
                    )}
                  </View>
                )}

                {selectedScheduleItem.type === 'event' && (
                  <View style={styles.scheduleItemDetails}>
                    <Text style={styles.scheduleItemName}>{(selectedScheduleItem.item as Event).name}</Text>
                    <Text style={styles.scheduleItemInfo}>
                      Date: {(selectedScheduleItem.item as Event).date}
                    </Text>
                    {(selectedScheduleItem.item as Event).time && (
                      <Text style={styles.scheduleItemInfo}>
                        Time: {(selectedScheduleItem.item as Event).time}
                      </Text>
                    )}
                  </View>
                )}

                {selectedScheduleItem.type === 'note' && (
                  <View style={styles.scheduleItemDetails}>
                    <Text style={styles.scheduleItemName}>{(selectedScheduleItem.item as Note).name}</Text>
                    <Text style={styles.scheduleItemInfo}>
                      Date: {(selectedScheduleItem.item as Note).date}
                    </Text>
                    {(selectedScheduleItem.item as Note).time && (
                      <Text style={styles.scheduleItemInfo}>
                        Time: {(selectedScheduleItem.item as Note).time}
                      </Text>
                    )}
                  </View>
                )}

                {selectedScheduleItem.type === 'workout' && (
                  <View style={styles.scheduleItemDetails}>
                    <Text style={styles.scheduleItemName}>{(selectedScheduleItem.item as Workout).name}</Text>
                    <Text style={styles.scheduleItemInfo}>
                      Date: {(selectedScheduleItem.item as Workout).date}
                    </Text>
                    <Text style={styles.scheduleItemInfo}>
                      Duration: {(selectedScheduleItem.item as Workout).duration} min
                    </Text>
                  </View>
                )}

                {selectedScheduleItem.type === 'holiday' && (
                  <View style={styles.scheduleItemDetails}>
                    <Text style={styles.scheduleItemName}>{(selectedScheduleItem.item as Holiday).name}</Text>
                    <Text style={styles.scheduleItemInfo}>
                      Date: {(selectedScheduleItem.item as Holiday).date}
                    </Text>
                  </View>
                )}

                <View style={styles.scheduleItemActions}>
                  {selectedScheduleItem.type === 'task' && (
                    <TouchableOpacity
                      style={[styles.scheduleItemButton, styles.completeButton]}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        toggleTask((selectedScheduleItem.item as Task).id);
                        setScheduleItemModalVisible(false);
                        setSelectedScheduleItem(null);
                      }}
                    >
                      <Text style={styles.scheduleItemButtonText}>✓ Complete</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.scheduleItemButton, styles.editButton]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setScheduleItemModalVisible(false);
                      setSelectedScheduleItem(null);
                      if (selectedScheduleItem.type === 'task') router.push('/tasks' as any);
                      else if (selectedScheduleItem.type === 'event') router.push('/calendar' as any);
                      else if (selectedScheduleItem.type === 'note') router.push('/notes' as any);
                      else if (selectedScheduleItem.type === 'workout') router.push('/workout' as any);
                    }}
                  >
                    <Text style={styles.scheduleItemButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scheduleItemButton, styles.deleteButton]}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      if (selectedScheduleItem.type === 'task') {
                        deleteTask((selectedScheduleItem.item as Task).id);
                      } else if (selectedScheduleItem.type === 'event') {
                        deleteEvent((selectedScheduleItem.item as Event).id);
                      } else if (selectedScheduleItem.type === 'note') {
                        deleteNote((selectedScheduleItem.item as Note).id);
                      } else if (selectedScheduleItem.type === 'workout') {
                        deleteWorkout((selectedScheduleItem.item as Workout).id);
                      } else if (selectedScheduleItem.type === 'holiday') {
                        deleteHoliday((selectedScheduleItem.item as Holiday).id);
                      }
                      setScheduleItemModalVisible(false);
                      setSelectedScheduleItem(null);
                    }}
                  >
                    <Text style={styles.scheduleItemButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setScheduleItemModalVisible(false);
                    setSelectedScheduleItem(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

