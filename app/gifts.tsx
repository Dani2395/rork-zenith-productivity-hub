import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash2, ChevronRight, Check, ExternalLink, Lock, Unlock, Image as ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

const TAG_EMOJIS: Record<string, string> = {
  family: '👨‍👩‍👧',
  friend: '👥',
  coworker: '💼',
  other: '✨',
};

const EVENTS = [
  '🎂 Birthday',
  '🎄 Christmas',
  '💝 Valentine\'s Day',
  '👔 Father\'s Day',
  '💐 Mother\'s Day',
  '🎓 Graduation',
  '💍 Anniversary',
  '🎉 Other',
];

export default function GiftsScreen() {
  const { giftPeople, addGiftPerson, addGiftItem, deleteGiftPerson, updateGiftItem } = useData();

  useEffect(() => {
    loadLockState();
  }, []);

  const loadLockState = async () => {
    try {
      const [locked, pin, setup] = await Promise.all([
        AsyncStorage.getItem('giftsLocked'),
        AsyncStorage.getItem('giftsPin'),
        AsyncStorage.getItem('giftsPinSetup'),
      ]);
      
      if (locked !== null) setIsLocked(locked === 'true');
      if (pin !== null) setStoredPin(pin);
      if (setup !== null) setIsPinSetup(setup === 'true');
    } catch (error) {
      console.log('Error loading lock state:', error);
    }
  };

  const saveLockState = async (locked: boolean) => {
    try {
      await AsyncStorage.setItem('giftsLocked', locked.toString());
    } catch (error) {
      console.log('Error saving lock state:', error);
    }
  };

  const savePinState = async (pin: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('giftsPin', pin),
        AsyncStorage.setItem('giftsPinSetup', 'true'),
      ]);
    } catch (error) {
      console.log('Error saving pin:', error);
    }
  };
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [expandedPersons, setExpandedPersons] = useState<Set<number>>(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [storedPin, setStoredPin] = useState('1234');
  const [isPinSetup, setIsPinSetup] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);

  const [personName, setPersonName] = useState('');
  const [personTag, setPersonTag] = useState<'family' | 'friend' | 'coworker' | 'other'>('family');

  const [giftName, setGiftName] = useState('');
  const [giftNotes, setGiftNotes] = useState('');
  const [giftEvent, setGiftEvent] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftLink, setGiftLink] = useState('');
  const [giftImage, setGiftImage] = useState('');

  const resetPersonForm = () => {
    setPersonName('');
    setPersonTag('family');
  };

  const resetGiftForm = () => {
    setGiftName('');
    setGiftNotes('');
    setGiftEvent('');
    setGiftPrice('');
    setGiftLink('');
    setGiftImage('');
  };

  const pickGiftImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setGiftImage(result.assets[0].uri);
    }
  };

  const handleSavePerson = () => {
    if (!personName.trim()) return;

    addGiftPerson(personName.trim(), personTag);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetPersonForm();
    setPersonModalVisible(false);
  };

  const handleSaveGift = () => {
    if (!giftName.trim() || !selectedPersonId) return;

    addGiftItem(selectedPersonId, {
      name: giftName.trim(),
      notes: giftNotes,
      event: giftEvent,
      price: giftPrice,
      link: giftLink,
      image: giftImage,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetGiftForm();
    setGiftModalVisible(false);
  };

  const toggleExpanded = (personId: number) => {
    setExpandedPersons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  const openGiftModal = (personId: number) => {
    setSelectedPersonId(personId);
    resetGiftForm();
    setGiftModalVisible(true);
  };

  const handleUnlock = async () => {
    if (lockPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
      return;
    }
    
    console.log('Attempting unlock. Entered PIN:', lockPin, 'Stored PIN:', storedPin);
    
    if (lockPin === storedPin) {
      console.log('PIN match! Unlocking...');
      await saveLockState(false);
      setIsLocked(false);
      setLockModalVisible(false);
      setLockPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      console.log('PIN mismatch!');
      Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLockPin('');
    }
  };

  const handleSetPin = async () => {
    if (lockPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter exactly 4 digits');
      return;
    }
    
    console.log('Setting new PIN:', lockPin);
    await savePinState(lockPin);
    setStoredPin(lockPin);
    setIsPinSetup(true);
    await saveLockState(false);
    setIsLocked(false);
    setIsSettingPin(false);
    setLockModalVisible(false);
    setLockPin('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'PIN has been set successfully!');
  };

  const toggleLock = async () => {
    if (isLocked) {
      setIsSettingPin(false);
      setLockModalVisible(true);
    } else {
      if (!isPinSetup) {
        setIsSettingPin(true);
        setLockModalVisible(true);
      } else {
        setIsLocked(true);
        await saveLockState(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Gift Ideas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={toggleLock}
          >
            {isLocked ? (
              <Lock size={22} color={Colors.text} />
            ) : (
              <Unlock size={22} color={Colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetPersonForm();
              setPersonModalVisible(true);
            }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.addButtonGradient}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Add Person</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {isLocked ? (
        <View style={styles.lockedContainer}>
          <Lock size={64} color={Colors.textDim} />
          <Text style={styles.lockedTitle}>Gifts Page is Locked</Text>
          <Text style={styles.lockedText}>Tap the lock icon to unlock</Text>
        </View>
      ) : (
        <ScrollView style={styles.peopleList} showsVerticalScrollIndicator={false}>
          {giftPeople.length === 0 ? (
            <Text style={styles.emptyText}>No people added yet</Text>
          ) : (
            <>
            {giftPeople.map(person => {
            const isExpanded = expandedPersons.has(person.id);

            return (
              <View key={person.id} style={styles.personCard}>
                <TouchableOpacity
                  style={styles.personHeader}
                  onPress={() => toggleExpanded(person.id)}
                >
                  <View style={styles.personInfo}>
                    <ChevronRight
                      size={20}
                      color={Colors.textDim}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                    <Text style={styles.personName}>
                      {TAG_EMOJIS[person.tag]} {person.name}
                    </Text>
                    <View style={styles.giftCountBadge}>
                      <Text style={styles.giftCountText}>
                        {person.gifts.length} {person.gifts.length === 1 ? 'gift' : 'gifts'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.personActions}>
                    <TouchableOpacity
                      style={styles.addGiftButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openGiftModal(person.id);
                      }}
                    >
                      <Plus size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deletePersonButton}
                      onPress={() => {
                        deleteGiftPerson(person.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                    >
                      <Trash2 size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.giftsContainer}>
                    {person.gifts.length === 0 ? (
                      <Text style={styles.noGiftsText}>No gift ideas yet</Text>
                    ) : (
                      person.gifts.map(gift => (
                        <View key={gift.id} style={styles.giftCard}>
                          {gift.image && (
                            <Image source={{ uri: gift.image }} style={styles.giftImage} />
                          )}
                          <View style={styles.giftInfo}>
                            <Text style={styles.giftName}>{gift.name}</Text>
                            {gift.event && (
                              <Text style={styles.giftEvent}>{gift.event}</Text>
                            )}
                            {gift.price && (
                              <Text style={styles.giftPrice}>{gift.price}</Text>
                            )}
                            {gift.notes && (
                              <Text style={styles.giftNotes}>{gift.notes}</Text>
                            )}
                          </View>
                          <View style={styles.giftActions}>
                            {gift.link && (
                              <TouchableOpacity style={styles.linkButton}>
                                <ExternalLink size={16} color={Colors.primary} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              style={[
                                styles.purchasedButton,
                                gift.purchased && styles.purchasedButtonActive,
                              ]}
                              onPress={() => {
                                updateGiftItem(person.id, gift.id, { purchased: !gift.purchased });
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }}
                            >
                              <Check size={16} color={gift.purchased ? 'white' : Colors.success} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={personModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPersonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Person</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Person's name *"
              placeholderTextColor={Colors.textDim}
              value={personName}
              onChangeText={setPersonName}
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.tagButtons}>
              {(['family', 'friend', 'coworker', 'other'] as const).map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    personTag === tag && styles.tagButtonActive,
                  ]}
                  onPress={() => setPersonTag(tag)}
                >
                  <Text style={styles.tagEmoji}>{TAG_EMOJIS[tag]}</Text>
                  <Text style={[
                    styles.tagText,
                    personTag === tag && styles.tagTextActive,
                  ]}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setPersonModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSavePerson}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Add Person</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={giftModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Gift Idea</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Gift idea *"
                placeholderTextColor={Colors.textDim}
                value={giftName}
                onChangeText={setGiftName}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textDim}
                value={giftNotes}
                onChangeText={setGiftNotes}
                multiline
              />

              <Text style={styles.inputLabel}>Event</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.eventButtons}>
                  {EVENTS.map(event => (
                    <TouchableOpacity
                      key={event}
                      style={[
                        styles.eventButton,
                        giftEvent === event && styles.eventButtonActive,
                      ]}
                      onPress={() => setGiftEvent(event)}
                    >
                      <Text style={styles.eventText}>{event}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput
                style={styles.modalInput}
                placeholder="Price (optional)"
                placeholderTextColor={Colors.textDim}
                value={giftPrice}
                onChangeText={setGiftPrice}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Link (optional)"
                placeholderTextColor={Colors.textDim}
                value={giftLink}
                onChangeText={setGiftLink}
              />

              <Text style={styles.inputLabel}>Gift Image</Text>
              <View style={styles.imagePickerContainer}>
                {giftImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: giftImage }} style={styles.giftImagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setGiftImage('')}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={pickGiftImage}>
                    <ImageIcon size={24} color={Colors.textDim} />
                    <Text style={styles.imagePickerText}>Pick Gift Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setGiftModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveGift}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Save Gift</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={lockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setLockModalVisible(false);
          setLockPin('');
          setIsSettingPin(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isSettingPin ? 'Set PIN' : 'Enter PIN'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isSettingPin ? 'Create a 4-digit PIN' : 'Enter your 4-digit PIN'}
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="Enter PIN"
              placeholderTextColor={Colors.textDim}
              value={lockPin}
              onChangeText={setLockPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setLockModalVisible(false);
                  setLockPin('');
                  setIsSettingPin(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={isSettingPin ? handleSetPin : handleUnlock}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>
                    {isSettingPin ? 'Set PIN' : 'Unlock'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {!isSettingPin && (
              <TouchableOpacity
                style={styles.setPinButton}
                onPress={() => {
                  setIsSettingPin(true);
                  setLockPin('');
                }}
              >
                <Text style={styles.setPinButtonText}>Change PIN</Text>
              </TouchableOpacity>
            )}
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
  peopleList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    marginTop: 40,
    fontSize: 14,
  },
  personCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  giftCountBadge: {
    backgroundColor: Colors.glass,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  giftCountText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  personActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addGiftButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePersonButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noGiftsText: {
    fontSize: 13,
    color: Colors.textDim,
    fontStyle: 'italic',
  },
  giftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 12,
  },
  giftImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  giftEvent: {
    fontSize: 12,
    color: Colors.secondary,
    marginBottom: 4,
  },
  giftPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  giftNotes: {
    fontSize: 13,
    color: Colors.textDim,
  },
  giftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  linkButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedButtonActive: {
    backgroundColor: Colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textDim,
  },
  tagTextActive: {
    color: 'white',
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  eventButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  eventText: {
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
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: 20,
    textAlign: 'center',
  },
  setPinButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  setPinButtonText: {
    fontSize: 13,
    color: Colors.primary,
  },
  imagePickerContainer: {
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
  giftImagePreview: {
    width: 120,
    height: 120,
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
});
