import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DateTimePickerProps {
  label?: string;
  date?: string;
  time?: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  showDate?: boolean;
  showTime?: boolean;
}

export default function DateTimePicker({
  label = 'Date & Time',
  date = '',
  time = '',
  onDateChange,
  onTimeChange,
  showDate = true,
  showTime = true,
}: DateTimePickerProps) {
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    date ? new Date(date) : new Date()
  );
  const [selectedHour, setSelectedHour] = useState(
    time ? parseInt(time.split(':')[0]) : 9
  );
  const [selectedMinute, setSelectedMinute] = useState(
    time ? parseInt(time.split(':')[1]) : 0
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const handleDateSelect = () => {
    const formatted = formatDate(selectedDate);
    onDateChange(formatted);
    setDateModalVisible(false);
  };

  const handleTimeSelect = () => {
    const formatted = formatTime(selectedHour, selectedMinute);
    onTimeChange(formatted);
    setTimeModalVisible(false);
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day;
      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
          onPress={() => {
            setSelectedDate(new Date(year, month, day));
          }}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {showDate && (
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setDateModalVisible(true)}
          >
            <CalendarIcon size={18} color={Colors.primary} />
            <Text style={styles.inputButtonText}>
              {date || 'Select Date'}
            </Text>
          </TouchableOpacity>
        )}

        {showTime && (
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setTimeModalVisible(true)}
          >
            <Clock size={18} color={Colors.secondary} />
            <Text style={styles.inputButtonText}>
              {time || 'Select Time'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDateModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <View style={styles.monthYearRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.monthYearText}>
                {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>

              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Text key={i} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setDateModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleDateSelect}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTimeModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Time</Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePicker}>
                <Text style={styles.timeLabel}>Hour</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        selectedHour === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedHour(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedHour === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timePicker}>
                <Text style={styles.timeLabel}>Minute</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        selectedMinute === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedMinute(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedMinute === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleTimeSelect}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  inputButtonText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '700' as const,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  timePicker: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
  },
  timeScroll: {
    height: 200,
    width: 80,
  },
  timeOption: {
    padding: 12,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  timeOptionText: {
    fontSize: 18,
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: 'white',
    fontWeight: '700' as const,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  modalButtonPrimary: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
