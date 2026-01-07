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
  MapPin,
  Droplets,
  Wind,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { SubTask, Holiday } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NAV_ITEMS = [
  { name: 'Home', icon: Home, route: '/' },
  { name: 'Tasks', icon: CheckSquare, route: '/tasks' },
  { name: 'Calendar', icon: Calendar, route: '/calendar' },
  { name: 'Habits', icon: Star, route: '/habits' },
  { name: 'Workout', icon: Dumbbell, route: '/workout' },
  { name: 'Notes', icon: FileText, route: '/notes' },
  { name: 'Books', icon: BookOpen, route: '/books' },
  { name: 'Budget', icon: Wallet, route: '/budget' },
  { name: 'Gifts', icon: Gift, route: '/gifts' },
  { name: 'Bingo', icon: Target, route: '/bingo' },
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
  } = useData();

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
  const weatherAnimValue = useRef(new Animated.Value(0)).current;

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

    const getWeatherData = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
        );
        const data = await response.json();
        
        const weatherCode = data.current.weather_code;
        const condition = getWeatherCondition(weatherCode);
        const icon = getWeatherIcon(weatherCode);
        
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
        );
        const geoData = await geoResponse.json();
        const locationName = geoData.results?.[0]?.name || 'Unknown';
        
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          location: locationName,
          icon,
        });
      } catch (error) {
        console.log('Error fetching weather data:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      try {
        setWeatherLoading(true);
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await getWeatherData(latitude, longitude);
            },
            (error) => {
              console.log('Error getting location:', error);
              setWeatherLoading(false);
            }
          );
        }
      } catch (error) {
        console.log('Error fetching weather:', error);
        setWeatherLoading(false);
      }
    } else {
      try {
        setWeatherLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission denied');
          setWeatherLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        await getWeatherData(location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.log('Error fetching weather:', error);
        setWeatherLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    rolloverPriorities();
    fetchWeather();
  }, [rolloverPriorities, fetchWeather]);

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

  const todayTasks = tasks.filter(t => t.date === today && !t.completed);
  const todayEvents = events.filter(e => e.date === today);
  const todayWorkouts = workouts.filter(w => w.date === today);
  const todayMoods = moods[today]?.entries || [];

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
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            {sidebarOpen ? (
              <X size={24} color={Colors.text} />
            ) : (
              <Menu size={24} color={Colors.text} />
            )}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Zenith</Text>
          <Text style={styles.headerSubtitle}>Home</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {weather && (
            <View style={styles.weatherCard}>
              <LinearGradient
                colors={['#4A90E2', '#7B68EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.weatherGradient}
              >
                <View style={styles.weatherHeader}>
                  <View style={styles.weatherLocation}>
                    <MapPin size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.weatherLocationText}>{weather.location}</Text>
                  </View>
                  <TouchableOpacity onPress={fetchWeather} style={styles.weatherRefresh}>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: weatherAnimValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🔄</Text>
                    </Animated.View>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.weatherMain}>
                  <Animated.Text
                    style={[
                      styles.weatherIcon,
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
                  <View style={styles.weatherTempContainer}>
                    <Text style={styles.weatherTemp}>{weather.temp}°F</Text>
                    <Text style={styles.weatherCondition}>{weather.condition}</Text>
                  </View>
                </View>
                
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherDetail}>
                    <Droplets size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.weatherDetailText}>{weather.humidity}%</Text>
                  </View>
                  <View style={styles.weatherDetail}>
                    <Wind size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.weatherDetailText}>{weather.windSpeed} mph</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
          
          {weatherLoading && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.weatherLoadingText}>Loading weather...</Text>
              </View>
            </View>
          )}

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

          <View style={styles.gridRow}>
            <View style={[styles.card, styles.halfCard]}>
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
                      <Text
                        style={[
                          styles.priorityText,
                          priority.completed && styles.priorityTextCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {priority.overdue && '⚠️ '}{priority.task}
                      </Text>
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

            <View style={[styles.card, styles.halfCard]}>
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
                      <Text style={styles.habitText} numberOfLines={1}>
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
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Calendar</Text>
            {renderMiniCalendar()}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Today&apos;s Schedule</Text>
            {todayTasks.length === 0 && todayEvents.length === 0 && todayWorkouts.length === 0 ? (
              <Text style={styles.emptyText}>Nothing scheduled for today 🎉</Text>
            ) : (
              <View style={styles.scheduleList}>
                {todayTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.scheduleItem,
                      { borderLeftColor: task.priority === 'high' ? Colors.danger : task.priority === 'medium' ? Colors.warning : Colors.success },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/tasks');
                    }}
                  >
                    <Text style={styles.scheduleIcon}>✅</Text>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleTitle}>{task.name}</Text>
                      {task.time && (
                        <Text style={styles.scheduleTime}>{task.time}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {todayEvents.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.scheduleItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/calendar');
                    }}
                  >
                    <Text style={styles.scheduleIcon}>📅</Text>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleTitle}>{event.name}</Text>
                      {event.time && (
                        <Text style={styles.scheduleTime}>{event.time}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {todayWorkouts.map(workout => (
                  <TouchableOpacity
                    key={workout.id}
                    style={styles.scheduleItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/workout');
                    }}
                  >
                    <Text style={styles.scheduleIcon}>💪</Text>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleTitle}>{workout.name}</Text>
                      {workout.duration > 0 && (
                        <Text style={styles.scheduleTime}>{workout.duration} min</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
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
            router.push('/tasks');
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
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
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
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={Colors.textDim}
                  value={priorityDate}
                  onChangeText={setPriorityDate}
                />
                <View style={{ width: 8 }} />
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Time (HH:MM)"
                  placeholderTextColor={Colors.textDim}
                  value={priorityTime}
                  onChangeText={setPriorityTime}
                />
              </View>
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
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingHolidayId ? 'Edit Holiday' : 'Add Holiday'}</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={Colors.textDim}
                value={selectedDateForHoliday}
                onChangeText={setSelectedDateForHoliday}
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: Colors.card,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: 'white',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 13,
    color: Colors.textDim,
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderLeftColor: Colors.primary,
  },
  sidebarItemText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  sidebarItemTextActive: {
    color: Colors.primary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
  mainContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginLeft: 'auto',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.glass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    paddingVertical: 16,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    marginBottom: 4,
  },
  priorityNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'white',
  },
  priorityText: {
    fontSize: 13,
    color: Colors.text,
  },
  priorityTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
    color: Colors.textDim,
  },
  priorityDateTime: {
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 2,
  },
  priorityDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityCheckBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityCheckBtnCompleted: {
    backgroundColor: Colors.textDim,
  },
  priorityCheckText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700' as const,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  habitText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  habitCheck: {
    fontSize: 16,
  },
  pinnedNote: {
    backgroundColor: '#A7D8F0',
    padding: 16,
    borderRadius: 4,
    transform: [{ rotate: '-1deg' }],
  },
  pinnedNoteTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 8,
  },
  pinnedNoteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  pinnedNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  pinnedIndicator: {
    fontSize: 12,
    color: Colors.textDim,
  },
  calendarContainer: {
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayLabel: {
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
    marginVertical: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: Colors.primary,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: '700' as const,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodEmoji: {
    padding: 8,
    borderRadius: 12,
    opacity: 0.5,
    position: 'relative',
  },
  moodEmojiSelected: {
    opacity: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.1 }],
  },
  moodEmojiText: {
    fontSize: 28,
  },
  moodCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'white',
  },
  moodInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  scheduleList: {
    gap: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: 12,
  },
  scheduleIcon: {
    fontSize: 20,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  subtasksSection: {
    marginBottom: 16,
  },
  subtasksLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  subtaskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  subtaskText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  subtaskDelete: {
    fontSize: 20,
    color: Colors.danger,
    fontWeight: '700' as const,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addSubtaskBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubtaskBtnText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700' as const,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  calendarDayImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    opacity: 0.3,
  },
  calendarDayEmoji: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
  },
  holidaySettingsBtn: {
    padding: 4,
    marginLeft: 8,
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  animationOption: {
    width: '30%',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  animationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  animationOptionText: {
    fontSize: 24,
    marginBottom: 4,
  },
  animationOptionLabel: {
    fontSize: 10,
    color: Colors.textDim,
    textTransform: 'capitalize',
  },
  fireworkParticle: {
    position: 'absolute',
  },
  snowflake: {
    position: 'absolute',
    top: -20,
  },
  heartParticle: {
    position: 'absolute',
    bottom: 0,
  },
  sparkleParticle: {
    position: 'absolute',
  },
  confettiParticle: {
    position: 'absolute',
    top: -30,
  },
  confettiPiece: {
    width: 6,
    height: 10,
    borderRadius: 2,
  },
  starParticle: {
    position: 'absolute',
  },
  holidaysList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  holidayListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 6,
  },
  holidayListText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  holidayListActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  holidayEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  holidayEditText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600' as const,
  },
  weatherCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  weatherGradient: {
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherLocationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600' as const,
  },
  weatherRefresh: {
    padding: 4,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  weatherIcon: {
    fontSize: 64,
  },
  weatherTempContainer: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: 'white',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  weatherLoading: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: Colors.textDim,
  },
});
