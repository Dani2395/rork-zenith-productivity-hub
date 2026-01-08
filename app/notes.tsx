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
import { Plus, Trash2, Lock, Pin, Search, Grid3x3, List, Image as ImageIcon, Smile, X, Unlock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Work', label: '💼 Work' },
  { value: 'Personal', label: '👤 Personal' },
  { value: 'Ideas', label: '💡 Ideas' },
  { value: 'Projects', label: '🚀 Projects' },
  { value: 'Journal', label: '📔 Journal' },
  { value: 'Recipes', label: '🍳 Recipes' },
];

const STAMPS = [
  '⭐', '❤️', '🎉', '🌟', '✨', '🎯', '🔥', '💎',
  '🌈', '🎨', '📌', '✅', '💪', '🏆', '🎵', '☀️',
  '🌙', '🦋', '🌸', '🍀', '🎭', '🎪', '🎨', '🖼️',
];

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400',
  'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=400',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
];

export default function NotesScreen() {
  const { notes, addNote, updateNote, deleteNote } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'journal'>('list');

  const [noteName, setNoteName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteLocked, setNoteLocked] = useState(false);
  const [notePinned, setNotePinned] = useState(false);
  const [noteCategory, setNoteCategory] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteStamps, setNoteStamps] = useState<string[]>([]);
  const [noteLockPin, setNoteLockPin] = useState('');

  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockingNoteId, setUnlockingNoteId] = useState<number | null>(null);
  const [unlockPin, setUnlockPin] = useState('');

  const filteredNotes = notes.filter(note => {
    if (searchQuery && !note.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory && note.category !== selectedCategory) {
      return false;
    }
    if (filter === 'locked' && !note.locked) return false;
    if (filter === 'unlocked' && note.locked) return false;
    return true;
  });

  const resetForm = () => {
    setNoteName('');
    setNoteText('');
    setNoteLocked(false);
    setNotePinned(false);
    setNoteCategory('');
    setNoteImages([]);
    setNoteStamps([]);
    setNoteLockPin('');
    setEditingNote(null);
  };

  const handleSaveNote = () => {
    if (!noteName.trim() || !noteText.trim()) {
      Alert.alert('Missing Information', 'Please enter both a title and content for your note');
      return;
    }

    if (noteLocked && !noteLockPin.trim()) {
      Alert.alert('PIN Required', 'Please enter a 4-digit PIN to lock this note');
      return;
    }

    if (noteLocked && noteLockPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingNote !== null) {
      updateNote(editingNote, {
        name: noteName.trim(),
        text: noteText.trim(),
        locked: noteLocked,
        pinned: notePinned,
        category: noteCategory,
        images: noteImages,
        stamps: noteStamps,
        lockPin: noteLocked ? noteLockPin : undefined,
        lastModified: timestamp,
      });
    } else {
      addNote({
        name: noteName.trim(),
        text: noteText.trim(),
        locked: noteLocked,
        pinned: notePinned,
        category: noteCategory,
        date: new Date().toISOString().split('T')[0],
        images: noteImages,
        stamps: noteStamps,
        lockPin: noteLocked ? noteLockPin : undefined,
        createdDate: timestamp,
        lastModified: timestamp,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setModalVisible(false);
  };

  const handleEditNote = (noteId: number) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      if (note.locked && note.lockPin) {
        setUnlockingNoteId(noteId);
        setUnlockModalVisible(true);
      } else {
        openNoteForEdit(note);
      }
    }
  };

  const openNoteForEdit = (note: typeof notes[0]) => {
    setEditingNote(note.id);
    setNoteName(note.name);
    setNoteText(note.text);
    setNoteLocked(note.locked);
    setNotePinned(note.pinned);
    setNoteCategory(note.category);
    setNoteImages(note.images || []);
    setNoteStamps(note.stamps || []);
    setNoteLockPin(note.lockPin || '');
    setModalVisible(true);
  };

  const handleUnlock = () => {
    if (unlockingNoteId === null) return;
    const note = notes.find(n => n.id === unlockingNoteId);
    if (note && note.lockPin === unlockPin) {
      openNoteForEdit(note);
      setUnlockModalVisible(false);
      setUnlockPin('');
      setUnlockingNoteId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Incorrect PIN', 'Please try again');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const categoryIcons: Record<string, string> = {
    Work: '💼',
    Personal: '👤',
    Ideas: '💡',
    Projects: '🚀',
    Journal: '📔',
    Recipes: '🍳',
    Study: '📚',
    Health: '💪',
    Finance: '💰',
    Travel: '✈️',
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 {viewMode === 'journal' ? 'Journal' : 'Notes'}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => {
              setViewMode(viewMode === 'list' ? 'journal' : 'list');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            {viewMode === 'list' ? (
              <Grid3x3 size={20} color={Colors.primary} />
            ) : (
              <List size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
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
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={Colors.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {['all', 'locked', 'unlocked'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f as typeof filter)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'locked' ? '🔒 ' : f === 'unlocked' ? '🔓 ' : ''}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.notesList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={viewMode === 'journal' ? styles.journalGrid : undefined}
      >
        {filteredNotes.length === 0 ? (
          <Text style={styles.emptyText}>No notes found</Text>
        ) : viewMode === 'journal' ? (
          filteredNotes.map(note => (
            <TouchableOpacity
              key={note.id}
              style={styles.journalCard}
              onPress={() => handleEditNote(note.id)}
            >
              <LinearGradient
                colors={['#f9f7f4', '#ede8e0']}
                style={styles.paperGradient}
              >
                <View style={styles.journalHeader}>
                  <View style={styles.journalIcons}>
                    {note.locked && <Lock size={12} color={Colors.danger} />}
                    {note.pinned && <Pin size={12} color={Colors.primary} />}
                  </View>
                  {note.stamps && note.stamps.length > 0 && (
                    <View style={styles.stampContainer}>
                      <Text style={styles.stamp}>{note.stamps[0]}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.journalTitle} numberOfLines={2}>
                  {note.name}
                </Text>
                <Text style={styles.journalDate}>{note.date}</Text>
                {note.images && note.images.length > 0 && (
                  <Image
                    source={{ uri: note.images[0] }}
                    style={styles.journalImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.journalText} numberOfLines={4}>
                  {note.locked ? '🔒 Locked' : note.text}
                </Text>
                <TouchableOpacity
                  style={styles.journalDeleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Trash2 size={14} color={Colors.danger} />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          filteredNotes.map(note => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              onPress={() => handleEditNote(note.id)}
            >
              <View style={styles.noteHeader}>
                <View style={styles.noteIcons}>
                  {note.locked && <Lock size={14} color={Colors.danger} />}
                  {note.pinned && <Pin size={14} color={Colors.primary} />}
                </View>
                <Text style={styles.noteName} numberOfLines={1}>
                  {note.name}
                </Text>
                {note.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {categoryIcons[note.category] || ''} {note.category}
                    </Text>
                  </View>
                )}
              </View>
              {note.lastModified && (
                <Text style={styles.noteTimestamp}>
                  {new Date(note.lastModified).toLocaleString()}
                </Text>
              )}
              {note.images && note.images.length > 0 && (
                <Image
                  source={{ uri: note.images[0] }}
                  style={styles.noteImagePreview}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.noteText} numberOfLines={2}>
                {note.locked ? '🔒 Locked' : note.text}
              </Text>
              {note.stamps && note.stamps.length > 0 && (
                <View style={styles.noteStamps}>
                  {note.stamps.slice(0, 3).map((stamp, idx) => (
                    <Text key={idx} style={styles.noteStamp}>{stamp}</Text>
                  ))}
                </View>
              )}
              {note.date && (
                <Text style={styles.noteDate}>📅 {note.date}</Text>
              )}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Trash2 size={16} color={Colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>
                {editingNote ? '✏️ Edit Note' : 'Add Note'}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Note title *"
                placeholderTextColor={Colors.textDim}
                value={noteName}
                onChangeText={setNoteName}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Note content *"
                placeholderTextColor={Colors.textDim}
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optionButton, noteLocked && styles.optionButtonActive]}
                  onPress={() => setNoteLocked(!noteLocked)}
                >
                  <Lock size={18} color={noteLocked ? 'white' : Colors.textDim} />
                  <Text style={[styles.optionText, noteLocked && styles.optionTextActive]}>
                    Lock
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, notePinned && styles.optionButtonActive]}
                  onPress={() => setNotePinned(!notePinned)}
                >
                  <Pin size={18} color={notePinned ? 'white' : Colors.textDim} />
                  <Text style={[styles.optionText, notePinned && styles.optionTextActive]}>
                    Pin
                  </Text>
                </TouchableOpacity>
              </View>

              {noteLocked && (
                <View style={styles.pinSection}>
                  <Text style={styles.inputLabel}>Set PIN (4 digits)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor={Colors.textDim}
                    value={noteLockPin}
                    onChangeText={(text) => {
                      if (/^\d{0,4}$/.test(text)) {
                        setNoteLockPin(text);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.mediaButtons}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={() => setShowImagePicker(true)}
                >
                  <ImageIcon size={18} color={Colors.primary} />
                  <Text style={styles.mediaButtonText}>Add Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={() => setShowStampPicker(true)}
                >
                  <Smile size={18} color={Colors.secondary} />
                  <Text style={styles.mediaButtonText}>Add Stamp</Text>
                </TouchableOpacity>
              </View>

              {noteImages.length > 0 && (
                <View style={styles.selectedImages}>
                  <Text style={styles.inputLabel}>Images</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.imagesRow}>
                      {noteImages.map((img, idx) => (
                        <View key={idx} style={styles.selectedImageContainer}>
                          <Image source={{ uri: img }} style={styles.selectedImage} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => setNoteImages(noteImages.filter((_, i) => i !== idx))}
                          >
                            <X size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {noteStamps.length > 0 && (
                <View style={styles.selectedStamps}>
                  <Text style={styles.inputLabel}>Stamps</Text>
                  <View style={styles.stampsRow}>
                    {noteStamps.map((stamp, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.selectedStamp}
                        onPress={() => setNoteStamps(noteStamps.filter((_, i) => i !== idx))}
                      >
                        <Text style={styles.selectedStampText}>{stamp}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {CATEGORIES.slice(1).map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        noteCategory === cat.value && styles.categoryOptionActive,
                      ]}
                      onPress={() => setNoteCategory(cat.value)}
                    >
                      <Text style={styles.categoryOptionText}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

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
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveNote}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Save Note</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showStampPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStampPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStampPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Choose a Stamp</Text>
            <ScrollView>
              <View style={styles.stampsGrid}>
                {STAMPS.map((stamp, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.stampOption}
                    onPress={() => {
                      setNoteStamps([...noteStamps, stamp]);
                      setShowStampPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.stampOptionText}>{stamp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Choose an Image</Text>
            <ScrollView>
              <View style={styles.imagesGrid}>
                {IMAGE_URLS.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.imageOption}
                    onPress={() => {
                      setNoteImages([...noteImages, url]);
                      setShowImagePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Image source={{ uri: url }} style={styles.imageOptionImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={unlockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setUnlockModalVisible(false);
          setUnlockPin('');
          setUnlockingNoteId(null);
        }}
      >
        <View style={styles.unlockOverlay}>
          <View style={styles.unlockContent}>
            <Unlock size={48} color={Colors.primary} />
            <Text style={styles.unlockTitle}>Enter PIN</Text>
            <Text style={styles.unlockSubtitle}>This note is locked</Text>
            <TextInput
              style={styles.unlockInput}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor={Colors.textDim}
              value={unlockPin}
              onChangeText={(text) => {
                if (/^\d{0,4}$/.test(text)) {
                  setUnlockPin(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
            />
            <View style={styles.unlockButtons}>
              <TouchableOpacity
                style={styles.unlockButtonSecondary}
                onPress={() => {
                  setUnlockModalVisible(false);
                  setUnlockPin('');
                  setUnlockingNoteId(null);
                }}
              >
                <Text style={styles.unlockButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unlockButtonPrimary}
                onPress={handleUnlock}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.unlockButtonGradient}
                >
                  <Text style={styles.unlockButtonText}>Unlock</Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewToggle: {
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
  journalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  journalCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
  },
  paperGradient: {
    padding: 12,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#d4c5b9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  journalIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  stampContainer: {
    position: 'absolute',
    right: 0,
    top: -4,
  },
  stamp: {
    fontSize: 32,
    opacity: 0.8,
    transform: [{ rotate: '15deg' }],
  },
  journalTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#2d2d2d',
    marginBottom: 4,
    lineHeight: 18,
  },
  journalDate: {
    fontSize: 10,
    color: '#8b7355',
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  journalImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  journalText: {
    fontSize: 11,
    color: '#4a4a4a',
    lineHeight: 16,
  },
  journalDeleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteImagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteStamps: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  noteStamp: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
  },
  filtersScroll: {
    maxHeight: 50,
    marginTop: 12,
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
  categoriesScroll: {
    maxHeight: 50,
    marginTop: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  notesList: {
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
  noteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  noteName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: Colors.primary,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 8,
  },
  noteTimestamp: {
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 4,
    marginBottom: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalScroll: {
    flex: 1,
    marginTop: 100,
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
    minHeight: 150,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  optionTextActive: {
    color: 'white',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryOptionText: {
    fontSize: 12,
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
  pinSection: {
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectedImages: {
    marginBottom: 16,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStamps: {
    marginBottom: 16,
  },
  stampsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedStamp: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  selectedStampText: {
    fontSize: 24,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  stampOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampOptionText: {
    fontSize: 32,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageOption: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageOptionImg: {
    width: '100%',
    height: '100%',
  },
  unlockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    width: '80%',
    alignItems: 'center',
  },
  unlockTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  unlockSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: 24,
  },
  unlockInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 8,
  },
  unlockButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  unlockButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  unlockButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  unlockButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  unlockButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
});
