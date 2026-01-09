import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Star, Pencil, Trash2, BookOpen, Quote, Image as ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import type { Book } from '@/types';

export default function BooksScreen() {
  const { books, addBook, updateBook, deleteBook } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookStatus, setBookStatus] = useState<'reading' | 'finished' | 'want'>('reading');
  const [bookPages, setBookPages] = useState('');
  const [bookCurrentPage, setBookCurrentPage] = useState('');
  const [bookRating, setBookRating] = useState(0);
  const [bookThoughts, setBookThoughts] = useState('');
  const [bookQuotes, setBookQuotes] = useState('');
  const [bookCover, setBookCover] = useState('');
  const [bookSpineColor, setBookSpineColor] = useState('#8B4513');

  const resetForm = () => {
    setBookTitle('');
    setBookAuthor('');
    setBookStatus('reading');
    setBookPages('');
    setBookCurrentPage('');
    setBookRating(0);
    setBookThoughts('');
    setBookQuotes('');
    setBookCover('');
    setBookSpineColor('#8B4513');
    setEditingBook(null);
  };

  const loadBookForEdit = (book: Book) => {
    setEditingBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookStatus(book.status);
    setBookPages(book.totalPages.toString());
    setBookCurrentPage(book.currentPage.toString());
    setBookRating(book.rating);
    setBookThoughts(book.thoughts || '');
    setBookQuotes(book.quotes || '');
    setBookCover(book.cover || '');
    setBookSpineColor(book.spineColor || '#8B4513');
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBookCover(result.assets[0].uri);
    }
  };

  const handleSaveBook = () => {
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    if (editingBook) {
      updateBook(editingBook.id, {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        status: bookStatus,
        totalPages: parseInt(bookPages) || 0,
        currentPage: parseInt(bookCurrentPage) || 0,
        thoughts: bookThoughts.trim(),
        quotes: bookQuotes.trim(),
        rating: bookRating,
        cover: bookCover.trim(),
        spineColor: bookSpineColor,
      });
    } else {
      addBook({
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        status: bookStatus,
        totalPages: parseInt(bookPages) || 0,
        currentPage: parseInt(bookCurrentPage) || 0,
        thoughts: bookThoughts.trim(),
        quotes: bookQuotes.trim(),
        rating: bookRating,
        cover: bookCover.trim(),
        spineColor: bookSpineColor,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setModalVisible(false);
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBook(book.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');
  const wantToRead = books.filter(b => b.status === 'want');

  const readingGoal = 24;
  const booksRead = finishedBooks.length;
  const goalPercent = Math.min(100, (booksRead / readingGoal) * 100);

  const renderStars = (rating: number, onPress?: (r: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(r => (
        <TouchableOpacity
          key={r}
          onPress={() => onPress?.(r)}
          disabled={!onPress}
        >
          <Star
            size={onPress ? 28 : 16}
            color={r <= rating ? '#fbbf24' : Colors.textDim}
            fill={r <= rating ? '#fbbf24' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const bookSpineColors = [
    '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460',
    '#D2691E', '#B8860B', '#DAA520', '#6B4423', '#8B7355',
    '#BC8F8F', '#CD5C5C', '#8B4789', '#9370DB', '#8B668B',
    '#4682B4', '#5F9EA0', '#6495ED', '#4169E1', '#191970',
    '#DC143C', '#FF6347', '#FF4500', '#FF8C00', '#FFD700',
    '#32CD32', '#00CED1', '#1E90FF', '#9400D3', '#FF1493',
  ];

  const getBookSpineColor = (book: Book) => {
    return book.spineColor || bookSpineColors[book.id % bookSpineColors.length];
  };

  const renderBookSpine = (book: typeof books[0]) => {
    return (
      <TouchableOpacity
        key={book.id}
        style={[styles.bookSpine, { backgroundColor: getBookSpineColor(book) }]}
        onPress={() => loadBookForEdit(book)}
        activeOpacity={0.7}
      >
        <Text style={styles.bookSpineTitle} numberOfLines={3}>
          {book.title}
        </Text>
        <View style={styles.bookSpineAuthor}>
          <Text style={styles.bookSpineAuthorText} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
        {book.rating > 0 && (
          <View style={styles.bookSpineRating}>
            {[...Array(book.rating)].map((_, i) => (
              <Text key={i} style={styles.bookSpineStar}>⭐</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBookshelf = (books: typeof finishedBooks) => {
    const booksPerShelf = 5;
    const shelves = [];

    for (let i = 0; i < books.length; i += booksPerShelf) {
      const shelfBooks = books.slice(i, i + booksPerShelf);
      shelves.push(
        <View key={i} style={styles.shelf}>
          <View style={styles.shelfBooks}>
            {shelfBooks.map(book => renderBookSpine(book))}
          </View>
          <View style={styles.shelfWood} />
        </View>
      );
    }

    return shelves;
  };

  const renderBookCard = (book: typeof books[0], showProgress = false) => {
    const progress = book.totalPages > 0 
      ? Math.round((book.currentPage / book.totalPages) * 100) 
      : 0;

    return (
      <TouchableOpacity 
        key={book.id} 
        style={styles.bookCard}
        onPress={() => loadBookForEdit(book)}
        activeOpacity={0.7}
      >
        <View style={styles.bookCardContent}>
          {book.cover ? (
            <Image 
              source={{ uri: book.cover }} 
              style={styles.bookCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookCoverPlaceholder}>
              <BookOpen size={32} color={Colors.textDim} />
            </View>
          )}
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>by {book.author}</Text>
            {book.rating > 0 && renderStars(book.rating)}
            
            {showProgress && book.totalPages > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Page {book.currentPage} of {book.totalPages} ({progress}%)
                </Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            )}

            {book.quotes && book.quotes.trim() && (
              <View style={styles.quotePreview}>
                <Quote size={12} color={Colors.textDim} />
                <Text style={styles.quoteText} numberOfLines={2}>
                  {book.quotes.split('\n')[0]}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bookActions}>
          {showProgress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                Alert.prompt(
                  'Update Page',
                  `Current: ${book.currentPage} / ${book.totalPages}`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Update',
                      onPress: (text?: string) => {
                        const page = parseInt(text || '0');
                        if (!isNaN(page)) {
                          updateBook(book.id, { 
                            currentPage: page,
                            status: page >= book.totalPages ? 'finished' : 'reading'
                          });
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                      },
                    },
                  ],
                  'plain-text',
                  book.currentPage.toString()
                );
              }}
            >
              <Pencil size={16} color={Colors.text} />
              <Text style={styles.actionButtonText}>Update</Text>
            </TouchableOpacity>
          )}

          {book.status === 'want' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={(e) => {
                e.stopPropagation();
                updateBook(book.id, { status: 'reading', currentPage: 0 });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <BookOpen size={16} color="white" />
              <Text style={styles.primaryActionButtonText}>Start</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteBook(book);
            }}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 My Books</Text>
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
            <Text style={styles.addButtonText}>Add Book</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>🎯 2026 Reading Goal</Text>
        <Text style={styles.goalText}>{booksRead} of {readingGoal} books read</Text>
        <View style={styles.goalBar}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={[styles.goalFill, { width: `${goalPercent}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 Currently Reading</Text>
          {readingBooks.length === 0 ? (
            <Text style={styles.emptyText}>No books currently reading</Text>
          ) : (
            readingBooks.map(book => renderBookCard(book, true))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 My Library</Text>
          <Text style={styles.sectionSubtitle}>Finished Books Collection</Text>
          {finishedBooks.length === 0 ? (
            <View style={styles.emptyLibrary}>
              <Text style={styles.emptyLibraryEmoji}>📖</Text>
              <Text style={styles.emptyText}>Your bookshelf is empty</Text>
              <Text style={styles.emptySubtext}>Finish reading books to see them here!</Text>
            </View>
          ) : (
            <View style={styles.bookshelfContainer}>
              {renderBookshelf(finishedBooks)}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Want to Read</Text>
          {wantToRead.length === 0 ? (
            <Text style={styles.emptyText}>No books in wishlist</Text>
          ) : (
            wantToRead.map(book => renderBookCard(book))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              style={styles.modalScroll} 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBook ? 'Edit Book' : 'Add Book'}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Book title *"
                placeholderTextColor={Colors.textDim}
                value={bookTitle}
                onChangeText={setBookTitle}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Author *"
                placeholderTextColor={Colors.textDim}
                value={bookAuthor}
                onChangeText={setBookAuthor}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {(['reading', 'finished', 'want'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      bookStatus === status && styles.statusButtonActive,
                    ]}
                    onPress={() => setBookStatus(status)}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      bookStatus === status && styles.statusButtonTextActive,
                    ]}>
                      {status === 'reading' ? 'Reading' : status === 'finished' ? 'Finished' : 'Want to Read'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Rating</Text>
              {renderStars(bookRating, setBookRating)}

              <TextInput
                style={styles.modalInput}
                placeholder="Total pages"
                placeholderTextColor={Colors.textDim}
                value={bookPages}
                onChangeText={setBookPages}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Current page (if reading)"
                placeholderTextColor={Colors.textDim}
                value={bookCurrentPage}
                onChangeText={setBookCurrentPage}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Cover image URL (optional)"
                placeholderTextColor={Colors.textDim}
                value={bookCover}
                onChangeText={setBookCover}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <ImageIcon size={20} color={Colors.primary} />
                <Text style={styles.imagePickerButtonText}>Pick Image from Device</Text>
              </TouchableOpacity>

              {bookCover && (
                <View style={styles.coverPreview}>
                  <Image source={{ uri: bookCover }} style={styles.coverPreviewImage} />
                </View>
              )}

              <Text style={styles.inputLabel}>Book Spine Color 📚</Text>
              <Text style={styles.inputSubLabel}>Pick a color for your book spine on the shelf</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerScroll}>
                <View style={styles.colorPickerContainer}>
                  {bookSpineColors.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        bookSpineColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        setBookSpineColor(color);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      {bookSpineColor === color && (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Your thoughts (optional)"
                placeholderTextColor={Colors.textDim}
                value={bookThoughts}
                onChangeText={setBookThoughts}
                multiline
                numberOfLines={4}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Favorite quotes (optional)&#10;Separate multiple quotes with line breaks"
                placeholderTextColor={Colors.textDim}
                value={bookQuotes}
                onChangeText={setBookQuotes}
                multiline
                numberOfLines={4}
              />

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
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveBook}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>
                      {editingBook ? 'Update Book' : 'Save Book'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  goalCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: 12,
  },
  goalBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  bookList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    paddingVertical: 20,
    fontSize: 14,
  },
  bookCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  bookCoverPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookInfo: {
    flex: 1,
  },
  bookActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryActionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'white',
  },
  deleteActionButton: {
    flex: 0,
    paddingHorizontal: 12,
  },
  quotePreview: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quoteText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic' as const,
    color: Colors.textDim,
    lineHeight: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: Colors.textDim,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    marginTop: 60,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 8,
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
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  statusButtonTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  coverPreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  coverPreviewImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textDim,
    marginBottom: 16,
    fontStyle: 'italic' as const,
  },
  emptyLibrary: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLibraryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 4,
  },
  bookshelfContainer: {
    backgroundColor: '#2a1810',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 3,
    borderColor: '#5d4037',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shelf: {
    marginBottom: 32,
  },
  shelfBooks: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  shelfWood: {
    height: 16,
    backgroundColor: '#5d4037',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 2,
    borderTopColor: '#8B4513',
    borderBottomWidth: 3,
    borderBottomColor: '#3e2723',
  },
  bookSpine: {
    width: 65,
    height: 190,
    borderRadius: 6,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    borderRightWidth: 3,
    borderRightColor: 'rgba(0,0,0,0.3)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  bookSpineTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'white',
    textAlign: 'center',
    writingDirection: 'ltr' as const,
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bookSpineAuthor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookSpineAuthorText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  bookSpineRating: {
    flexDirection: 'column',
    gap: 2,
  },
  bookSpineStar: {
    fontSize: 8,
  },
  inputSubLabel: {
    fontSize: 11,
    color: Colors.textDim,
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  colorPickerScroll: {
    marginBottom: 16,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  colorOptionSelected: {
    borderColor: '#fff',
    borderWidth: 3,
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  colorCheckmark: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
