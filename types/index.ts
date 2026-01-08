export interface Task {
  id: number;
  name: string;
  desc: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
  time: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  completed: boolean;
  completedDate?: string;
  listId?: number | null;
  createdDate: string;
  notificationId?: string;
  reminderBefore?: number;
}

export interface TaskList {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Note {
  id: number;
  name: string;
  text: string;
  locked: boolean;
  pinned: boolean;
  date: string;
  category: string;
  createdDate: string;
  lastModified?: string;
  images?: string[];
  stamps?: string[];
  lockPin?: string;
  notificationId?: string;
  reminderTime?: string;
}

export interface Event {
  id: number;
  name: string;
  desc: string;
  date: string;
  time: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdDate: string;
  notificationId?: string;
  reminderBefore?: number;
}

export interface Habit {
  id: number;
  name: string;
}

export interface HabitCompletions {
  [key: string]: boolean;
}

export interface SubTask {
  id: number;
  text: string;
  completed: boolean;
}

export interface Priority {
  id: number;
  task: string;
  completed: boolean;
  createdDate: string;
  date?: string;
  time?: string;
  subtasks?: SubTask[];
  overdue?: boolean;
}

export interface Priorities {
  [date: string]: Priority[];
}

export interface MoodEntry {
  emoji: string;
  note: string;
  time: string;
}

export interface Moods {
  [date: string]: {
    entries: MoodEntry[];
  };
}

export interface Workout {
  id: number;
  date: string;
  name: string;
  exercises: string;
  duration: number;
  notes: string;
  progressImages?: ProgressImage[];
  weight?: number;
  templateId?: number;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: string;
  notes: string;
}

export interface ProgressImage {
  id: number;
  uri: string;
  timestamp: string;
  weight?: number;
  notes?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  status: 'reading' | 'finished' | 'want';
  totalPages: number;
  currentPage: number;
  thoughts: string;
  quotes: string;
  rating: number;
  cover?: string;
  dateAdded: string;
}

export interface Budget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  icon: string;
  recurring?: boolean;
  date?: string;
}

export interface Transaction {
  id: number;
  budgetId?: number;
  amount: number;
  description?: string;
  desc?: string;
  date: string;
  type: 'income' | 'expense';
}

export interface Debt {
  id: number;
  name: string;
  amount: number;
  interest: number;
  payment: number;
  due: string;
}

export interface Savings {
  id: number;
  name: string;
  target: number;
  current: number;
  monthly: number;
  deadline: string;
}

export interface GiftItem {
  id: number;
  name: string;
  notes: string;
  event: string;
  price: string;
  link: string;
  image?: string;
  purchased?: boolean;
}

export interface GiftPerson {
  id: number;
  name: string;
  tag: 'family' | 'friend' | 'coworker' | 'other';
  gifts: GiftItem[];
  expanded?: boolean;
}

export interface BingoItem {
  e: string;
  t: string;
  d: boolean;
  img?: string;
  bg?: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  emoji: string;
  img?: string;
  animation: 'fireworks' | 'snow' | 'hearts' | 'sparkles' | 'confetti' | 'stars';
}
