import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Shield,
  Info,
  CheckCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import {
  loadSyncCreds,
  saveSyncCreds,
  clearSyncCreds,
  pushToCloud,
  pullFromCloud,
  getLastSyncTime,
  getDeviceIdPublic,
  SETUP_SQL,
  SyncCreds,
} from '@/utils/cloudSync';

export default function SettingsScreen() {
  const {
    exportData,
    importData,
    syncStatus,
    lastSyncedAt,
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

  // Cloud sync state
  const [syncCreds, setSyncCreds] = useState<SyncCreds | null>(null);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [syncKeyDraft, setSyncKeyDraft] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [showSetupSQL, setShowSetupSQL] = useState(false);

  useEffect(() => {
    loadSyncCreds().then(c => { if (c) { setSyncCreds(c); setSyncKeyDraft(c.syncKey ?? ''); } });
    getLastSyncTime().then(t => setLastSynced(t));
    getDeviceIdPublic().then(id => setDeviceId(id));
  }, []);

  const handleSaveSyncCreds = async () => {
    if (!urlDraft.trim() || !keyDraft.trim()) return;
    const creds = { url: urlDraft.trim(), anonKey: keyDraft.trim(), syncKey: syncKeyDraft.trim() || undefined };
    await saveSyncCreds(creds);
    setSyncCreds(creds);
    setSyncModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePush = async () => {
    try {
      setSyncing(true);
      const json = exportData();
      await pushToCloud(json);
      const t = await getLastSyncTime();
      setLastSynced(t);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Synced', 'Your data has been backed up to the cloud.');
    } catch (e: any) {
      Alert.alert('Sync failed', e.message ?? 'Could not reach your Supabase project. Check your URL and key.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePull = async () => {
    Alert.alert(
      'Restore from Cloud',
      'This will overwrite your local data with the version saved in the cloud. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncing(true);
              const json = await pullFromCloud();
              if (!json) { Alert.alert('Nothing found', 'No cloud backup found for this device.'); return; }
              await importData(json);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restored', 'Your data has been restored from the cloud.');
            } catch (e: any) {
              Alert.alert('Restore failed', e.message ?? 'Could not reach your Supabase project.');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect', 'Remove your Supabase credentials from this device? Your cloud data will remain safe.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => { await clearSyncCreds(); setSyncCreds(null); setLastSynced(null); },
      },
    ]);
  };

  const formatSyncTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
        // Web: trigger a download via a temporary anchor element
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // iOS + Android: write to cache then share via expo-sharing
      // expo-sharing handles the content URI conversion Android requires
      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      await file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Zenith Backup',
        UTI: 'public.json',
      });
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
      const file = new FileSystem.File(asset.uri);
      const json = await file.text();

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

        {/* Cloud sync */}
        <Text style={styles.groupLabel}>CLOUD SYNC</Text>
        <View style={styles.group}>
          {syncCreds ? (
            <>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.success + '22' }]}>
                  <Cloud size={18} color={Colors.success} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Connected · Auto-sync on</Text>
                  <Text style={styles.rowSub}>
                    {syncStatus === 'syncing' && '⏳ Syncing…'}
                    {syncStatus === 'synced' && `✅ Synced ${lastSyncedAt ? formatSyncTime(lastSyncedAt) : 'just now'}`}
                    {syncStatus === 'error' && '⚠️ Last sync failed — will retry on next change'}
                    {syncStatus === 'idle' && (lastSyncedAt ? `Last synced ${formatSyncTime(lastSyncedAt)}` : 'Waiting for first change…')}
                  </Text>
                </View>
                {syncStatus === 'syncing' && <RefreshCw size={16} color={Colors.primary} />}
                {syncStatus === 'synced' && <CheckCircle size={16} color={Colors.success} />}
                {syncStatus === 'error' && <AlertCircle size={16} color={Colors.danger} />}
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handlePush} disabled={syncing}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '22' }]}>
                  <Upload size={18} color={Colors.primary} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{syncing ? 'Syncing…' : 'Backup to Cloud'}</Text>
                  <Text style={styles.rowSub}>Push your current data to Supabase</Text>
                </View>
                <ChevronRight size={16} color={Colors.textDim} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handlePull} disabled={syncing}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.warning + '22' }]}>
                  <Download size={18} color={Colors.warning} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Restore from Cloud</Text>
                  <Text style={styles.rowSub}>Pull your last backup from Supabase</Text>
                </View>
                <ChevronRight size={16} color={Colors.textDim} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handleDisconnect}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.danger + '22' }]}>
                  <CloudOff size={18} color={Colors.danger} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, { color: Colors.danger }]}>Disconnect</Text>
                  <Text style={styles.rowSub}>Remove credentials from this device</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.row} onPress={() => { setUrlDraft(''); setKeyDraft(''); setSyncModalVisible(true); }}>
              <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '22' }]}>
                <Cloud size={18} color={Colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Connect Supabase</Text>
                <Text style={styles.rowSub}>Sync your data across devices using your free Supabase project</Text>
              </View>
              <ChevronRight size={16} color={Colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Setup SQL hint */}
        <TouchableOpacity
          style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 4 }}
          onPress={() => setShowSetupSQL(v => !v)}
        >
          <Text style={{ fontSize: 12, color: Colors.primary }}>
            {showSetupSQL ? 'Hide' : 'Show'} Supabase setup instructions
          </Text>
        </TouchableOpacity>
        {showSetupSQL && (
          <View style={styles.sqlBox}>
            <Text style={styles.sqlTitle}>1. Create a free project at supabase.com</Text>
            <Text style={styles.sqlTitle}>2. Go to SQL Editor and run:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.sqlCode}>{SETUP_SQL}</Text>
            </ScrollView>
            <Text style={styles.sqlTitle}>3. Copy your project URL + anon key from Project Settings → API</Text>
            <Text style={[styles.sqlTitle, { marginTop: 6 }]}>Your Device ID (use same ID on other devices to share data):</Text>
            <Text style={styles.sqlCode} selectable>{deviceId}</Text>
          </View>
        )}

        {/* Data backup */}
        <Text style={styles.groupLabel}>LOCAL BACKUP</Text>
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

      {/* Supabase credentials modal */}
      <Modal visible={syncModalVisible} transparent animationType="slide" onRequestClose={() => setSyncModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Connect Supabase</Text>
              <TouchableOpacity onPress={() => setSyncModalVisible(false)}>
                <X size={20} color={Colors.textDim} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Enter your Supabase project URL and anon/public key. Tap "Show setup instructions" on the settings page if you haven't created the table yet.</Text>
            <Text style={styles.inputLabel}>Project URL</Text>
            <TextInput
              style={styles.input}
              value={urlDraft}
              onChangeText={setUrlDraft}
              placeholder="https://xxxx.supabase.co"
              placeholderTextColor={Colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputLabel}>Anon / Public Key</Text>
            <TextInput
              style={styles.input}
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="eyJhbGci..."
              placeholderTextColor={Colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Sync Key (optional — for cross-device sync)</Text>
            <TextInput
              style={styles.input}
              value={syncKeyDraft}
              onChangeText={setSyncKeyDraft}
              placeholder="e.g. my-zenith-account"
              placeholderTextColor={Colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={{ fontSize: 11, color: Colors.textDim, marginBottom: 12, lineHeight: 16 }}>
              Set the same Sync Key on your phone and iPad web app so they share data. Leave blank to use a device-specific backup.
            </Text>
            <TouchableOpacity
              style={[styles.connectBtn, (!urlDraft.trim() || !keyDraft.trim()) && { opacity: 0.4 }]}
              onPress={handleSaveSyncCreds}
              disabled={!urlDraft.trim() || !keyDraft.trim()}
            >
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.connectBtnGradient}>
                <Text style={styles.connectBtnText}>Save & Connect</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  sqlBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  sqlTitle: {
    fontSize: 12,
    color: Colors.textDim,
    lineHeight: 18,
  },
  sqlCode: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 19,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 14,
  },
  connectBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  connectBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'white',
  },
});
