import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Bell } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { updateBingoWidget } from '@/widgets/widgetTaskHandler';
import { fireBingoMilestone, fireBingoComplete, scheduleBingoWeeklyCheckIn, scheduleBingoMonthlyMotivation, cancelAllBingoNotifications } from '@/utils/bingoNotifications';

const BACKGROUND_COLORS = [
  '#2a2a2a', '#8b5cf6', '#6366f1', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function BingoScreen() {
  const { bingoData, bingoPrize, toggleBingo, updateBingo, updateBingoPrize } = useData();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [prizeModalVisible, setPrizeModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editEmoji, setEditEmoji] = useState('');
  const [editText, setEditText] = useState('');
  const [editBg, setEditBg] = useState('');
  const [editImg, setEditImg] = useState('');

  const [prizeTitle, setPrizeTitle] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeEmoji, setPrizeEmoji] = useState('');
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [weeklyCheckInEnabled, setWeeklyCheckInEnabled] = useState(false);
  const [monthlyMotivationEnabled, setMonthlyMotivationEnabled] = useState(false);

  const completedCount = bingoData.filter(item => item.d).length;

  const checkBingo = () => {
    for (let r = 0; r < 5; r++) {
      if (
        bingoData[r * 5].d &&
        bingoData[r * 5 + 1].d &&
        bingoData[r * 5 + 2].d &&
        bingoData[r * 5 + 3].d &&
        bingoData[r * 5 + 4].d
      ) {
        return true;
      }
    }

    for (let c = 0; c < 5; c++) {
      if (
        bingoData[c].d &&
        bingoData[c + 5].d &&
        bingoData[c + 10].d &&
        bingoData[c + 15].d &&
        bingoData[c + 20].d
      ) {
        return true;
      }
    }

    if (
      bingoData[0].d &&
      bingoData[6].d &&
      bingoData[12].d &&
      bingoData[18].d &&
      bingoData[24].d
    ) {
      return true;
    }
    if (
      bingoData[4].d &&
      bingoData[8].d &&
      bingoData[12].d &&
      bingoData[16].d &&
      bingoData[20].d
    ) {
      return true;
    }

    return false;
  };

  const isBlackout = bingoData.every(item => item.d);
  const hasBingo = checkBingo();

  // Widget data + smart notifications
  useEffect(() => {
    const recentGoal = [...bingoData].reverse().find(item => item.d && item.t !== 'FREE SPACE')?.t ?? '';
    const cells = bingoData.map(item => ({
      emoji: item.e ?? '',
      text: item.t ?? '',
      done: item.d ?? false,
      isFreeSpace: item.t === 'FREE SPACE',
    }));
    updateBingoWidget({ cells: cells as any, completedCount, hasBingo, recentGoal });

    scheduleBingoWeeklyCheckIn(completedCount);
    scheduleBingoMonthlyMotivation(completedCount);

    if (completedCount === 25) {
      fireBingoComplete();
    }

    // Check each row, column, diagonal for new completions
    for (let r = 0; r < 5; r++) {
      const rowComplete = [0,1,2,3,4].every(c => bingoData[r * 5 + c].d);
      if (rowComplete) fireBingoMilestone(`row_${r}`, completedCount);
    }
    for (let c = 0; c < 5; c++) {
      const colComplete = [0,1,2,3,4].every(r => bingoData[r * 5 + c].d);
      if (colComplete) fireBingoMilestone(`col_${c}`, completedCount);
    }
    const diagMain = [0,6,12,18,24].every(i => bingoData[i].d);
    if (diagMain) fireBingoMilestone('diag_main', completedCount);
    const diagAnti = [4,8,12,16,20].every(i => bingoData[i].d);
    if (diagAnti) fireBingoMilestone('diag_anti', completedCount);
  }, [bingoData, completedCount, hasBingo]);

  const handleCellPress = (index: number) => {
    if (bingoData[index].t === 'FREE SPACE') return;
    toggleBingo(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCellLongPress = (index: number) => {
    if (bingoData[index].t === 'FREE SPACE') return;
    setEditingIndex(index);
    setEditEmoji(bingoData[index].e);
    setEditText(bingoData[index].t);
    setEditBg(bingoData[index].bg || '#2a2a2a');
    setEditImg(bingoData[index].img || '');
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditImg(result.assets[0].uri);
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editText.trim()) {
      updateBingo(editingIndex, {
        e: editEmoji,
        t: editText,
        bg: editBg,
        img: editImg,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditModalVisible(false);
  };

  const openPrizeModal = () => {
    setPrizeTitle(bingoPrize.title);
    setPrizeDescription(bingoPrize.description);
    setPrizeEmoji(bingoPrize.emoji);
    setPrizeModalVisible(true);
  };

  const handleSavePrize = () => {
    if (prizeTitle.trim()) {
      updateBingoPrize({
        title: prizeTitle.trim(),
        description: prizeDescription.trim(),
        emoji: prizeEmoji,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPrizeModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 2026 BINGO</Text>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => setWidgetModalVisible(true)}>
          <Bell size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        {isBlackout ? (
          <TouchableOpacity onPress={openPrizeModal} activeOpacity={0.8}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>🎉🎉🎉 BLACKOUT! 🎉🎉🎉</Text>
              <Text style={styles.prizeText}>{bingoPrize.emoji} {bingoPrize.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : hasBingo ? (
          <TouchableOpacity onPress={openPrizeModal} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>🎉 BINGO! 🎉</Text>
              <Text style={styles.prizeText}>{bingoPrize.emoji} {bingoPrize.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{completedCount}/25 completed</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.editPrizeButton} onPress={openPrizeModal}>
        <Text style={styles.editPrizeText}>✏️ Edit Prize</Text>
      </TouchableOpacity>

      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.bingoGrid}>
          {bingoData.map((item, index) => {
            const isCompleted = item.d;
            const isFreeSpace = item.t === 'FREE SPACE';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bingoCell,
                  { backgroundColor: item.bg || '#2a2a2a' },
                  isCompleted && styles.bingoCellCompleted,
                  isFreeSpace && styles.bingoCellFree,
                ]}
                onPress={() => handleCellPress(index)}
                onLongPress={() => handleCellLongPress(index)}
                activeOpacity={0.7}
              >
                {isCompleted && !isFreeSpace ? (
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.completedOverlay}
                  >
                    {item.img ? (
                      <Image source={{ uri: item.img }} style={styles.cellImage} />
                    ) : (
                      <Text style={styles.cellEmoji}>{item.e}</Text>
                    )}
                    <Text style={styles.cellText}>{item.t}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    {item.img ? (
                      <Image source={{ uri: item.img }} style={styles.cellImage} />
                    ) : (
                      <Text style={styles.cellEmoji}>{item.e}</Text>
                    )}
                    <Text style={[styles.cellText, isFreeSpace && styles.cellTextFree]}>
                      {item.t}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Play</Text>
          <Text style={styles.instructionsText}>
            • Tap a cell to mark it as completed{'\n'}
            • Complete 5 in a row (horizontal, vertical, or diagonal) for BINGO!{'\n'}
            • Complete all 25 for BLACKOUT!{'\n'}
            • Long press to edit a goal
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emoji</Text>
              <TextInput
                style={styles.emojiInput}
                value={editEmoji}
                onChangeText={setEditEmoji}
                placeholder="📚"
                placeholderTextColor={Colors.textDim}
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal</Text>
              <TextInput
                style={styles.textInput}
                value={editText}
                onChangeText={setEditText}
                placeholder="Enter your goal"
                placeholderTextColor={Colors.textDim}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Image (optional)</Text>
              <View style={styles.imagePickerRow}>
                {editImg ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: editImg }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setEditImg('')}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <ImageIcon size={24} color={Colors.textDim} />
                    <Text style={styles.imagePickerText}>Pick Image</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Background Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorPicker}
              >
                {BACKGROUND_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editBg === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setEditBg(color);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            {editingIndex !== null && (
              <View style={[styles.previewCell, { backgroundColor: editBg }]}>
                {editImg ? (
                  <Image source={{ uri: editImg }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.previewEmoji}>{editEmoji}</Text>
                )}
                <Text style={styles.previewText}>{editText}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={prizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrizeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Prize</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prize Emoji</Text>
              <TextInput
                style={styles.emojiInput}
                value={prizeEmoji}
                onChangeText={setPrizeEmoji}
                placeholder="🎁"
                placeholderTextColor={Colors.textDim}
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prize Title</Text>
              <TextInput
                style={styles.textInput}
                value={prizeTitle}
                onChangeText={setPrizeTitle}
                placeholder="Enter prize title"
                placeholderTextColor={Colors.textDim}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prize Description</Text>
              <TextInput
                style={styles.textInput}
                value={prizeDescription}
                onChangeText={setPrizeDescription}
                placeholder="Enter prize description"
                placeholderTextColor={Colors.textDim}
                multiline
              />
            </View>

            <View style={styles.prizePreview}>
              <Text style={styles.prizePreviewEmoji}>{prizeEmoji}</Text>
              <Text style={styles.prizePreviewTitle}>{prizeTitle}</Text>
              <Text style={styles.prizePreviewDesc}>{prizeDescription}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setPrizeModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSavePrize}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Widget & Notification Settings Modal */}
      <Modal
        visible={widgetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWidgetModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 }}>📱 Widgets & Notifications</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: Colors.textDim, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                Add a "2026 Bingo Goals" widget: Long-press your Android home screen → Widgets → Zenith → 2026 Bingo Goals. Shows completed goals, bingo status, and most recent goal.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Weekly Check-In</Text>
                  <Text style={{ color: Colors.textDim, fontSize: 12, marginTop: 2 }}>Sunday reminder of your bingo progress this week</Text>
                </View>
                <Switch
                  value={weeklyCheckInEnabled}
                  onValueChange={async (v) => {
                    setWeeklyCheckInEnabled(v);
                    if (v) { await scheduleBingoWeeklyCheckIn(completedCount); }
                    else { await cancelAllBingoNotifications(); }
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor={weeklyCheckInEnabled ? '#ffffff' : Colors.textDim}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Monthly Motivation</Text>
                  <Text style={{ color: Colors.textDim, fontSize: 12, marginTop: 2 }}>1st of each month with your bingo progress update</Text>
                </View>
                <Switch
                  value={monthlyMotivationEnabled}
                  onValueChange={async (v) => {
                    setMonthlyMotivationEnabled(v);
                    if (v) { await scheduleBingoMonthlyMotivation(completedCount); }
                    else { await cancelAllBingoNotifications(); }
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor={monthlyMotivationEnabled ? '#ffffff' : Colors.textDim}
                />
              </View>
            </ScrollView>
            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
              onPress={() => setWidgetModalVisible(false)}
            >
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Done</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
    marginTop: 4,
  },
  editPrizeButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editPrizeText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  progressBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textDim,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  bingoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  bingoCell: {
    width: '18.4%',
    aspectRatio: 1,
    margin: '0.8%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    overflow: 'hidden',
  },
  bingoCellCompleted: {
    borderColor: Colors.primary,
  },
  bingoCellFree: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderColor: Colors.primary,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  cellText: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  cellTextFree: {
    color: 'white',
    fontWeight: '700' as const,
  },
  instructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emojiInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: 'white',
    borderWidth: 3,
  },
  previewCell: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  previewEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  cellImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 2,
  },
  imagePickerRow: {
    marginBottom: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
  },
  imagePickerText: {
    fontSize: 14,
    color: Colors.textDim,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700' as const,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 4,
  },
  prizePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prizePreviewEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  prizePreviewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  prizePreviewDesc: {
    fontSize: 13,
    color: Colors.textDim,
    textAlign: 'center',
  },
});
