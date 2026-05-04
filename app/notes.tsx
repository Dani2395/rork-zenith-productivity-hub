import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Search, MoreVertical, Pin, Lock, Unlock,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  CheckSquare, Image as ImageIcon, Smile, X, Settings, Edit2,
  Trash2, Bell, Plus, Grid3x3,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { updateNotesWidget } from '@/widgets/widgetTaskHandler';
import DateTimePicker from '@/components/DateTimePicker';

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
  const { notes, addNote, updateNote, deleteNote, noteCategories, addNoteCategory, updateNoteCategory, deleteNoteCategory } = useData();
  const params = useLocalSearchParams<{ noteId?: string; action?: string }>();
  const handledParamRef = useRef<string | null>(null);

  // List state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteName, setNoteName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteLocked, setNoteLocked] = useState(false);
  const [notePinned, setNotePinned] = useState(false);
  const [noteCategory, setNoteCategory] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteStamps, setNoteStamps] = useState<string[]>([]);
  const [noteLockPin, setNoteLockPin] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteTime, setNoteTime] = useState('');
  const [editorSelection, setEditorSelection] = useState({ start: 0, end: 0 });
  const [showEditorMenu, setShowEditorMenu] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLockSection, setShowLockSection] = useState(false);

  // Unlock state
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockingNoteId, setUnlockingNoteId] = useState<number | null>(null);
  const [unlockPin, setUnlockPin] = useState('');

  // Category management
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const contentInputRef = useRef<TextInput>(null);

  const CATEGORIES = [
    { id: 0, value: '', label: 'All', type: 'note' as const },
    ...noteCategories,
  ];

  useEffect(() => {
    const paramKey = `${params.noteId ?? ''}-${params.action ?? ''}`;
    if (!paramKey || paramKey === '-' || handledParamRef.current === paramKey) return;
    if (params.action === 'new') {
      handledParamRef.current = paramKey;
      openNewNote();
    } else if (params.noteId) {
      const noteId = parseInt(params.noteId, 10);
      if (!isNaN(noteId) && notes.length > 0) {
        handledParamRef.current = paramKey;
        handleEditNote(noteId);
      }
    }
  }, [params.noteId, params.action, notes]);

  useEffect(() => {
    const sorted = [...notes].sort((a, b) =>
      (b.lastModified ?? b.date ?? '').localeCompare(a.lastModified ?? a.date ?? '')
    );
    const latest = sorted[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    updateNotesWidget({
      totalNotes: notes.length,
      pinnedCount: notes.filter(n => n.pinned).length,
      latestNoteTitle: latest?.name ?? '',
      latestNoteDate: latest?.date ?? '',
      recentNotes: sorted.map(n => ({
        id: n.id,
        title: n.name ?? 'Untitled',
        date: n.date ?? '',
        pinned: !!n.pinned,
        preview: n.text ? n.text.replace(/\n/g, ' ').slice(0, 120) : undefined,
      })),
      currentIndex: 0,
    });
  }, [notes]);

  useEffect(() => {
    if (!showEditor) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEditorBack();
      return true;
    });
    return () => handler.remove();
  }, [showEditor, noteName, noteText, editingNote]);

  const filteredNotes = notes
    .filter(note => {
      if (
        searchQuery &&
        !note.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.text.toLowerCase().includes(searchQuery.toLowerCase())
      ) return false;
      if (selectedCategory && note.category !== selectedCategory) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.lastModified ?? b.date ?? '').localeCompare(a.lastModified ?? a.date ?? '');
    });

  const resetEditor = () => {
    setNoteName('');
    setNoteText('');
    setNoteLocked(false);
    setNotePinned(false);
    setNoteCategory('');
    setNoteImages([]);
    setNoteStamps([]);
    setNoteLockPin('');
    setNoteDate('');
    setNoteTime('');
    setEditingNote(null);
    setShowLockSection(false);
    setShowDatePicker(false);
  };

  const openNewNote = () => {
    resetEditor();
    setShowEditor(true);
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
    setNoteDate(note.date || '');
    setNoteTime(note.time || '');
    setShowLockSection(note.locked);
    setShowEditor(true);
  };

  const handleEditNote = (noteId: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    if (note.locked && note.lockPin) {
      setUnlockingNoteId(noteId);
      setUnlockModalVisible(true);
    } else {
      openNoteForEdit(note);
    }
  };

  const saveNote = () => {
    if (!noteName.trim() && !noteText.trim()) return;
    if (noteLocked && noteLockPin && noteLockPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
      return;
    }
    const timestamp = new Date().toISOString();
    const name = noteName.trim() || noteText.trim().split('\n')[0].slice(0, 50) || 'Untitled';
    if (editingNote !== null) {
      updateNote(editingNote, {
        name,
        text: noteText.trim(),
        locked: noteLocked,
        pinned: notePinned,
        category: noteCategory,
        date: noteDate || new Date().toISOString().split('T')[0],
        time: noteTime || undefined,
        images: noteImages,
        stamps: noteStamps,
        lockPin: noteLocked ? noteLockPin : undefined,
        lastModified: timestamp,
      });
    } else {
      addNote({
        name,
        text: noteText.trim(),
        locked: noteLocked,
        pinned: notePinned,
        category: noteCategory,
        date: noteDate || new Date().toISOString().split('T')[0],
        time: noteTime || undefined,
        images: noteImages,
        stamps: noteStamps,
        lockPin: noteLocked ? noteLockPin : undefined,
        createdDate: timestamp,
        lastModified: timestamp,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditorBack = () => {
    if (!noteName.trim() && !noteText.trim()) {
      if (editingNote !== null) deleteNote(editingNote);
      setShowEditor(false);
      resetEditor();
      return;
    }
    saveNote();
    setShowEditor(false);
    resetEditor();
  };

  const handleDeleteNote = (id: number) => {
    Alert.alert('Delete Note', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(id);
          if (showEditor) { setShowEditor(false); resetEditor(); }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const applyFormat = (prefix: string, suffix?: string) => {
    const s = editorSelection.start;
    const e = editorSelection.end;
    const sfx = suffix ?? prefix;
    let newText: string;
    if (s !== e) {
      newText = noteText.slice(0, s) + prefix + noteText.slice(s, e) + sfx + noteText.slice(e);
    } else {
      newText = noteText.slice(0, s) + prefix + sfx + noteText.slice(s);
    }
    setNoteText(newText);
  };

  const insertLinePrefix = (prefix: string) => {
    const s = editorSelection.start;
    const before = noteText.slice(0, s);
    const lineStart = before.lastIndexOf('\n') + 1;
    setNoteText(noteText.slice(0, lineStart) + prefix + noteText.slice(lineStart));
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

  const handleSaveCategory = () => {
    if (!newCategoryValue.trim() || !newCategoryLabel.trim()) {
      Alert.alert('Missing Information', 'Please enter both value and label');
      return;
    }
    if (editingCategoryId !== null) {
      updateNoteCategory(editingCategoryId, { value: newCategoryValue.trim(), label: newCategoryLabel.trim() });
    } else {
      addNoteCategory(newCategoryValue.trim(), newCategoryLabel.trim());
    }
    setNewCategoryValue('');
    setNewCategoryLabel('');
    setEditingCategoryId(null);
    setCategoryModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (note: typeof notes[0]) => {
    const d = note.lastModified ?? note.date ?? '';
    if (!d) return '';
    try {
      const date = new Date(d);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === today.toDateString())
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return d.slice(0, 10);
    }
  };

  // ── EDITOR ──────────────────────────────────────────────────────────────────
  if (showEditor) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Editor header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity style={styles.editorBackBtn} onPress={handleEditorBack}>
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.editorHeaderBtn, notePinned && styles.editorHeaderBtnActive]}
              onPress={() => { setNotePinned(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Pin size={20} color={notePinned ? Colors.primary : Colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editorHeaderBtn} onPress={() => setShowEditorMenu(true)}>
              <MoreVertical size={20} color={Colors.textDim} />
            </TouchableOpacity>
          </View>

          {/* Editor body */}
          <ScrollView
            style={styles.editorScroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editorScrollContent}
          >
            <TextInput
              style={styles.editorTitle}
              placeholder="Title"
              placeholderTextColor={Colors.textDim}
              value={noteName}
              onChangeText={setNoteName}
              returnKeyType="next"
              onSubmitEditing={() => contentInputRef.current?.focus()}
            />

            {noteImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {noteImages.map((img, idx) => (
                    <View key={idx} style={{ position: 'relative' }}>
                      <Image source={{ uri: img }} style={styles.editorImage} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => setNoteImages(noteImages.filter((_, i) => i !== idx))}
                      >
                        <X size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {noteStamps.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {noteStamps.map((stamp, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setNoteStamps(noteStamps.filter((_, i) => i !== idx))}
                  >
                    <Text style={{ fontSize: 28 }}>{stamp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              ref={contentInputRef}
              style={styles.editorContent}
              placeholder="Start writing..."
              placeholderTextColor={Colors.textDim}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              textAlignVertical="top"
              onSelectionChange={e => setEditorSelection(e.nativeEvent.selection)}
            />

            {showDatePicker && (
              <View style={{ marginTop: 16 }}>
                <DateTimePicker
                  label="Reminder"
                  date={noteDate}
                  time={noteTime}
                  onDateChange={setNoteDate}
                  onTimeChange={setNoteTime}
                />
              </View>
            )}

            {showLockSection && (
              <View style={styles.lockSection}>
                <Text style={styles.lockLabel}>Note PIN (4 digits)</Text>
                <TextInput
                  style={styles.lockInput}
                  placeholder="••••"
                  placeholderTextColor={Colors.textDim}
                  value={noteLockPin}
                  onChangeText={text => { if (/^\d{0,4}$/.test(text)) setNoteLockPin(text); }}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            )}
          </ScrollView>

          {/* Formatting toolbar */}
          <View style={styles.formatBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formatBarContent}
            >
              <TouchableOpacity style={styles.formatBtn} onPress={() => applyFormat('**')}>
                <Bold size={18} color={Colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => applyFormat('*')}>
                <Italic size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => applyFormat('__')}>
                <Underline size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => applyFormat('~~')}>
                <Strikethrough size={18} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.formatDivider} />
              <TouchableOpacity style={styles.formatBtn} onPress={() => insertLinePrefix('- ')}>
                <List size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => insertLinePrefix('1. ')}>
                <ListOrdered size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => insertLinePrefix('- [ ] ')}>
                <CheckSquare size={18} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.formatDivider} />
              <TouchableOpacity style={styles.formatBtn} onPress={() => setShowImagePicker(true)}>
                <ImageIcon size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtn} onPress={() => setShowStampPicker(true)}>
                <Smile size={18} color={Colors.text} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Editor more menu */}
        <Modal visible={showEditorMenu} transparent animationType="fade" onRequestClose={() => setShowEditorMenu(false)}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowEditorMenu(false)}>
            <View style={styles.menuContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setShowDatePicker(v => !v); setShowEditorMenu(false); }}
              >
                <Bell size={18} color={Colors.text} />
                <Text style={styles.menuItemText}>Set Reminder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  const next = !noteLocked;
                  setNoteLocked(next);
                  setShowLockSection(next);
                  setShowEditorMenu(false);
                }}
              >
                {noteLocked
                  ? <Unlock size={18} color={Colors.text} />
                  : <Lock size={18} color={Colors.text} />}
                <Text style={styles.menuItemText}>{noteLocked ? 'Remove Lock' : 'Lock Note'}</Text>
              </TouchableOpacity>

              {noteCategories.length > 0 && (
                <>
                  <View style={styles.menuDivider} />
                  <Text style={styles.menuSectionLabel}>Category</Text>
                  {[{ id: -1, value: '', label: 'None', type: 'note' as const }, ...noteCategories].map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.menuItem, noteCategory === cat.value && styles.menuItemActive]}
                      onPress={() => { setNoteCategory(cat.value); setShowEditorMenu(false); }}
                    >
                      <Text style={[styles.menuItemText, noteCategory === cat.value && { color: Colors.primary }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowEditorMenu(false);
                  if (editingNote !== null) handleDeleteNote(editingNote);
                  else { setShowEditor(false); resetEditor(); }
                }}
              >
                <Trash2 size={18} color={Colors.danger} />
                <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete Note</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Stamp picker */}
        <Modal visible={showStampPicker} transparent animationType="fade" onRequestClose={() => setShowStampPicker(false)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowStampPicker(false)}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Stickers</Text>
              <View style={styles.stampsGrid}>
                {STAMPS.map((stamp, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.stampOption}
                    onPress={() => { setNoteStamps([...noteStamps, stamp]); setShowStampPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={{ fontSize: 32 }}>{stamp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Image picker */}
        <Modal visible={showImagePicker} transparent animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowImagePicker(false)}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Choose Image</Text>
              <View style={styles.imagesGrid}>
                {IMAGE_URLS.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.imageOption}
                    onPress={() => { setNoteImages([...noteImages, url]); setShowImagePicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Image source={{ uri: url }} style={styles.imageOptionImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── NOTE LIST ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchBarInline}>
            <Search size={16} color={Colors.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes..."
              placeholderTextColor={Colors.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={18} color={Colors.textDim} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.listTitle}>Notes</Text>
            {notes.length > 0 && (
              <Text style={styles.listCount}>{notes.length}</Text>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(true)}>
              <Search size={20} color={Colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
            >
              <Grid3x3 size={20} color={Colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMoreOptions(true)}>
              <MoreVertical size={20} color={Colors.textDim} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.value && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.value)}
            onLongPress={() => {
              if (cat.id === 0) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Category', cat.label, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Edit',
                  onPress: () => {
                    const c = noteCategories.find(x => x.id === cat.id);
                    if (c) { setEditingCategoryId(c.id); setNewCategoryValue(c.value); setNewCategoryLabel(c.label); }
                    setCategoryModalVisible(true);
                  },
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteNoteCategory(cat.id),
                },
              ]);
            }}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat.value && styles.categoryChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.categoryChipAdd}
          onPress={() => { setEditingCategoryId(null); setNewCategoryValue(''); setNewCategoryLabel(''); setCategoryModalVisible(true); }}
        >
          <Plus size={14} color={Colors.textDim} />
        </TouchableOpacity>
      </ScrollView>

      {/* Notes list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, viewMode === 'grid' && styles.gridContent]}
      >
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first note</Text>
          </View>
        ) : (
          filteredNotes.map(note => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteCard, viewMode === 'grid' && styles.noteCardGrid]}
              onPress={() => handleEditNote(note.id)}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(note.name || 'Note', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: note.pinned ? 'Unpin' : 'Pin',
                    onPress: () => updateNote(note.id, { pinned: !note.pinned, lastModified: new Date().toISOString() }),
                  },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDeleteNote(note.id) },
                ]);
              }}
              activeOpacity={0.7}
            >
              {note.images && note.images.length > 0 && (
                <Image source={{ uri: note.images[0] }} style={styles.noteCardImage} />
              )}
              <View style={styles.noteCardTitleRow}>
                <Text style={styles.noteCardTitle} numberOfLines={1}>
                  {note.name || 'Untitled'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {note.pinned && <Pin size={13} color={Colors.primary} />}
                  {note.locked && <Lock size={13} color={Colors.warning} />}
                </View>
              </View>
              <Text style={styles.noteCardPreview} numberOfLines={viewMode === 'grid' ? 4 : 2}>
                {note.locked ? '🔒 Locked note' : (note.text || '')}
              </Text>
              <View style={styles.noteCardFooter}>
                {note.category ? (
                  <Text style={styles.noteCardCategory}>{note.category}</Text>
                ) : (
                  <View />
                )}
                <Text style={styles.noteCardDate}>{formatDate(note)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openNewNote} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.fabGradient}>
          <Plus size={26} color="white" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* More options menu */}
      <Modal visible={showMoreOptions} transparent animationType="fade" onRequestClose={() => setShowMoreOptions(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreOptions(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreOptions(false);
                setEditingCategoryId(null);
                setNewCategoryValue('');
                setNewCategoryLabel('');
                setCategoryModalVisible(true);
              }}
            >
              <Settings size={18} color={Colors.text} />
              <Text style={styles.menuItemText}>Manage Categories</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unlock modal */}
      <Modal
        visible={unlockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setUnlockModalVisible(false); setUnlockPin(''); setUnlockingNoteId(null); }}
      >
        <View style={styles.overlayCenter}>
          <View style={styles.unlockCard}>
            <Lock size={40} color={Colors.primary} />
            <Text style={styles.unlockTitle}>Enter PIN</Text>
            <TextInput
              style={styles.unlockInput}
              placeholder="••••"
              placeholderTextColor={Colors.textDim}
              value={unlockPin}
              onChangeText={text => { if (/^\d{0,4}$/.test(text)) setUnlockPin(text); }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
            />
            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setUnlockModalVisible(false); setUnlockPin(''); setUnlockingNoteId(null); }}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleUnlock}>
                <Text style={styles.btnPrimaryText}>Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setCategoryModalVisible(false); setEditingCategoryId(null); setNewCategoryValue(''); setNewCategoryLabel(''); }}
      >
        <View style={styles.overlayCenter}>
          <View style={[styles.unlockCard, { width: '90%' }]}>
            <Text style={styles.unlockTitle}>{editingCategoryId ? 'Edit Category' : 'New Category'}</Text>
            <TextInput
              style={styles.categoryInput}
              placeholder="Value (e.g., Study)"
              placeholderTextColor={Colors.textDim}
              value={newCategoryValue}
              onChangeText={setNewCategoryValue}
            />
            <TextInput
              style={styles.categoryInput}
              placeholder="Label (e.g., 📚 Study)"
              placeholderTextColor={Colors.textDim}
              value={newCategoryLabel}
              onChangeText={setNewCategoryLabel}
            />
            {!editingCategoryId && noteCategories.length > 0 && (
              <ScrollView style={{ width: '100%', maxHeight: 160, marginBottom: 12 }}>
                {noteCategories.map(cat => (
                  <View key={cat.id} style={styles.existingCatRow}>
                    <Text style={styles.existingCatText}>{cat.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCategoryId(cat.id);
                          setNewCategoryValue(cat.value);
                          setNewCategoryLabel(cat.label);
                        }}
                      >
                        <Edit2 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteNoteCategory(cat.id)}>
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setCategoryModalVisible(false); setEditingCategoryId(null); setNewCategoryValue(''); setNewCategoryLabel(''); }}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              {(newCategoryValue.trim() || newCategoryLabel.trim()) && (
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveCategory}>
                  <Text style={styles.btnPrimaryText}>{editingCategoryId ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // List header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: { fontSize: 28, fontWeight: '700', color: Colors.text },
  listCount: {
    fontSize: 13,
    color: Colors.textDim,
    marginLeft: 8,
    marginTop: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchBarInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },

  // Category chips
  categoryScroll: { maxHeight: 44 },
  categoryScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },
  categoryChipTextActive: { color: 'white', fontWeight: '600' },
  categoryChipAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Note list
  list: { flex: 1, marginTop: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  gridContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  noteCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteCardGrid: { width: '48.5%', marginBottom: 0 },
  noteCardImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  noteCardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  noteCardPreview: { fontSize: 13, color: Colors.textDim, lineHeight: 19, marginBottom: 10 },
  noteCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteCardCategory: {
    fontSize: 11,
    color: Colors.primary,
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  noteCardDate: { fontSize: 11, color: Colors.textDim },

  // Empty state
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.textDim },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Editor
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editorBackBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  editorHeaderBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  editorHeaderBtnActive: { backgroundColor: Colors.primary + '22' },
  editorScroll: { flex: 1 },
  editorScrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 },
  editorTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    paddingVertical: 2,
  },
  editorContent: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    minHeight: 300,
  },
  editorImage: { width: 130, height: 100, borderRadius: 10 },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockSection: {
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockLabel: { fontSize: 13, color: Colors.textDim, marginBottom: 8, fontWeight: '600' },
  lockInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    color: Colors.text,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 10,
  },

  // Formatting toolbar
  formatBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  formatBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
    alignItems: 'center',
  },
  formatBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  formatDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },

  // Dropdown menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menuContent: {
    position: 'absolute',
    top: 56,
    right: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 210,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemActive: { backgroundColor: Colors.primary + '18' },
  menuItemText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  menuSectionLabel: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Pickers
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '88%',
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  stampOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageOption: { width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
  imageOptionImg: { width: '100%', height: '100%' },

  // Overlays / modals
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    width: '80%',
    alignItems: 'center',
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 20,
  },
  unlockInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 20,
  },
  rowButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '600', color: 'white' },

  // Category modal
  categoryInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 10,
  },
  existingCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  existingCatText: { fontSize: 13, color: Colors.text, flex: 1 },
});
