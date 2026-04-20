import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import React, { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import {
  Task,
  TaskList,
  Note,
  Event,
  Habit,
  HabitCompletions,
  Priority,
  Priorities,
  Moods,
  Workout,
  WorkoutTemplate,
  Book,
  Budget,
  Transaction,
  Debt,
  Savings,
  GiftPerson,
  GiftItem,
  BingoItem,
  BingoPrize,
  Holiday,
  Category,
} from '@/types';

let _idCounter = 0;
let _lastTimestamp = 0;
const uniqueId = () => {
  const now = Date.now();
  if (now === _lastTimestamp) {
    _idCounter++;
  } else {
    _lastTimestamp = now;
    _idCounter = 0;
  }
  return now * 10000 + _idCounter;
};

const DEFAULT_TASK_LISTS: TaskList[] = [
  { id: 1, name: 'Personal', icon: '👤', color: '#6366f1' },
  { id: 2, name: 'Work', icon: '💼', color: '#8b5cf6' },
  { id: 3, name: 'Shopping', icon: '🛒', color: '#ec4899' },
  { id: 4, name: 'Fitness', icon: '💪', color: '#10b981' },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: 1, name: 'Food & Dining', amount: 500, spent: 0, icon: '🍔' },
  { id: 2, name: 'DoorDash / Delivery', amount: 150, spent: 0, icon: '🛵' },
  { id: 3, name: 'Healthcare', amount: 250, spent: 0, icon: '🏥' },
  { id: 4, name: 'Bills & Utilities', amount: 1200, spent: 0, icon: '🏠' },
  { id: 5, name: 'Transportation', amount: 150, spent: 0, icon: '🚗' },
  { id: 6, name: 'Shopping', amount: 400, spent: 0, icon: '🛍️' },
  { id: 7, name: 'Entertainment', amount: 200, spent: 0, icon: '🎬' },
];

const DEFAULT_BINGO: BingoItem[] = [
  { e: '📚', t: 'Read 12 books', d: false },
  { e: '🏃', t: 'Run 5K', d: false },
  { e: '🎓', t: 'Learn skill', d: false },
  { e: '✈️', t: 'Visit 3 places', d: false },
  { e: '💰', t: 'Save $5000', d: false },
  { e: '👨‍🍳', t: 'Cook recipes', d: false },
  { e: '🧘', t: 'Meditate', d: false },
  { e: '❤️', t: 'Volunteer', d: false },
  { e: '🌱', t: 'Garden', d: false },
  { e: '🧹', t: 'Clean house', d: false },
  { e: '🎨', t: 'Master hobby', d: false },
  { e: '💑', t: 'Date nights', d: false },
  { e: '⭐', t: 'FREE SPACE', d: true },
  { e: '💧', t: 'Drink water', d: false },
  { e: '📞', t: 'Call family', d: false },
  { e: '👔', t: 'Organize', d: false },
  { e: '🎸', t: 'Instrument', d: false },
  { e: '🍽️', t: 'Restaurants', d: false },
  { e: '🌅', t: 'Sunrise', d: false },
  { e: '👋', t: 'New friend', d: false },
  { e: '🔧', t: 'Fix thing', d: false },
  { e: '🧩', t: 'Puzzle', d: false },
  { e: '📝', t: 'Journal', d: false },
  { e: '🎁', t: 'Kindness', d: false },
  { e: '✨', t: 'Build habit', d: false },
];

const DEFAULT_NOTE_CATEGORIES: Category[] = [
  { id: 1, value: 'Work', label: '💼 Work', type: 'note' },
  { id: 2, value: 'Personal', label: '👤 Personal', type: 'note' },
  { id: 3, value: 'Ideas', label: '💡 Ideas', type: 'note' },
  { id: 4, value: 'Projects', label: '🚀 Projects', type: 'note' },
  { id: 5, value: 'Journal', label: '📔 Journal', type: 'note' },
  { id: 6, value: 'Recipes', label: '🍳 Recipes', type: 'note' },
];

const DEFAULT_TASK_CATEGORIES: Category[] = [
  { id: 1, value: 'Work', label: '💼 Work', type: 'task' },
  { id: 2, value: 'Personal', label: '👤 Personal', type: 'task' },
  { id: 3, value: 'Shopping', label: '🛒 Shopping', type: 'task' },
  { id: 4, value: 'Health', label: '💪 Health', type: 'task' },
  { id: 5, value: 'Finance', label: '💰 Finance', type: 'task' },
];

export const [DataProvider, useData] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>(DEFAULT_TASK_LISTS);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletions>({});
  const [priorities, setPriorities] = useState<Priorities>({});
  const [moods, setMoods] = useState<Moods>({});
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [giftPeople, setGiftPeople] = useState<GiftPerson[]>([]);
  const [bingoData, setBingoData] = useState<BingoItem[]>(DEFAULT_BINGO);
  const [bingoPrize, setBingoPrize] = useState<BingoPrize>({ title: '🎉 Grand Prize', description: 'Celebrate your achievement!', emoji: '🎁' });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [noteCategories, setNoteCategories] = useState<Category[]>(DEFAULT_NOTE_CATEGORIES);
  const [taskCategories, setTaskCategories] = useState<Category[]>(DEFAULT_TASK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        tasksData,
        taskListsData,
        notesData,
        eventsData,
        habitsData,
        habitCompletionsData,
        prioritiesData,
        moodsData,
        workoutsData,
        workoutTemplatesData,
        booksData,
        budgetsData,
        transactionsData,
        debtsData,
        savingsData,
        giftPeopleData,
        bingoDataStored,
        bingoPrizeData,
        holidaysData,
        noteCategoriesData,
        taskCategoriesData,
        hasOnboardedData,
      ] = await Promise.all([
        AsyncStorage.getItem('tasks'),
        AsyncStorage.getItem('taskLists'),
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('habits'),
        AsyncStorage.getItem('habitCompletions'),
        AsyncStorage.getItem('priorities'),
        AsyncStorage.getItem('moods'),
        AsyncStorage.getItem('workouts'),
        AsyncStorage.getItem('workoutTemplates'),
        AsyncStorage.getItem('books'),
        AsyncStorage.getItem('budgets'),
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('debts'),
        AsyncStorage.getItem('savings'),
        AsyncStorage.getItem('giftPeople'),
        AsyncStorage.getItem('bingoData'),
        AsyncStorage.getItem('bingoPrize'),
        AsyncStorage.getItem('holidays'),
        AsyncStorage.getItem('noteCategories'),
        AsyncStorage.getItem('taskCategories'),
        AsyncStorage.getItem('hasOnboarded'),
      ]);

      if (tasksData) setTasks(JSON.parse(tasksData));
      if (taskListsData) setTaskLists(JSON.parse(taskListsData));
      if (notesData) setNotes(JSON.parse(notesData));
      if (eventsData) setEvents(JSON.parse(eventsData));
      if (habitsData) setHabits(JSON.parse(habitsData));
      if (habitCompletionsData) setHabitCompletions(JSON.parse(habitCompletionsData));
      if (prioritiesData) setPriorities(JSON.parse(prioritiesData));
      if (moodsData) setMoods(JSON.parse(moodsData));
      if (workoutsData) setWorkouts(JSON.parse(workoutsData));
      if (workoutTemplatesData) setWorkoutTemplates(JSON.parse(workoutTemplatesData));
      if (booksData) setBooks(JSON.parse(booksData));
      if (budgetsData) setBudgets(JSON.parse(budgetsData));
      if (transactionsData) setTransactions(JSON.parse(transactionsData));
      if (debtsData) setDebts(JSON.parse(debtsData));
      if (savingsData) setSavings(JSON.parse(savingsData));
      if (giftPeopleData) setGiftPeople(JSON.parse(giftPeopleData));
      if (bingoDataStored) {
        const stored: BingoItem[] = JSON.parse(bingoDataStored);
        // Merge stored state over defaults so all 25 cells always exist
        // and any checked/custom state is preserved even across app updates
        const merged = DEFAULT_BINGO.map((def, i) =>
          stored[i] !== undefined ? { ...def, ...stored[i] } : def
        );
        setBingoData(merged);
      }
      if (bingoPrizeData) setBingoPrize(JSON.parse(bingoPrizeData));
      if (holidaysData) setHolidays(JSON.parse(holidaysData));
      if (noteCategoriesData) setNoteCategories(JSON.parse(noteCategoriesData));
      if (taskCategoriesData) setTaskCategories(JSON.parse(taskCategoriesData));
      if (hasOnboardedData) setHasOnboarded(JSON.parse(hasOnboardedData));
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = useCallback(async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.log(`Error saving ${key}:`, error);
    }
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdDate'>) => {
    const newTask: Task = {
      ...task,
      id: uniqueId(),
      createdDate: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => {
      const updated = [...prev, newTask];
      saveData('tasks', updated);
      return updated;
    });
  }, [saveData]);

  const updateTask = useCallback((id: number, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveData('tasks', updated);
      return updated;
    });
  }, [saveData]);

  const deleteTask = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveData('tasks', updated);
      return updated;
    });
  }, [saveData]);

  const toggleTask = useCallback((id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: !t.completed,
            completedDate: !t.completed ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return t;
      });
      saveData('tasks', updated);
      return updated;
    });
  }, [saveData]);

  const addNote = useCallback((note: Omit<Note, 'id'>) => {
    const newNote: Note = {
      ...note,
      id: uniqueId(),
    };
    setNotes(prev => {
      const updated = [...prev, newNote];
      saveData('notes', updated);
      return updated;
    });
  }, [saveData]);

  const updateNote = useCallback((id: number, updates: Partial<Note>) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, ...updates } : n);
      saveData('notes', updated);
      return updated;
    });
  }, [saveData]);

  const deleteNote = useCallback((id: number) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveData('notes', updated);
      return updated;
    });
  }, [saveData]);

  const addTaskList = useCallback((name: string, icon: string, color: string) => {
    const newList: TaskList = { id: uniqueId(), name, icon, color };
    setTaskLists(prev => {
      const updated = [...prev, newList];
      saveData('taskLists', updated);
      return updated;
    });
  }, [saveData]);

  const updateTaskList = useCallback((id: number, updates: Partial<TaskList>) => {
    setTaskLists(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates } : l);
      saveData('taskLists', updated);
      return updated;
    });
  }, [saveData]);

  const deleteTaskList = useCallback((id: number) => {
    setTaskLists(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveData('taskLists', updated);
      return updated;
    });
    setTasks(prev => {
      const updated = prev.map(t => t.listId === id ? { ...t, listId: null } : t);
      saveData('tasks', updated);
      return updated;
    });
  }, [saveData]);

  const addEvent = useCallback((event: Omit<Event, 'id' | 'createdDate'>) => {
    const newEvent: Event = {
      ...event,
      id: uniqueId(),
      createdDate: new Date().toISOString().split('T')[0],
    };
    setEvents(prev => {
      const updated = [...prev, newEvent];
      saveData('events', updated);
      return updated;
    });
  }, [saveData]);

  const updateEvent = useCallback((id: number, updates: Partial<Event>) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      saveData('events', updated);
      return updated;
    });
  }, [saveData]);

  const deleteEvent = useCallback((id: number) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveData('events', updated);
      return updated;
    });
  }, [saveData]);

  const addHabit = useCallback((name: string, icon?: string, image?: string) => {
    const newHabit: Habit = { id: uniqueId(), name, icon, image };
    setHabits(prev => {
      const updated = [...prev, newHabit];
      saveData('habits', updated);
      return updated;
    });
  }, [saveData]);

  const updateHabit = useCallback((id: number, updates: Partial<Pick<Habit, 'name' | 'icon' | 'image'>>) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, ...updates } : h);
      saveData('habits', updated);
      return updated;
    });
  }, [saveData]);

  const deleteHabit = useCallback((id: number) => {
    setHabits(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveData('habits', updated);
      return updated;
    });
  }, [saveData]);

  const toggleHabitCompletion = useCallback((habitId: number, date: string) => {
    const key = `${habitId}-${date}`;
    setHabitCompletions(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      saveData('habitCompletions', updated);
      return updated;
    });
  }, [saveData]);

  const addPriority = useCallback((date: string, task: string, priorityDate?: string, priorityTime?: string) => {
    const newPriority: Priority = {
      id: uniqueId(),
      task,
      completed: false,
      createdDate: date,
      date: priorityDate,
      time: priorityTime,
      subtasks: [],
    };
    setPriorities(prev => {
      const existing = prev[date] || [];
      if (existing.length >= 5) return prev;
      const updated = { ...prev, [date]: [...existing, newPriority] };
      saveData('priorities', updated);
      return updated;
    });
  }, [saveData]);

  const togglePriority = useCallback((date: string, id: number) => {
    setPriorities(prev => {
      const existing = prev[date] || [];
      const updated = {
        ...prev,
        [date]: existing.map(p => 
          p.id === id ? { ...p, completed: !p.completed } : p
        ),
      };
      saveData('priorities', updated);
      return updated;
    });
  }, [saveData]);

  const updatePriority = useCallback((date: string, id: number, updates: Partial<Priority>) => {
    setPriorities(prev => {
      const existing = prev[date] || [];
      const updated = {
        ...prev,
        [date]: existing.map(p => p.id === id ? { ...p, ...updates } : p),
      };
      saveData('priorities', updated);
      return updated;
    });
  }, [saveData]);

  const rolloverPriorities = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    setPriorities(prev => {
      // Gather all uncompleted priorities from every past date, deduplicated by id
      const seenIds = new Set<number>();
      const allPastUncompleted: Priority[] = [];

      const pastDates = Object.keys(prev).filter(date => date < today).sort().reverse();
      for (const date of pastDates) {
        for (const p of prev[date]) {
          if (!p.completed && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            allPastUncompleted.push({ ...p, overdue: true });
          }
        }
      }

      if (allPastUncompleted.length === 0) return prev;

      const todayPriorities = prev[today] || [];
      // Keep today's items that aren't already represented in the overdue list
      const todayNewItems = todayPriorities.filter(p => !seenIds.has(p.id));

      const updated = {
        ...prev,
        [today]: [...allPastUncompleted, ...todayNewItems].slice(0, 5),
      };
      saveData('priorities', updated);
      return updated;
    });
  }, [saveData]);

  const deletePriority = useCallback((date: string, id: number) => {
    setPriorities(prev => {
      const existing = prev[date] || [];
      const updated = {
        ...prev,
        [date]: existing.filter(p => p.id !== id),
      };
      saveData('priorities', updated);
      return updated;
    });
  }, [saveData]);

  const addMoodEntry = useCallback((date: string, emoji: string, note: string) => {
    const entry = {
      emoji,
      note,
      time: new Date().toTimeString().slice(0, 5),
    };
    setMoods(prev => {
      const existing = prev[date] || { entries: [] };
      const updated = {
        ...prev,
        [date]: { entries: [...existing.entries, entry] },
      };
      saveData('moods', updated);
      return updated;
    });
  }, [saveData]);

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = { ...workout, id: uniqueId() };
    setWorkouts(prev => {
      const updated = [...prev, newWorkout];
      saveData('workouts', updated);
      return updated;
    });
  }, [saveData]);

  const updateWorkout = useCallback((id: number, updates: Partial<Workout>) => {
    setWorkouts(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      saveData('workouts', updated);
      return updated;
    });
  }, [saveData]);

  const deleteWorkout = useCallback((id: number) => {
    setWorkouts(prev => {
      const updated = prev.filter(w => w.id !== id);
      saveData('workouts', updated);
      return updated;
    });
  }, [saveData]);

  const addWorkoutTemplate = useCallback((template: Omit<WorkoutTemplate, 'id'>) => {
    const newTemplate: WorkoutTemplate = { ...template, id: uniqueId() };
    setWorkoutTemplates(prev => {
      const updated = [...prev, newTemplate];
      saveData('workoutTemplates', updated);
      return updated;
    });
  }, [saveData]);

  const updateWorkoutTemplate = useCallback((id: number, updates: Partial<WorkoutTemplate>) => {
    setWorkoutTemplates(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveData('workoutTemplates', updated);
      return updated;
    });
  }, [saveData]);

  const deleteWorkoutTemplate = useCallback((id: number) => {
    setWorkoutTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveData('workoutTemplates', updated);
      return updated;
    });
  }, [saveData]);

  const addBook = useCallback((book: Omit<Book, 'id' | 'dateAdded'>) => {
    const newBook: Book = {
      ...book,
      id: uniqueId(),
      dateAdded: new Date().toISOString().split('T')[0],
    };
    setBooks(prev => {
      const updated = [...prev, newBook];
      saveData('books', updated);
      return updated;
    });
  }, [saveData]);

  const updateBook = useCallback((id: number, updates: Partial<Book>) => {
    setBooks(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      saveData('books', updated);
      return updated;
    });
  }, [saveData]);

  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = { ...budget, id: uniqueId(), spent: 0 };
    setBudgets(prev => {
      const updated = [...prev, newBudget];
      saveData('budgets', updated);
      return updated;
    });
  }, [saveData]);

  const updateBudget = useCallback((id: number, updates: Partial<Budget>) => {
    setBudgets(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      saveData('budgets', updated);
      return updated;
    });
  }, [saveData]);

  const deleteBudget = useCallback((id: number) => {
    setBudgets(prev => {
      const updated = prev.filter(b => b.id !== id);
      saveData('budgets', updated);
      return updated;
    });
  }, [saveData]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: uniqueId() };
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      saveData('transactions', updated);
      return updated;
    });

    if (transaction.type === 'expense' && transaction.budgetId) {
      setBudgets(prev => {
        const updated = prev.map(b =>
          b.id === transaction.budgetId
            ? { ...b, spent: b.spent + transaction.amount }
            : b
        );
        saveData('budgets', updated);
        return updated;
      });
    }
  }, [saveData]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const oldTransaction = transactions.find(t => t.id === id);
    
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveData('transactions', updated);
      return updated;
    });

    if (oldTransaction) {
      setBudgets(prev => {
        let updated = [...prev];
        
        if (oldTransaction.type === 'expense' && oldTransaction.budgetId) {
          updated = updated.map(b =>
            b.id === oldTransaction.budgetId
              ? { ...b, spent: Math.max(0, b.spent - oldTransaction.amount) }
              : b
          );
        }
        
        const newTransaction = { ...oldTransaction, ...updates };
        if (newTransaction.type === 'expense' && newTransaction.budgetId) {
          updated = updated.map(b =>
            b.id === newTransaction.budgetId
              ? { ...b, spent: b.spent + newTransaction.amount }
              : b
          );
        }
        
        saveData('budgets', updated);
        return updated;
      });
    }
  }, [saveData, transactions]);

  const deleteTransaction = useCallback((id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction?.type === 'expense' && transaction.budgetId) {
      setBudgets(prev => {
        const updated = prev.map(b =>
          b.id === transaction.budgetId
            ? { ...b, spent: Math.max(0, b.spent - transaction.amount) }
            : b
        );
        saveData('budgets', updated);
        return updated;
      });
    }
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveData('transactions', updated);
      return updated;
    });
  }, [saveData, transactions]);

  const clearAllTransactions = useCallback(() => {
    setTransactions([]);
    saveData('transactions', []);
    setBudgets(prev => {
      const updated = prev.map(b => ({ ...b, spent: 0 }));
      saveData('budgets', updated);
      return updated;
    });
  }, [saveData]);

  const deleteDebt = useCallback((id: number) => {
    setDebts(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveData('debts', updated);
      return updated;
    });
  }, [saveData]);

  const deleteSavings = useCallback((id: number) => {
    setSavings(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveData('savings', updated);
      return updated;
    });
  }, [saveData]);

  const toggleBingo = useCallback((index: number) => {
    setBingoData(prev => {
      if (prev[index].t === 'FREE SPACE') return prev;
      const updated = prev.map((item, i) =>
        i === index ? { ...item, d: !item.d } : item
      );
      saveData('bingoData', updated);
      return updated;
    });
  }, [saveData]);

  const updateBingo = useCallback((index: number, updates: Partial<BingoItem>) => {
    setBingoData(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      saveData('bingoData', updated);
      return updated;
    });
  }, [saveData]);

  const updateBingoPrize = useCallback((updates: Partial<BingoPrize>) => {
    setBingoPrize(prev => {
      const updated = { ...prev, ...updates };
      saveData('bingoPrize', updated);
      return updated;
    });
  }, [saveData]);

  const addGiftPerson = useCallback((name: string, tag: GiftPerson['tag']) => {
    const newPerson: GiftPerson = {
      id: uniqueId(),
      name,
      tag,
      gifts: [],
      expanded: true,
    };
    setGiftPeople(prev => {
      const updated = [...prev, newPerson];
      saveData('giftPeople', updated);
      return updated;
    });
  }, [saveData]);

  const addGiftItem = useCallback((personId: number, gift: Omit<GiftPerson['gifts'][0], 'id'>) => {
    setGiftPeople(prev => {
      const updated = prev.map(p => {
        if (p.id === personId) {
          return {
            ...p,
            gifts: [...p.gifts, { ...gift, id: uniqueId() }],
          };
        }
        return p;
      });
      saveData('giftPeople', updated);
      return updated;
    });
  }, [saveData]);

  const deleteGiftPerson = useCallback((id: number) => {
    setGiftPeople(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveData('giftPeople', updated);
      return updated;
    });
  }, [saveData]);

  const deleteGiftItem = useCallback((personId: number, giftId: number) => {
    setGiftPeople(prev => {
      const updated = prev.map(p => {
        if (p.id === personId) {
          return {
            ...p,
            gifts: p.gifts.filter(g => g.id !== giftId),
          };
        }
        return p;
      });
      saveData('giftPeople', updated);
      return updated;
    });
  }, [saveData]);

  const updateGiftItem = useCallback((personId: number, giftId: number, updates: Partial<GiftItem>) => {
    setGiftPeople(prev => {
      const updated = prev.map(p => {
        if (p.id === personId) {
          return {
            ...p,
            gifts: p.gifts.map(g => g.id === giftId ? { ...g, ...updates } : g),
          };
        }
        return p;
      });
      saveData('giftPeople', updated);
      return updated;
    });
  }, [saveData]);

  const deleteBook = useCallback((id: number) => {
    setBooks(prev => {
      const updated = prev.filter(b => b.id !== id);
      saveData('books', updated);
      return updated;
    });
  }, [saveData]);

  const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: uniqueId() };
    setDebts(prev => {
      const updated = [...prev, newDebt];
      saveData('debts', updated);
      return updated;
    });
  }, [saveData]);

  const updateDebt = useCallback((id: number, updates: Partial<Debt>) => {
    setDebts(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, ...updates } : d);
      saveData('debts', updated);
      return updated;
    });
  }, [saveData]);

  const addSavings = useCallback((savings: Omit<Savings, 'id'>) => {
    const newSavings: Savings = { ...savings, id: uniqueId() };
    setSavings(prev => {
      const updated = [...prev, newSavings];
      saveData('savings', updated);
      return updated;
    });
  }, [saveData]);

  const updateSavings = useCallback((id: number, updates: Partial<Savings>) => {
    setSavings(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveData('savings', updated);
      return updated;
    });
  }, [saveData]);

  const completeOnboarding = useCallback(async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem('hasOnboarded', JSON.stringify(true));
  }, []);

  const exportData = useCallback(() => {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      taskLists,
      notes,
      events,
      habits,
      habitCompletions,
      priorities,
      moods,
      workouts,
      workoutTemplates,
      books,
      budgets,
      transactions,
      debts,
      savings,
      giftPeople,
      bingoData,
      bingoPrize,
      holidays,
      noteCategories,
      taskCategories,
    }, null, 2);
  }, [tasks, taskLists, notes, events, habits, habitCompletions, priorities, moods, workouts, workoutTemplates, books, budgets, transactions, debts, savings, giftPeople, bingoData, bingoPrize, holidays, noteCategories, taskCategories]);

  const importData = useCallback(async (json: string) => {
    const data = JSON.parse(json);
    if (!data.version) throw new Error('Invalid backup file');
    const saves: Promise<void>[] = [];
    const set = <T,>(setter: Dispatch<SetStateAction<T>>, key: string, value: T) => {
      setter(value);
      saves.push(saveData(key, value));
    };
    if (data.tasks) set(setTasks, 'tasks', data.tasks);
    if (data.taskLists) set(setTaskLists, 'taskLists', data.taskLists);
    if (data.notes) set(setNotes, 'notes', data.notes);
    if (data.events) set(setEvents, 'events', data.events);
    if (data.habits) set(setHabits, 'habits', data.habits);
    if (data.habitCompletions) set(setHabitCompletions, 'habitCompletions', data.habitCompletions);
    if (data.priorities) set(setPriorities, 'priorities', data.priorities);
    if (data.moods) set(setMoods, 'moods', data.moods);
    if (data.workouts) set(setWorkouts, 'workouts', data.workouts);
    if (data.workoutTemplates) set(setWorkoutTemplates, 'workoutTemplates', data.workoutTemplates);
    if (data.books) set(setBooks, 'books', data.books);
    if (data.budgets) set(setBudgets, 'budgets', data.budgets);
    if (data.transactions) set(setTransactions, 'transactions', data.transactions);
    if (data.debts) set(setDebts, 'debts', data.debts);
    if (data.savings) set(setSavings, 'savings', data.savings);
    if (data.giftPeople) set(setGiftPeople, 'giftPeople', data.giftPeople);
    if (data.bingoData) set(setBingoData, 'bingoData', data.bingoData);
    if (data.bingoPrize) set(setBingoPrize, 'bingoPrize', data.bingoPrize);
    if (data.holidays) set(setHolidays, 'holidays', data.holidays);
    if (data.noteCategories) set(setNoteCategories, 'noteCategories', data.noteCategories);
    if (data.taskCategories) set(setTaskCategories, 'taskCategories', data.taskCategories);
    await Promise.all(saves);
  }, [saveData]);

  return {
    isLoading,
    hasOnboarded,
    completeOnboarding,
    exportData,
    importData,
    tasks,
    taskLists,
    notes,
    events,
    habits,
    habitCompletions,
    priorities,
    moods,
    workouts,
    workoutTemplates,
    books,
    budgets,
    transactions,
    debts,
    savings,
    giftPeople,
    bingoData,
    bingoPrize,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    addNote,
    updateNote,
    deleteNote,
    addTaskList,
    updateTaskList,
    deleteTaskList,
    addEvent,
    updateEvent,
    deleteEvent,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    addPriority,
    updatePriority,
    togglePriority,
    deletePriority,
    rolloverPriorities,
    addMoodEntry,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    addBook,
    updateBook,
    deleteBook,
    addBudget,
    updateBudget,
    deleteBudget,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    addDebt,
    updateDebt,
    deleteDebt,
    addSavings,
    updateSavings,
    deleteSavings,
    toggleBingo,
    updateBingo,
    updateBingoPrize,
    addGiftPerson,
    addGiftItem,
    deleteGiftPerson,
    deleteGiftItem,
    updateGiftItem,
    holidays,
    addHoliday: (holiday: Omit<Holiday, 'id'>) => {
      const newHoliday: Holiday = { ...holiday, id: uniqueId() };
      setHolidays(prev => {
        const updated = [...prev, newHoliday];
        saveData('holidays', updated);
        return updated;
      });
    },
    updateHoliday: (id: number, updates: Partial<Holiday>) => {
      setHolidays(prev => {
        const updated = prev.map(h => h.id === id ? { ...h, ...updates } : h);
        saveData('holidays', updated);
        return updated;
      });
    },
    deleteHoliday: (id: number) => {
      setHolidays(prev => {
        const updated = prev.filter(h => h.id !== id);
        saveData('holidays', updated);
        return updated;
      });
    },
    noteCategories,
    taskCategories,
    addNoteCategory: (value: string, label: string) => {
      const newCategory: Category = { id: uniqueId(), value, label, type: 'note' };
      setNoteCategories(prev => {
        const updated = [...prev, newCategory];
        saveData('noteCategories', updated);
        return updated;
      });
    },
    updateNoteCategory: (id: number, updates: Partial<Category>) => {
      setNoteCategories(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
        saveData('noteCategories', updated);
        return updated;
      });
    },
    deleteNoteCategory: (id: number) => {
      setNoteCategories(prev => {
        const updated = prev.filter(c => c.id !== id);
        saveData('noteCategories', updated);
        return updated;
      });
    },
    addTaskCategory: (value: string, label: string) => {
      const newCategory: Category = { id: uniqueId(), value, label, type: 'task' };
      setTaskCategories(prev => {
        const updated = [...prev, newCategory];
        saveData('taskCategories', updated);
        return updated;
      });
    },
    updateTaskCategory: (id: number, updates: Partial<Category>) => {
      setTaskCategories(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
        saveData('taskCategories', updated);
        return updated;
      });
    },
    deleteTaskCategory: (id: number) => {
      setTaskCategories(prev => {
        const updated = prev.filter(c => c.id !== id);
        saveData('taskCategories', updated);
        return updated;
      });
    },
  };
});
