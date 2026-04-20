import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Database,
  Shield,
  Info,
  CheckCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

export default function SettingsScreen() {
  const {
    exportData,
    importData,
    tasks,
    notes,
    habits,
    habitCompletions,
    workouts,
    books,
    transactions,
    budgets,
    giftPeople,
    priorities,
    events,
    moods,
  } = useData();

  const [importSuccess, setImportSuccess] = useState(false);

  const totalHabitCompletions = Object.values(habitCompletions).filter(Boolean).length;
  const totalGifts = giftPeople.reduce((s, p) => s + p.gifts.length, 0);
  const totalPriorities = Object.values(priorities).reduce((s, arr) => s + arr.length, 0);
  const totalMoods = Object.values(moods).reduce((s, d) => s + d.entries.length, 0);

  const stats = [
    { label: 'Tasks', value: tasks.length, emoji: '✅' },
    { label: 'Notes', value: notes.length, emoji: '📝' },
    { label: 'Habits', value: habits.length, emoji: '⭐' },
    { label: 'Check-ins', value: totalHabitCompletions, emoji: '🔥' },
    { label: 'Workouts', value: workouts.length, emoji: '💪' },
    { label: 'Books', value: books.length, emoji: '📚' },
    { label: 'Transactions', value: transactions.length, emoji: '💰' },
    { label: 'Budgets', value: budgets.length, emoji: '🏦' },
    { label: 'Gifts', value: totalGifts, emoji: '🎁' },
    { label: 'Priorities', value: totalPriorities, emoji: '🎯' },
    { label: 'Events', value: events.length, emoji: '📅' },
    { label: 'Mood entries', value: totalMoods, emoji: '😊' },
  ];

  const handleExport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const json = exportData();
      const filename = `zenith-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        await Share.share({ message: json, title: filename });
        return;
      }

      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Share.share({ url: path, title: filename, message: 'Zenith data backup' });
    } catch (err) {
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const json = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });

      Alert.alert(
        'Restore Backup',
        'This will overwrite your current data with the backup. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await importData(json);
                setImportSuccess(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => setImportSuccess(false), 3000);
              } catch {
                Alert.alert('Restore failed', 'The file appears to be invalid or corrupted.');
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Import failed', 'Could not read the selected file.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This permanently deletes everything in Zenith — tasks, habits, notes, budgets, and more. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Export a backup first if you want to keep your data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await importData(JSON.stringify({
                        version: 1,
                        exportedAt: new Date().toISOString(),
                        tasks: [], taskLists: [], notes: [], events: [],
                        habits: [], habitCompletions: {}, priorities: {},
                        moods: {}, workouts: [], workoutTemplates: [],
                        books: [], budgets: [], transactions: [],
                        debts: [], savings: [], giftPeople: [],
                        holidays: [], noteCategories: [], taskCategories: [],
                      }));
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } catch {
                      Alert.alert('Error', 'Could not clear data.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Data backup */}
        <Text style={styles.groupLabel}>DATA BACKUP</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '22' }]}>
              <Download size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Export Backup</Text>
              <Text style={styles.rowSub}>Save all your data as a JSON file</Text>
            </View>
            <ChevronRight size={16} color={Colors.textDim} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleImport}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.success + '22' }]}>
              <Upload size={18} color={Colors.success} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Restore Backup</Text>
              <Text style={styles.rowSub}>Import a previously exported .json file</Text>
            </View>
            {importSuccess
              ? <CheckCircle size={18} color={Colors.success} />
              : <ChevronRight size={16} color={Colors.textDim} />}
          </TouchableOpacity>
        </View>

        {importSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.successText}>Data restored successfully!</Text>
          </View>
        )}

        {/* Stats */}
        <Text style={styles.groupLabel}>YOUR DATA</Text>
        <View style={styles.statsGrid}>
          {stats.map(s => (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Privacy note */}
        <Text style={styles.groupLabel}>PRIVACY</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#6366f122' }]}>
              <Shield size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>All data stays on your device</Text>
              <Text style={styles.rowSub}>Zenith never sends your data to any server. Everything lives in your phone's local storage.</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <Text style={styles.groupLabel}>ABOUT</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Info size={18} color={Colors.textDim} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Zenith Productivity Hub</Text>
              <Text style={styles.rowSub}>Version 1.0  •  Your whole life, beautifully organized</Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <Text style={[styles.groupLabel, { color: Colors.danger }]}>DANGER ZONE</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={handleClearData}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.danger + '22' }]}>
              <Trash2 size={18} color={Colors.danger} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: Colors.danger }]}>Clear All Data</Text>
              <Text style={styles.rowSub}>Permanently delete everything. Export a backup first.</Text>
            </View>
            <ChevronRight size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textDim,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textDim,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.success + '22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.success + '44',
  },
  successText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 8,
  },
  statCell: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textDim,
    textAlign: 'center',
  },
});
