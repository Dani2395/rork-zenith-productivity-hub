import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Upload,
  Edit2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Bell,
  Lightbulb,
  TriangleAlert,
  AlertCircle,
  Info,
  X,
  CheckCircle,
  DollarSign,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import styles from '@/styles/budgetStyles';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useData } from '@/contexts/DataContext';
import { Budget, Transaction, Debt, DebtPayment, Savings } from '@/types';
import { processCSVData, analyzeExpenses, ExpenseInsight, MERCHANT_CATEGORIES } from '@/utils/budgetHelpers';
import { extractTextFromPDF, isPDFContent } from '@/utils/pdfExtractor';
import { updateBudgetWidget } from '@/widgets/widgetTaskHandler';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const modalPaddingBottom = Math.max(insets.bottom, 16) + 24;
  const {
    budgets,
    transactions,
    debts,
    savings,
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
  } = useData();

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);

  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetIcon, setBudgetIcon] = useState('💰');
  const [budgetRecurring, setBudgetRecurring] = useState(false);
  const [budgetDate, setBudgetDate] = useState('');

  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDesc, setTransactionDesc] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtInterest, setDebtInterest] = useState('');
  const [debtPayment, setDebtPayment] = useState('');
  const [debtDue, setDebtDue] = useState('');
  const [debtDueDay, setDebtDueDay] = useState<number>(1);
  const [debtPaymentModalVisible, setDebtPaymentModalVisible] = useState(false);
  const [debtPaymentTarget, setDebtPaymentTarget] = useState<Debt | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
  const [debtDetailVisible, setDebtDetailVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');
  const [savingsMonthly, setSavingsMonthly] = useState('');
  const [savingsDeadline, setSavingsDeadline] = useState('');

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [_isUploading, setIsUploading] = useState(false);
  const [statementEndingBalance, setStatementEndingBalance] = useState<number | null>(null);
  const [monthlyEndingBalances, setMonthlyEndingBalances] = useState<Record<string, number>>({});

  // Load persisted ending balance on mount
  useEffect(() => {
    AsyncStorage.getItem('statementEndingBalance').then(v => {
      if (v !== null) setStatementEndingBalance(parseFloat(v));
    });
  }, []);

  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [expenseInsights, setExpenseInsights] = useState<ExpenseInsight[]>([]);

  // Widget / notification settings
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [monthDetailVisible, setMonthDetailVisible] = useState(false);
  const [activePage, setActivePage] = useState<'budget' | 'subscriptions'>('budget');
  const [budgetDetailVisible, setBudgetDetailVisible] = useState(false);
  const [selectedBudgetForDetail, setSelectedBudgetForDetail] = useState<Budget | null>(null);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(() => {
    const now = new Date();
    return new Set([`${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`]);
  });
  const [expandedArchiveYears, setExpandedArchiveYears] = useState<Set<number>>(new Set());
  const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState<string>('');
  const [incomeGoalEditing, setIncomeGoalEditing] = useState(false);
  const [incomeGoalDraft, setIncomeGoalDraft] = useState('');

  // Subscriptions state
  const [subsBudgetGoal, setSubsBudgetGoal] = useState<string>('');
  const [subsBudgetEditing, setSubsBudgetEditing] = useState(false);
  const [subsBudgetDraft, setSubsBudgetDraft] = useState('');
  const [cancelledSubs, setCancelledSubs] = useState<Record<string, string>>({});
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(new Set(['Streaming', 'Music & Audio', 'Shopping', 'Software', 'Fitness', 'Other']));
  const [subsViewMonth, setSubsViewMonth] = useState<string>('');
  const [expandedSubKeys, setExpandedSubKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem('monthlyIncomeGoal').then(v => { if (v) setMonthlyIncomeGoal(v); });
    AsyncStorage.getItem('subsBudgetGoal').then(v => { if (v) setSubsBudgetGoal(v); });
    AsyncStorage.getItem('cancelledSubs').then(v => { if (v) { try { setCancelledSubs(JSON.parse(v)); } catch {} } });
    AsyncStorage.getItem('monthlyEndingBalances').then(v => { if (v) { try { setMonthlyEndingBalances(JSON.parse(v)); } catch {} } });
    AsyncStorage.getItem('statementEndingBalance').then(v => { if (v !== null) setStatementEndingBalance(parseFloat(v)); });
  }, []);

  const saveIncomeGoal = async (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setMonthlyIncomeGoal(cleaned);
    await AsyncStorage.setItem('monthlyIncomeGoal', cleaned);
  };

  const MONTH_NAMES = useMemo(() => [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ], []);
  const getMonthKey = useCallback((year: number, month0: number) => `${MONTH_NAMES[month0]} ${year}`, [MONTH_NAMES]);

  const now = new Date();
  const thisMonth = getMonthKey(now.getFullYear(), now.getMonth());

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalSavingsTarget = savings.reduce((sum, s) => sum + s.target, 0);
  const totalSavingsCurrent = savings.reduce((sum, s) => sum + s.current, 0);

  const SUB_GROUPS: Record<string, { keywords: string[]; emoji: string; color: string }> = {
    'Streaming':    { emoji: '🎬', color: '#a78bfa', keywords: ['netflix','hulu','disney','hbo','peacock','paramount','apple tv','appletv','showtime','starz','crunchyroll','fubo','sling','prime video','youtube premium','twitch'] },
    'Music & Audio':{ emoji: '🎵', color: '#34d399', keywords: ['spotify','apple music','tidal','amazon music','youtube music','pandora','deezer','audible','podcast subscripti'] },
    'Shopping':     { emoji: '🛒', color: '#fbbf24', keywords: ['amazon prime','kindle','walmart+','walmart+ member','instacart','dashpass','costco member','sams club member'] },
    'Software':     { emoji: '💻', color: '#60a5fa', keywords: ['microsoft','adobe','norton','mcafee','nordvpn','expressvpn','google one','icloud','dropbox','grammarly','setapp','mimo','skillshare','masterclass','coursera','duolingo','calm','headspace','truthfinder','ancestry','myheritage','usesprout','claude.ai','anthropic','chatgpt','openai'] },
    'Fitness':      { emoji: '💪', color: '#f87171', keywords: ['24 hour fitness','planet fitness','gym','peloton','anytime fitness','equinox'] },
    'Other':        { emoji: '📦', color: '#9ca3af', keywords: ['patreon','substack','onlyfans','discord nitro','xbox game pass','playstation','apple one','acorns','robinhood','subscription','subscripti','membership','membershi','blind wave','hidive','webnovel'] },
  };

  const SUBSCRIPTION_KEYWORDS = Object.values(SUB_GROUPS).flatMap(g => g.keywords);

  // Build per-month subscription data
  const allSubsByMonth = useMemo(() => {
    // map from YYYY-MM -> key -> { description, amount, date, count }
    const result: Record<string, Record<string, { description: string; amount: number; date: string; count: number; group: string }>> = {};
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const desc = (t.description ?? '').toLowerCase();
      let matchedKey: string | null = null;
      let matchedGroup = 'Other';
      outer: for (const [group, { keywords }] of Object.entries(SUB_GROUPS)) {
        for (const kw of keywords) {
          if (desc.includes(kw)) { matchedKey = kw; matchedGroup = group; break outer; }
        }
      }
      if (!matchedKey) continue;
      const ym = t.date.substring(0, 7); // YYYY-MM
      if (!result[ym]) result[ym] = {};
      const existing = result[ym][matchedKey];
      if (!existing || t.amount > existing.amount) {
        result[ym][matchedKey] = { description: t.description ?? matchedKey, amount: t.amount, date: t.date, count: (existing?.count ?? 0) + 1, group: matchedGroup };
      } else {
        existing.count += 1;
      }
    }
    return result;
  }, [transactions]);

  const subsMonthOptions = useMemo(() => Object.keys(allSubsByMonth).sort().reverse(), [allSubsByMonth]);

  const activeSubsMonth = useMemo(() => {
    if (subsViewMonth && allSubsByMonth[subsViewMonth]) return subsViewMonth;
    return subsMonthOptions[0] ?? '';
  }, [subsViewMonth, subsMonthOptions, allSubsByMonth]);

  const subsForMonth = useMemo(() => {
    const raw = allSubsByMonth[activeSubsMonth] ?? {};
    return Object.entries(raw).map(([key, val]) => ({
      key,
      ...val,
      cancelled: !!cancelledSubs[key] && cancelledSubs[key] <= activeSubsMonth,
    }));
  }, [allSubsByMonth, activeSubsMonth, cancelledSubs]);

  const subsGrouped = useMemo(() => {
    const groups: Record<string, typeof subsForMonth> = {};
    for (const sub of subsForMonth) {
      if (!groups[sub.group]) groups[sub.group] = [];
      groups[sub.group].push(sub);
    }
    return groups;
  }, [subsForMonth]);

  const handleCancelSub = (key: string) => {
    // cancel from the NEXT month onward
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const ym = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const updated = { ...cancelledSubs, [key]: ym };
    setCancelledSubs(updated);
    AsyncStorage.setItem('cancelledSubs', JSON.stringify(updated));
  };

  const handleUncancelSub = (key: string) => {
    const updated = { ...cancelledSubs };
    delete updated[key];
    setCancelledSubs(updated);
    AsyncStorage.setItem('cancelledSubs', JSON.stringify(updated));
  };

  // For each subscription key, get every matching transaction across ALL months
  const allTxsBySubKey = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const desc = (t.description ?? '').toLowerCase();
      for (const [, { keywords }] of Object.entries(SUB_GROUPS)) {
        for (const kw of keywords) {
          if (desc.includes(kw)) {
            if (!map[kw]) map[kw] = [];
            map[kw].push(t);
            break;
          }
        }
      }
    }
    return map;
  }, [transactions]);

  // Classify a transaction for a sub key: 'recurring' | 'channel' | 'onetime'
  const classifyCharge = useCallback((t: Transaction, key: string): 'recurring' | 'channel' | 'onetime' => {
    const all = allTxsBySubKey[key] ?? [];
    // Count how many months have a charge within $2 of this amount
    const months = new Set<string>();
    for (const tx of all) {
      if (Math.abs(tx.amount - t.amount) <= 2) months.add(tx.date.substring(0, 7));
    }
    if (months.size >= 2) return 'recurring';
    // Smaller amounts that repeat could be channel add-ons
    if (t.amount < 12 && all.filter(tx => Math.abs(tx.amount - t.amount) <= 1).length >= 1) return 'channel';
    return 'onetime';
  }, [allTxsBySubKey]);

  // Detect true duplicate subscriptions: same keyword, same amount (within $1), same day in same month.
  // Two different recurring charges for the same service (e.g., Prime on two cards) are NOT duplicates.
  const duplicateSubs = useMemo(() => {
    const dupes: Set<string> = new Set();
    for (const [key, txs] of Object.entries(allTxsBySubKey)) {
      const byMonth: Record<string, Transaction[]> = {};
      for (const t of txs) {
        const ym = t.date.substring(0, 7);
        if (!byMonth[ym]) byMonth[ym] = [];
        byMonth[ym].push(t);
      }
      for (const monthTxs of Object.values(byMonth)) {
        // Only flag as duplicate if same amount AND same date (likely accidental double-charge)
        const byDateAndAmount: Record<string, number> = {};
        for (const t of monthTxs) {
          const bucket = `${t.date}|${Math.round(t.amount * 100)}`;
          byDateAndAmount[bucket] = (byDateAndAmount[bucket] ?? 0) + 1;
        }
        if (Object.values(byDateAndAmount).some(c => c >= 2)) { dupes.add(key); break; }
      }
    }
    return dupes;
  }, [allTxsBySubKey]);

  // Count of recurring charges per sub key per month (to show "2 Spotify" instead of duplicate warning)
  const subCountByKeyMonth = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const [key, txs] of Object.entries(allTxsBySubKey)) {
      for (const t of txs) {
        const ym = t.date.substring(0, 7);
        const all = allTxsBySubKey[key] ?? [];
        const months = new Set(all.filter(tx => Math.abs(tx.amount - t.amount) <= 2).map(tx => tx.date.substring(0, 7)));
        if (months.size >= 2) {
          if (!map[key]) map[key] = {};
          map[key][ym] = (map[key][ym] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [allTxsBySubKey]);

  // For a budget card: which subscription keys have transactions assigned to this budget?
  const subsByBudgetId = useMemo(() => {
    const map: Record<number, { key: string; description: string; amount: number; date: string; group: string; cancelled: boolean; isDuplicate: boolean }[]> = {};
    const ym = activeSubsMonth;
    const monthTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(ym));
    for (const t of monthTxs) {
      if (t.budgetId == null) continue;
      const desc = (t.description ?? '').toLowerCase();
      let matchedKey: string | null = null;
      let matchedGroup = 'Other';
      outer: for (const [group, { keywords }] of Object.entries(SUB_GROUPS)) {
        for (const kw of keywords) {
          if (desc.includes(kw)) { matchedKey = kw; matchedGroup = group; break outer; }
        }
      }
      if (!matchedKey) continue;
      if (!map[t.budgetId]) map[t.budgetId] = [];
      const existing = map[t.budgetId].find(s => s.key === matchedKey);
      if (!existing) {
        map[t.budgetId].push({
          key: matchedKey,
          description: t.description ?? matchedKey,
          amount: t.amount,
          date: t.date,
          group: matchedGroup,
          cancelled: !!cancelledSubs[matchedKey] && cancelledSubs[matchedKey] <= ym,
          isDuplicate: duplicateSubs.has(matchedKey),
        });
      }
    }
    return map;
  }, [transactions, activeSubsMonth, cancelledSubs, duplicateSubs]);

  // Unassigned subs (no budgetId) for the active month
  const unassignedSubs = useMemo(() => {
    const ym = activeSubsMonth;
    const monthTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(ym) && !t.budgetId);
    const seen = new Map<string, { key: string; description: string; amount: number; date: string; group: string; cancelled: boolean; isDuplicate: boolean }>();
    for (const t of monthTxs) {
      const desc = (t.description ?? '').toLowerCase();
      let matchedKey: string | null = null;
      let matchedGroup = 'Other';
      outer: for (const [group, { keywords }] of Object.entries(SUB_GROUPS)) {
        for (const kw of keywords) {
          if (desc.includes(kw)) { matchedKey = kw; matchedGroup = group; break outer; }
        }
      }
      if (!matchedKey || seen.has(matchedKey)) continue;
      seen.set(matchedKey, {
        key: matchedKey,
        description: t.description ?? matchedKey,
        amount: t.amount,
        date: t.date,
        group: matchedGroup,
        cancelled: !!cancelledSubs[matchedKey] && cancelledSubs[matchedKey] <= ym,
        isDuplicate: duplicateSubs.has(matchedKey),
      });
    }
    return Array.from(seen.values());
  }, [transactions, activeSubsMonth, cancelledSubs, duplicateSubs]);

  // Calendar charge days for active month
  const calChargeDays = useMemo(() => {
    const ym = activeSubsMonth;
    const days: Record<number, { names: string[]; urgent: boolean }> = {};
    const today = new Date();
    const todayDay = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') === ym ? today.getDate() : -1;
    const monthTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(ym));
    for (const t of monthTxs) {
      const desc = (t.description ?? '').toLowerCase();
      for (const [, { keywords }] of Object.entries(SUB_GROUPS)) {
        for (const kw of keywords) {
          if (desc.includes(kw)) {
            const day = parseInt(t.date.split('-')[2], 10);
            if (!days[day]) days[day] = { names: [], urgent: false };
            const short = (t.description ?? kw).split(' ')[0].substring(0, 7);
            if (!days[day].names.includes(short)) days[day].names.push(short);
            if (todayDay > 0 && day >= todayDay && day <= todayDay + 5) days[day].urgent = true;
            break;
          }
        }
      }
    }
    return days;
  }, [transactions, activeSubsMonth]);

  const monthsWithData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthMap: Record<string, { income: number; expenses: number; transactions: Transaction[] }> = {};
    for (const t of transactions) {
      const rawDate = t.date.split('T')[0];
      const parts = rawDate.split('-');
      const parsedYear = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      if (isNaN(month)) continue;
      // Remap corrupt years (e.g. 1901) to current year — must match yearlyGroupedData logic
      const year = (isNaN(parsedYear) || parsedYear < 2000) ? currentYear : parsedYear;
      const key = getMonthKey(year, month); // month is already 0-indexed
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expenses: 0, transactions: [] };
      }
      if (t.type === 'income') {
        monthMap[key].income += t.amount;
      } else {
        monthMap[key].expenses += t.amount;
      }
      monthMap[key].transactions.push(t);
    }
    return Object.entries(monthMap)
      .map(([key, data]) => ({
        key,
        income: data.income,
        expenses: data.expenses,
        cashflow: data.income - data.expenses,
        transactions: data.transactions,
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.key.split(' ');
        const [bMonth, bYear] = b.key.split(' ');
        const dateA = new Date(`${aMonth} 1, ${aYear}`).getTime();
        const dateB = new Date(`${bMonth} 1, ${bYear}`).getTime();
        return dateB - dateA;
      });
  }, [transactions, getMonthKey]);

  // Always show current calendar month — never auto-jump to an imported statement's month
  const thisMonthData = monthsWithData.find(m => m.key === thisMonth) ?? null;
  const activeMonthLabel = thisMonth;
  const totalIncome = thisMonthData?.income ?? 0;
  const totalExpenses = thisMonthData?.expenses ?? 0;

  // Compute budget spent from the active month's transactions only (not the stored cumulative value)
  const monthlySpentByBudgetId = useMemo(() => {
    const map: Record<number, number> = {};
    const ym = activeSubsMonth || thisMonth;
    const monthTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(ym));
    for (const t of monthTxs) {
      if (t.budgetId != null) {
        // Directly assigned to a budget
        map[t.budgetId] = (map[t.budgetId] ?? 0) + t.amount;
      } else {
        // No budgetId — try to match via subscription keywords assigned to a budget
        const desc = (t.description ?? '').toLowerCase();
        outer: for (const [group, { keywords }] of Object.entries(SUB_GROUPS)) {
          void group;
          for (const kw of keywords) {
            if (desc.includes(kw)) {
              // Find which budget has this subscription assigned
              for (const budget of budgets) {
                const subList = subsByBudgetId[budget.id] ?? [];
                if (subList.some(s => s.key === kw)) {
                  map[budget.id] = (map[budget.id] ?? 0) + t.amount;
                  break outer;
                }
              }
              break outer;
            }
          }
        }
      }
    }
    return map;
  }, [transactions, activeSubsMonth, thisMonth, subsByBudgetId, budgets]);
  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const yearlyGroupedData = useMemo(() => {
    const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
    const QUARTER_MONTHS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
    const currentYear = new Date().getFullYear();
    const yearMonthMap: Record<number, Record<string, { income: number; expenses: number; transactions: Transaction[] }>> = {};
    for (const t of transactions) {
      const rawDate = t.date.split('T')[0];
      const parts = rawDate.split('-');
      const parsedYear = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (isNaN(month) || month < 1 || month > 12) continue;
      const year = (isNaN(parsedYear) || parsedYear < 2000) ? currentYear : parsedYear;
      const monthKey = getMonthKey(year, month - 1);
      if (!yearMonthMap[year]) yearMonthMap[year] = {};
      if (!yearMonthMap[year][monthKey]) yearMonthMap[year][monthKey] = { income: 0, expenses: 0, transactions: [] };
      if (t.type === 'income') {
        yearMonthMap[year][monthKey].income += t.amount;
      } else {
        yearMonthMap[year][monthKey].expenses += t.amount;
      }
      yearMonthMap[year][monthKey].transactions.push(t);
    }
    if (transactions.length > 0 && !yearMonthMap[currentYear]) {
      yearMonthMap[currentYear] = {};
    }
    const years = Object.keys(yearMonthMap).map(Number).sort((a, b) => b - a);
    return years.map(year => {
      const isCurrent = year === currentYear;
      const monthMap = yearMonthMap[year] || {};
      const quarters = [1, 2, 3, 4].map((q, qi) => {
        let months;
        if (isCurrent) {
          months = QUARTER_MONTHS[qi].map(m0 => {
            const key = getMonthKey(year, m0);
            const data = monthMap[key] || { income: 0, expenses: 0, transactions: [] };
            return {
              key,
              income: data.income,
              expenses: data.expenses,
              cashflow: data.income - data.expenses,
              transactions: data.transactions,
            };
          });
        } else {
          months = QUARTER_MONTHS[qi]
            .map(m0 => {
              const key = getMonthKey(year, m0);
              const data = monthMap[key];
              if (!data) return null;
              return {
                key,
                income: data.income,
                expenses: data.expenses,
                cashflow: data.income - data.expenses,
                transactions: data.transactions,
              };
            })
            .filter((m): m is NonNullable<typeof m> => m !== null);
        }
        const qIncome = months.reduce((s, m) => s + m.income, 0);
        const qExpenses = months.reduce((s, m) => s + m.expenses, 0);
        return {
          quarter: q,
          label: QUARTER_LABELS[q - 1],
          income: qIncome,
          expenses: qExpenses,
          cashflow: qIncome - qExpenses,
          months,
          hasData: months.some(m => m.transactions.length > 0),
        };
      });
      return { year, isCurrent, quarters };
    });
  }, [transactions, getMonthKey]);

  // ── Widget & notification sync ──────────────────────────────────────────────
  // Runs whenever transactions or budgets change.
  useEffect(() => {
    // 1. Push latest figures to the home-screen widget
    updateBudgetWidget({
      monthLabel: thisMonth,
      income: totalIncome,
      expenses: totalExpenses,
      cashflow: totalIncome - totalExpenses,
    });

    // 2. Fire budget-threshold alerts for any category that has crossed 80 % or 100 %
    for (const budget of budgets) {
      const spent = monthlySpentByBudgetId[budget.id] ?? 0;
      if (budget.amount > 0) {
      }
    }
  }, [transactions, budgets]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleQuarter = (key: string) => {
    setExpandedQuarters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleArchiveYear = (year: number) => {
    setExpandedArchiveYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year); else next.add(year);
      return next;
    });
  };

  const openMonthDetail = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setMonthDetailVisible(true);
  };

  const selectedMonthData = monthsWithData.find(m => m.key === selectedMonthKey);
  const selectedMonthExpenses = (selectedMonthData?.transactions || [])
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const selectedMonthIncomes = (selectedMonthData?.transactions || [])
    .filter(t => t.type === 'income')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openBudgetDetail = (budget: Budget) => {
    setSelectedBudgetForDetail(budget);
    setBudgetDetailVisible(true);
  };

  const budgetDetailTransactions = selectedBudgetForDetail
    ? (thisMonthData?.transactions ?? [])
        .filter(t => t.budgetId === selectedBudgetForDetail.id && t.type === 'expense')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const openBudgetModal = (budget?: Budget) => {
    if (budget) {
      setEditingId(budget.id);
      setBudgetName(budget.name);
      setBudgetAmount(budget.amount.toString());
      setBudgetIcon(budget.icon);
      setBudgetRecurring(budget.recurring || false);
      setBudgetDate(budget.date || '');
    } else {
      setEditingId(null);
      setBudgetName('');
      setBudgetAmount('');
      setBudgetIcon('💰');
      setBudgetRecurring(false);
      setBudgetDate('');
    }
    setBudgetModalVisible(true);
  };

  const handleSaveBudget = () => {
    if (!budgetName.trim() || !budgetAmount) return;

    const budgetData: Omit<Budget, 'id' | 'spent'> = {
      name: budgetName.trim(),
      amount: parseFloat(budgetAmount),
      icon: budgetIcon,
      recurring: budgetRecurring,
      date: budgetDate || undefined,
    };

    if (editingId) {
      updateBudget(editingId, budgetData);
    } else {
      addBudget(budgetData);
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBudgetModalVisible(false);
  };

  const handleDeleteBudget = (id: number, name: string) => {
    Alert.alert('Delete Budget', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBudget(id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const openTransactionModal = (transaction?: Transaction, budgetId?: number, type?: 'income' | 'expense') => {
    if (transaction) {
      setEditingId(transaction.id);
      setTransactionAmount(transaction.amount.toString());
      setTransactionDesc(transaction.description || '');
      setTransactionDate(transaction.date);
      setTransactionType(transaction.type);
      setSelectedBudgetId(transaction.budgetId || null);
    } else {
      setEditingId(null);
      setTransactionAmount('');
      setTransactionDesc('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setTransactionType(type || 'expense');
      setSelectedBudgetId(budgetId || null);
    }
    setTransactionModalVisible(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionAmount) return;

    const transactionData: Omit<Transaction, 'id'> = {
      amount: parseFloat(transactionAmount),
      description: transactionDesc,
      date: transactionDate || new Date().toISOString().split('T')[0],
      type: transactionType,
      budgetId: transactionType === 'expense' ? selectedBudgetId || undefined : undefined,
    };

    if (editingId) {
      updateTransaction(editingId, transactionData);
    } else {
      addTransaction(transactionData);
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTransactionModalVisible(false);
  };

  const handleDeleteTransaction = (id: number) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const openDebtModal = (debt?: Debt) => {
    if (debt) {
      setEditingId(debt.id);
      setDebtName(debt.name);
      setDebtAmount(debt.amount.toString());
      setDebtInterest(debt.interest.toString());
      setDebtPayment(debt.payment.toString());
      setDebtDue(debt.due);
      setDebtDueDay(debt.dueDay || 1);
    } else {
      setEditingId(null);
      setDebtName('');
      setDebtAmount('');
      setDebtInterest('');
      setDebtPayment('');
      setDebtDue('');
      setDebtDueDay(1);
    }
    setDebtModalVisible(true);
  };

  const handleSaveDebt = () => {
    if (!debtName.trim() || !debtAmount) return;
    const amt = parseFloat(debtAmount);

    const debtData: Omit<Debt, 'id'> = {
      name: debtName.trim(),
      amount: amt,
      originalAmount: editingId ? (debts.find(d => d.id === editingId)?.originalAmount ?? amt) : amt,
      interest: parseFloat(debtInterest) || 0,
      payment: parseFloat(debtPayment) || 0,
      due: debtDue,
      dueDay: debtDueDay,
      amountPaid: editingId ? (debts.find(d => d.id === editingId)?.amountPaid ?? 0) : 0,
      paymentHistory: editingId ? (debts.find(d => d.id === editingId)?.paymentHistory ?? []) : [],
    };

    if (editingId) {
      updateDebt(editingId, debtData);
    } else {
      addDebt(debtData);
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDebtModalVisible(false);
  };

  const handleDeleteDebt = (id: number, name: string) => {
    Alert.alert('Delete Debt', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDebt(id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleMakePayment = () => {
    if (!debtPaymentTarget) return;
    const payAmt = parseFloat(debtPaymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) return;

    const debt = debtPaymentTarget;
    const monthlyRate = debt.interest / 100 / 12;
    const interestCharge = parseFloat(Math.min(payAmt, debt.amount * monthlyRate).toFixed(2));
    const principalCharge = parseFloat(Math.max(0, payAmt - interestCharge).toFixed(2));
    // Always reduce balance by full payment — the user paid it, it comes off the debt
    const newBalance = parseFloat(Math.max(0, debt.amount - payAmt).toFixed(2));
    // Preserve originalAmount — reconstruct it for debts created before this field existed
    const originalAmount = debt.originalAmount || (debt.amount + (debt.amountPaid ?? 0));

    const payment: DebtPayment = {
      date: new Date().toISOString().split('T')[0],
      amount: payAmt,
      principal: principalCharge,
      interest: interestCharge,
    };

    updateDebt(debt.id, {
      amount: newBalance,
      originalAmount,
      amountPaid: (debt.amountPaid ?? 0) + payAmt,
      paymentHistory: [...(debt.paymentHistory ?? []), payment],
    });

    if (selectedDebt?.id === debt.id) {
      setSelectedDebt(prev => prev ? {
        ...prev,
        amount: newBalance,
        originalAmount,
        amountPaid: (prev.amountPaid ?? 0) + payAmt,
        paymentHistory: [...(prev.paymentHistory ?? []), payment],
      } : null);
    }

    setDebtPaymentModalVisible(false);
    setDebtPaymentAmount('');
    setDebtPaymentTarget(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openSavingsModal = (savingsItem?: Savings) => {
    if (savingsItem) {
      setEditingId(savingsItem.id);
      setSavingsName(savingsItem.name);
      setSavingsTarget(savingsItem.target.toString());
      setSavingsCurrent(savingsItem.current.toString());
      setSavingsMonthly(savingsItem.monthly.toString());
      setSavingsDeadline(savingsItem.deadline);
    } else {
      setEditingId(null);
      setSavingsName('');
      setSavingsTarget('');
      setSavingsCurrent('');
      setSavingsMonthly('');
      setSavingsDeadline('');
    }
    setSavingsModalVisible(true);
  };

  const handleSaveSavings = () => {
    if (!savingsName.trim() || !savingsTarget) return;

    const savingsData: Omit<Savings, 'id'> = {
      name: savingsName.trim(),
      target: parseFloat(savingsTarget),
      current: parseFloat(savingsCurrent) || 0,
      monthly: parseFloat(savingsMonthly) || 0,
      deadline: savingsDeadline,
    };

    if (editingId) {
      updateSavings(editingId, savingsData);
    } else {
      addSavings(savingsData);
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavingsModalVisible(false);
  };

  const handleDeleteSavings = (id: number, name: string) => {
    Alert.alert('Delete Savings Goal', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSavings(id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };



  const finishImport = (
    imported: number,
    skipped: number,
    dupCount: number,
    errors: string[],
    newTxs: Array<{ amount: number; description: string; date: string; type: 'income' | 'expense'; budgetId?: number }>,
  ) => {
    const parts: string[] = [`Imported ${imported} transaction${imported !== 1 ? 's' : ''}`];
    if (dupCount > 0) parts.push(`${dupCount} duplicate${dupCount !== 1 ? 's' : ''} skipped`);
    if (skipped > 0) parts.push(`${skipped} row${skipped !== 1 ? 's' : ''} skipped`);
    setUploadStatus(parts.join(' · '));
    setIsUploading(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (skipped > 0 && errors.length > 0) {
      setTimeout(() => {
        Alert.alert(
          `${skipped} Row${skipped !== 1 ? 's' : ''} Skipped`,
          errors.join('\n\n'),
          [{ text: 'OK' }]
        );
      }, 500);
    }
    // Run advisor analysis on combined transactions (existing + newly imported)
    if (imported > 0) {
      const combined = [...transactions, ...newTxs];
      const insights = analyzeExpenses(combined, budgets);
      setExpenseInsights(insights);
      setTimeout(() => {
        setUploadModalVisible(false);
        setUploadStatus('');
        if (insights.length > 0) {
          setInsightsModalVisible(true);
        }
      }, 2000);
    } else {
      setTimeout(() => {
        setUploadModalVisible(false);
        setUploadStatus('');
      }, 2500);
    }
  };

  const processCSVText = (text: string) => {
    try {
      setUploadStatus('Processing transactions...');
      console.log('processCSVText: CSV text length:', text.length);
      console.log('processCSVText: CSV preview:', text.substring(0, 500));

      const result = processCSVData(text, budgets);
      console.log('processCSVText: Import results:', { imported: result.imported.length, skipped: result.skipped, errors: result.errors, endingBalance: result.endingBalance });
      if (result.endingBalance !== null) {
        setStatementEndingBalance(result.endingBalance);
        AsyncStorage.setItem('statementEndingBalance', String(result.endingBalance));
      }
      if (Object.keys(result.monthlyEndingBalances).length > 0) {
        setMonthlyEndingBalances(prev => {
          const updated = { ...prev, ...result.monthlyEndingBalances };
          AsyncStorage.setItem('monthlyEndingBalances', JSON.stringify(updated));
          return updated;
        });
      }

      if (result.imported.length > 0) {
        const months = new Set(result.imported.map(t => t.date.substring(0, 7)));
        console.log('processCSVText: Imported months:', [...months].sort());
        for (const m of [...months].sort()) {
          const count = result.imported.filter(t => t.date.startsWith(m)).length;
          console.log(`  ${m}: ${count} transactions`);
        }
      }

      if (result.errors.length > 0 && result.imported.length === 0) {
        setUploadStatus(result.errors[0]);
        setIsUploading(false);
        return;
      }

      if (result.imported.length === 0) {
        const hint = result.errors.length > 0 ? `\nDebug: ${result.errors.join(', ')}` : '';
        setUploadStatus(
          `No transactions imported${result.skipped > 0 ? ` (${result.skipped} rows skipped)` : ''}. Check CSV format.${hint}`
        );
        setIsUploading(false);
        return;
      }

      const existingKeys = new Set(
        transactions.map(t => `${t.date}|${t.amount}|${t.type}`)
      );
      const newTransactions = result.imported.filter(
        t => !existingKeys.has(`${t.date}|${t.amount}|${t.type}`)
      );
      const dupCount = result.imported.length - newTransactions.length;
      console.log('processCSVText: dedup: new =', newTransactions.length, ', duplicates skipped =', dupCount);

      for (const t of newTransactions) {
        addTransaction(t);
      }

      finishImport(newTransactions.length, result.skipped, dupCount, result.errors, newTransactions);
    } catch (err) {
      console.log('processCSVText error:', err);
      setUploadStatus(`Error processing CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const triggerWebFilePicker = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt,.pdf,.xls,.xlsx,text/csv,text/plain,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = (event: any) => {
        const selectedFile = event.target?.files?.[0];
        if (!selectedFile) {
          console.log('No file selected');
          document.body.removeChild(input);
          return;
        }

        console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size);

        setIsUploading(true);
        setUploadStatus('Reading file...');

        const webFileName = selectedFile.name?.toLowerCase() || '';

        if (webFileName.endsWith('.pdf')) {
          const pdfReader = new FileReader();
          pdfReader.onload = (e) => {
            try {
              const binaryStr = e.target?.result as string;
              console.log('PDF binary read, length:', binaryStr?.length);
              document.body.removeChild(input);
              if (!binaryStr || binaryStr.length === 0) {
                setUploadStatus('PDF file appears to be empty');
                setIsUploading(false);
                return;
              }
              setUploadStatus('Extracting transactions from PDF...');
              const extracted = extractTextFromPDF(binaryStr);
              console.log('PDF extracted text length:', extracted.length);
              if (!extracted || extracted.trim().length === 0) {
                setUploadStatus('Could not extract text from this PDF. The PDF may be image-based (scanned). Please try exporting as CSV from your bank\'s website instead.');
                setIsUploading(false);
                return;
              }
              processCSVText(extracted);
            } catch (err) {
              console.log('PDF extraction error:', err);
              setUploadStatus('Error reading PDF. Please try exporting as CSV from your bank\'s website.');
              setIsUploading(false);
              document.body.removeChild(input);
            }
          };
          pdfReader.onerror = () => {
            setUploadStatus('Error reading PDF file.');
            setIsUploading(false);
            document.body.removeChild(input);
          };
          pdfReader.readAsBinaryString(selectedFile);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          console.log('File read complete, length:', text?.length);
          document.body.removeChild(input);
          if (!text || text.trim().length === 0) {
            setUploadStatus('File appears to be empty');
            setIsUploading(false);
            return;
          }
          processCSVText(text);
        };
        reader.onerror = (err) => {
          console.log('FileReader error:', err);
          setUploadStatus('Error reading file. Please try again.');
          setIsUploading(false);
          document.body.removeChild(input);
        };
        reader.readAsText(selectedFile);
      };

      input.click();
    } catch (err) {
      console.log('Web file picker error:', err);
      setUploadStatus(`Error opening file picker: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const readFileContent = async (uri: string, isPDF: boolean): Promise<string> => {
    console.log('readFileContent: trying fetch for URI:', uri);
    try {
      const response = await fetch(uri);
      if (isPDF) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binaryStr = '';
        for (let i = 0; i < bytes.length; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        console.log('readFileContent: fetch binary success, length:', binaryStr.length);
        return binaryStr;
      }
      const text = await response.text();
      console.log('readFileContent: fetch text success, length:', text.length);
      return text;
    } catch (err) {
      console.log('readFileContent: fetch failed:', err);
    }

    console.log('readFileContent: trying FileSystem.File...');
    try {
      const fileObj = new FileSystem.File(uri);
      if (fileObj.exists) {
        const content = await fileObj.text();
        console.log('readFileContent: FileSystem.File success, length:', content.length);
        return content;
      }
    } catch (err) {
      console.log('readFileContent: FileSystem.File failed:', err);
    }

    throw new Error('All file reading methods failed');
  };

  const handleUploadStatement = async () => {
    if (Platform.OS === 'web') {
      setUploadModalVisible(true);
      triggerWebFilePicker();
      return;
    }

    try {
      console.log('Opening DocumentPicker...');

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/csv',
          'text/plain',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'public.comma-separated-values-text',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('DocumentPicker result:', JSON.stringify(result));

      if (result.canceled) {
        console.log('User cancelled picker');
        return;
      }

      const file = result.assets?.[0];
      if (!file || !file.uri) {
        Alert.alert('Error', 'No file was selected. Please try again.');
        return;
      }

      const fileName = (file.name || '').toLowerCase();
      const mimeType = (file.mimeType || '').toLowerCase();
      console.log('File picked:', fileName, mimeType, file.uri, 'size:', file.size);

      const isPDF = fileName.endsWith('.pdf') || mimeType === 'application/pdf';

      setUploadModalVisible(true);
      setIsUploading(true);
      setUploadStatus('Reading file...');

      let text = '';
      try {
        text = await readFileContent(file.uri, isPDF);
      } catch (err) {
        console.log('All read methods failed:', err);
        setUploadStatus('Could not read the file. Make sure it is a valid CSV/text file and try again.');
        setIsUploading(false);
        return;
      }

      if (!text || text.trim().length === 0) {
        setUploadStatus('File appears to be empty. Please try a different file.');
        setIsUploading(false);
        return;
      }

      if (isPDF || isPDFContent(text)) {
        setUploadStatus('Extracting transactions from PDF...');
        console.log('Detected PDF content, extracting text length:', text.length);
        try {
          const extracted = extractTextFromPDF(text);
          console.log('PDF extracted text length:', extracted.length);
          console.log('PDF extracted preview:', extracted.substring(0, 300));
          if (!extracted || extracted.trim().length === 0) {
            setUploadStatus('Could not extract transactions from this PDF. It may be image-based (scanned). Please try exporting as CSV from your bank\'s website.');
            setIsUploading(false);
            return;
          }
          processCSVText(extracted);
        } catch (err) {
          console.log('PDF extraction error:', err);
          setUploadStatus('Error processing PDF. Please try exporting as CSV from your bank\'s website.');
          setIsUploading(false);
        }
        return;
      }

      processCSVText(text);
    } catch (error) {
      console.log('Upload error:', error);
      setUploadStatus(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', margin: 12, gap: 8, padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: activePage === 'budget' ? Colors.primary : 'transparent' }}
          onPress={() => setActivePage('budget')}
        >
          <Text style={{ color: activePage === 'budget' ? '#fff' : Colors.textDim, fontWeight: '600', fontSize: 14 }}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: activePage === 'subscriptions' ? Colors.primary : 'transparent' }}
          onPress={() => setActivePage('subscriptions')}
        >
          <Text style={{ color: activePage === 'subscriptions' ? '#fff' : Colors.textDim, fontWeight: '600', fontSize: 14 }}>Subscriptions</Text>
        </TouchableOpacity>
      </View>

      {activePage === 'budget' ? (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 {activeMonthLabel}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <TrendingUp size={20} color={Colors.success} />
              </View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                +${totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <TrendingDown size={20} color={Colors.danger} />
              </View>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
                -${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.netContainer}>
            <Text style={styles.netLabel}>Cashflow</Text>
            <Text style={[styles.netAmount, { color: netCashflow >= 0 ? Colors.success : Colors.danger }]}>
              {netCashflow >= 0 ? '+' : '-'}${Math.abs(netCashflow).toFixed(2)}
            </Text>
          </View>
          {statementEndingBalance !== null && (
            <View style={[styles.netContainer, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 4, paddingTop: 12 }]}>
              <Text style={styles.netLabel}>Left Over in Account</Text>
              <Text style={[styles.netAmount, { color: Colors.success }]}>
                ${statementEndingBalance.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Zero-Based Budget Assignment Panel */}
        {(() => {
          const goal = parseFloat(monthlyIncomeGoal) || 0;
          const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
          const unassigned = goal - totalBudgeted;
          const pct = goal > 0 ? Math.min(1, totalBudgeted / goal) : 0;
          const isFullyAssigned = goal > 0 && Math.abs(unassigned) < 0.01;
          const isOverAssigned = unassigned < -0.01;
          const barColor = isOverAssigned ? Colors.danger : isFullyAssigned ? Colors.success : Colors.primary;

          return (
            <View style={zbStyles.card}>
              <View style={zbStyles.cardHeader}>
                <View style={zbStyles.cardHeaderLeft}>
                  <DollarSign size={16} color={Colors.primary} />
                  <Text style={zbStyles.cardTitle}>Assign Every Dollar</Text>
                </View>
                {isFullyAssigned && <CheckCircle size={16} color={Colors.success} />}
              </View>

              <Text style={zbStyles.cardSubtitle}>
                Set your monthly income, then assign every dollar to a budget category. When nothing is left unassigned, your budget is complete.
              </Text>

              {/* Income goal row */}
              <View style={zbStyles.incomeRow}>
                <Text style={zbStyles.incomeLabel}>Monthly income goal</Text>
                {incomeGoalEditing ? (
                  <View style={zbStyles.incomeInputRow}>
                    <Text style={zbStyles.currencyPrefix}>$</Text>
                    <TextInput
                      style={zbStyles.incomeInput}
                      value={incomeGoalDraft}
                      onChangeText={setIncomeGoalDraft}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                      placeholder="0"
                      placeholderTextColor={Colors.textDim}
                    />
                    <TouchableOpacity
                      style={zbStyles.incomeConfirm}
                      onPress={() => {
                        saveIncomeGoal(incomeGoalDraft);
                        setIncomeGoalEditing(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={zbStyles.incomeConfirmText}>Set</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={zbStyles.incomeValueBtn}
                    onPress={() => { setIncomeGoalDraft(monthlyIncomeGoal); setIncomeGoalEditing(true); }}
                  >
                    <Text style={[zbStyles.incomeValue, !monthlyIncomeGoal && { color: Colors.textDim }]}>
                      {monthlyIncomeGoal ? `$${parseFloat(monthlyIncomeGoal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Tap to set'}
                    </Text>
                    <Edit2 size={12} color={Colors.textDim} />
                  </TouchableOpacity>
                )}
              </View>

              {goal > 0 && (
                <>
                  {/* Assignment bar */}
                  <View style={zbStyles.barBg}>
                    <View style={[zbStyles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
                  </View>

                  {/* Stats row */}
                  <View style={zbStyles.statsRow}>
                    <View style={zbStyles.statItem}>
                      <Text style={[zbStyles.statValue, { color: Colors.primary }]}>${totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      <Text style={zbStyles.statLabel}>Budgeted</Text>
                    </View>
                    <View style={zbStyles.statDivider} />
                    <View style={zbStyles.statItem}>
                      <Text style={[zbStyles.statValue, { color: barColor }]}>
                        {isOverAssigned ? '-' : ''}${Math.abs(unassigned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={zbStyles.statLabel}>{isOverAssigned ? 'Over budget' : isFullyAssigned ? 'Fully assigned!' : 'Left to assign'}</Text>
                    </View>
                    <View style={zbStyles.statDivider} />
                    <View style={zbStyles.statItem}>
                      <Text style={[zbStyles.statValue, { color: Colors.text }]}>{Math.round(pct * 100)}%</Text>
                      <Text style={zbStyles.statLabel}>Assigned</Text>
                    </View>
                  </View>

                  {isOverAssigned && (
                    <View style={zbStyles.warningBanner}>
                      <TriangleAlert size={14} color={Colors.danger} />
                      <Text style={zbStyles.warningText}>You've budgeted ${Math.abs(unassigned).toFixed(2)} more than your income goal. Reduce a category or raise your income.</Text>
                    </View>
                  )}

                  {isFullyAssigned && (
                    <View style={zbStyles.successBanner}>
                      <CheckCircle size={14} color={Colors.success} />
                      <Text style={zbStyles.successText}>Every dollar is assigned. Your zero-based budget is complete.</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        <View style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>📈 Monthly Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Savings Rate</Text>
              <Text style={styles.metricValue}>{savingsRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Debt</Text>
              <Text style={[styles.metricValue, { color: Colors.danger }]}>
                ${totalDebt.toFixed(0)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Savings Progress</Text>
              <Text style={[styles.metricValue, { color: Colors.success }]}>
                ${totalSavingsCurrent.toFixed(0)}/${totalSavingsTarget.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openTransactionModal(undefined, undefined, 'income')}
          >
            <LinearGradient colors={[Colors.success, '#34d399']} style={styles.actionButtonGradient}>
              <Plus size={18} color="white" />
              <Text style={styles.actionButtonText}>Income</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openBudgetModal()}
          >
            <View style={styles.actionButtonSecondary}>
              <Plus size={18} color={Colors.text} />
              <Text style={styles.actionButtonTextSecondary}>Budget</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.uploadArea}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadStatement}
          >
            <Upload size={18} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Bank Statement</Text>
          </TouchableOpacity>
          <View style={styles.uploadSecondaryRow}>
            <TouchableOpacity
              style={[styles.uploadSecondaryButton, { borderColor: Colors.primary }]}
              onPress={() => setWidgetModalVisible(true)}
            >
              <Bell size={15} color={Colors.primary} />
              <Text style={[styles.uploadSecondaryText, { color: Colors.primary }]}>Widgets</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadSecondaryButton, expenseInsights.length > 0 && styles.advisorButtonActive]}
              onPress={() => {
                const combined = [...transactions];
                const insights = analyzeExpenses(combined, budgets);
                setExpenseInsights(insights);
                setInsightsModalVisible(true);
              }}
            >
              <Lightbulb size={15} color={expenseInsights.length > 0 ? '#f59e0b' : Colors.textDim} />
              <Text style={[styles.uploadSecondaryText, expenseInsights.length > 0 && { color: '#f59e0b' }]}>
                {expenseInsights.length > 0 ? `Advisor (${expenseInsights.length})` : 'Advisor'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadSecondaryButton, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
              onPress={() => {
                Alert.alert(
                  'Clear All Data',
                  'This will delete all transactions and reset budget spending to $0. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: () => {
                        clearAllTransactions();
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      },
                    },
                  ]
                );
              }}
            >
              <RotateCcw size={15} color={Colors.danger} />
              <Text style={[styles.uploadSecondaryText, { color: Colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Combined Budget + Subscriptions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Budget & Subscriptions</Text>
            <TouchableOpacity onPress={() => openBudgetModal()} style={styles.addButton}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Month selector */}
          {subsMonthOptions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
              {subsMonthOptions.map(ym => (
                <TouchableOpacity
                  key={ym}
                  onPress={() => setSubsViewMonth(ym)}
                  style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: activeSubsMonth === ym ? Colors.primary : 'transparent', borderWidth: 1, borderColor: activeSubsMonth === ym ? Colors.primary : Colors.border }}
                >
                  <Text style={{ fontSize: 12, color: activeSubsMonth === ym ? '#fff' : Colors.textDim, fontWeight: activeSubsMonth === ym ? '700' : '400' }}>{ym}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Calendar charge strip */}
          {Object.keys(calChargeDays).length > 0 && (() => {
            const days = Object.keys(calChargeDays).map(Number).sort((a, b) => a - b);
            const allSubsTotal = subsForMonth.filter(s => !s.cancelled).reduce((sum, s) => sum + s.amount, 0);
            return (
              <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textDim }}>📅 Subscription charge days</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.danger }}>${allSubsTotal.toFixed(2)}/mo</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                  {days.map(day => {
                    const info = calChargeDays[day];
                    return (
                      <View key={day} style={{ width: 44, backgroundColor: info.urgent ? '#2d1515' : '#1a1a2a', borderWidth: 1, borderColor: info.urgent ? '#7f1d1d60' : '#2a2a3a', borderRadius: 10, padding: 6, alignItems: 'center', gap: 3 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: info.urgent ? Colors.danger : '#a78bfa' }}>{day}</Text>
                        <Text style={{ fontSize: 8, color: info.urgent ? Colors.danger : '#6b7280', textAlign: 'center' }} numberOfLines={1}>{info.names[0] ?? ''}</Text>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: info.urgent ? Colors.danger : '#7c3aed' }} />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })()}

          {/* Summary bar */}
          {(() => {
            const selectedMonthTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(activeSubsMonth));
            const totalSpent = selectedMonthTxs.reduce((s, t) => s + t.amount, 0);
            const activeSubsTotal = subsForMonth.filter(s => !s.cancelled).reduce((sum, s) => sum + s.amount, 0);
            const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
            if (totalSpent === 0 && activeSubsTotal === 0) return null;
            return (
              <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, marginBottom: 14, flexDirection: 'row' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.danger }}>${totalSpent.toFixed(0)}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>Total spent</Text>
                </View>
                <View style={{ width: 1, backgroundColor: Colors.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#a78bfa' }}>${activeSubsTotal.toFixed(0)}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>Subscriptions</Text>
                </View>
                <View style={{ width: 1, backgroundColor: Colors.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: totalBudget - totalSpent >= 0 ? Colors.success : Colors.danger }}>${Math.abs(totalBudget - totalSpent).toFixed(0)}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>{totalBudget - totalSpent >= 0 ? 'Remaining' : 'Over budget'}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: Colors.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>{subsForMonth.filter(s => !s.cancelled).length}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>Active subs</Text>
                </View>
              </View>
            );
          })()}

          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets set up yet</Text>
          ) : (
            budgets.map((budget, idx) => {
              const spentThisMonth = monthlySpentByBudgetId[budget.id] ?? 0;
              const percent = Math.min(100, Math.round((spentThisMonth / budget.amount) * 100));
              const isOverBudget = spentThisMonth > budget.amount;
              const budgetSubs = subsByBudgetId[budget.id] ?? [];

              return (
                <View key={`budget-${budget.id}-${idx}`} style={[styles.budgetCard, { overflow: 'hidden' }]}>
                  {/* Budget header — tappable to open detail */}
                  <TouchableOpacity onPress={() => openBudgetDetail(budget)} activeOpacity={0.7} style={{ padding: 14, paddingBottom: 10 }}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetInfo}>
                        <Text style={styles.budgetIcon}>{budget.icon}</Text>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.budgetName}>{budget.name}</Text>
                            {budgetSubs.filter(s => !s.cancelled).length > 0 && (
                              <View style={{ backgroundColor: '#1e1629', borderWidth: 1, borderColor: '#4c1d9550', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a78bfa' }}>
                                  {budgetSubs.filter(s => !s.cancelled).length} sub{budgetSubs.filter(s => !s.cancelled).length !== 1 ? 's' : ''}
                                </Text>
                              </View>
                            )}
                            {isOverBudget && (
                              <View style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d50', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.danger }}>OVER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.budgetSpent}>${spentThisMonth.toFixed(0)} / ${budget.amount.toFixed(0)}</Text>
                        </View>
                      </View>
                      <View style={styles.budgetActions}>
                        <TouchableOpacity onPress={() => openBudgetModal(budget)} style={styles.iconButton}>
                          <Edit2 size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteBudget(budget.id, budget.name)} style={styles.iconButton}>
                          <Trash2 size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(100, percent)}%`, backgroundColor: isOverBudget ? Colors.danger : Colors.primary }]} />
                    </View>
                  </TouchableOpacity>

                  {/* Subscription sub-rows */}
                  {budgetSubs.length > 0 && (
                    <View style={{ backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: Colors.textDim, marginBottom: 6, letterSpacing: 0.3 }}>📡 SUBSCRIPTIONS IN THIS CATEGORY</Text>
                      {budgetSubs.map((sub, si) => {
                        const isExpanded = expandedSubKeys.has(sub.key);
                        const allCharges = (allTxsBySubKey[sub.key] ?? []).filter(t => t.date.startsWith(activeSubsMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const groupColor = SUB_GROUPS[sub.group]?.color ?? '#9ca3af';
                        const subCount = subCountByKeyMonth[sub.key]?.[activeSubsMonth] ?? 1;
                        return (
                          <View key={`sub-${si}`} style={{ borderBottomWidth: si < budgetSubs.length - 1 ? 1 : 0, borderBottomColor: Colors.border, paddingVertical: 8 }}>
                            {/* Sub row top */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: sub.cancelled ? 0.45 : 1 }}>
                              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: groupColor, flexShrink: 0 }} />
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '600', color: sub.cancelled ? Colors.textDim : Colors.text, textDecorationLine: sub.cancelled ? 'line-through' : 'none' }}>
                                    {sub.description}
                                  </Text>
                                  {subCount > 1 && !sub.cancelled && (
                                    <View style={{ backgroundColor: '#1e1a2e', borderWidth: 1, borderColor: '#6d28d960', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#a78bfa' }}>{subCount}×</Text>
                                    </View>
                                  )}
                                  {sub.isDuplicate && !sub.cancelled && (
                                    <View style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d60', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                                      <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.danger }}>⚠ double charge?</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 1 }}>
                                  {sub.cancelled ? `Cancelled · last ${sub.date}` : `Last charged ${sub.date}`}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: sub.cancelled ? Colors.textDim : Colors.danger, textDecorationLine: sub.cancelled ? 'line-through' : 'none', marginRight: 6 }}>
                                ${sub.amount.toFixed(2)}
                              </Text>
                              {/* charges pill */}
                              {allCharges.length > 0 && (
                                <TouchableOpacity
                                  onPress={() => setExpandedSubKeys(prev => { const n = new Set(prev); if (n.has(sub.key)) n.delete(sub.key); else n.add(sub.key); return n; })}
                                  style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}
                                >
                                  <Text style={{ fontSize: 10, color: Colors.textDim }}>{allCharges.length} charge{allCharges.length !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                              )}
                              {sub.cancelled ? (
                                <TouchableOpacity onPress={() => handleUncancelSub(sub.key)} style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 }}>
                                  <Text style={{ fontSize: 10, color: Colors.textDim }}>Restore</Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => Alert.alert('Cancel Subscription', `Mark "${sub.description}" as cancelled?\n\nIt will still show in past months but won't appear going forward.`, [{ text: 'Not yet' }, { text: 'Cancel it', style: 'destructive', onPress: () => handleCancelSub(sub.key) }])}
                                  style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d40', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 }}
                                >
                                  <Text style={{ fontSize: 10, color: Colors.danger }}>Cancel</Text>
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Expanded charge list */}
                            {isExpanded && allCharges.length > 0 && (
                              <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                                <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textDim }}>All charges matching this service this month</Text>
                                  {sub.isDuplicate && <Text style={{ fontSize: 10, color: Colors.danger, marginTop: 2 }}>⚠ Same amount charged twice on the same day — possible accidental double charge</Text>}
                                  {!sub.isDuplicate && subCount > 1 && <Text style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>{subCount} separate subscriptions detected for this service</Text>}
                                </View>
                                {allCharges.map((t, ci) => {
                                  const chargeType = classifyCharge(t, sub.key);
                                  const typeLabel = chargeType === 'recurring' ? '🔁 Subscription' : chargeType === 'channel' ? '📺 Add-on' : '⚡ One-time';
                                  const typeColor = chargeType === 'recurring' ? '#a78bfa' : chargeType === 'channel' ? '#60a5fa' : '#fbbf24';
                                  return (
                                    <View key={`c-${ci}`} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderBottomWidth: ci < allCharges.length - 1 ? 1 : 0, borderBottomColor: Colors.border, gap: 10 }}>
                                      <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: Colors.text }} numberOfLines={1}>{t.description}</Text>
                                        <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>{t.date}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                          <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
                                          </View>
                                          {chargeType === 'onetime' && <Text style={{ fontSize: 9, color: Colors.textDim, marginLeft: 6 }}>Not counted as subscription</Text>}
                                        </View>
                                      </View>
                                      <Text style={{ fontSize: 13, fontWeight: '700', color: typeColor, flexShrink: 0 }}>${t.amount.toFixed(2)}</Text>
                                    </View>
                                  );
                                })}
                                {sub.isDuplicate && (
                                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#1a0e0e', borderTopWidth: 1, borderTopColor: Colors.border }}>
                                    <TouchableOpacity onPress={() => {}} style={{ flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 7, alignItems: 'center' }}>
                                      <Text style={{ fontSize: 11, color: Colors.textDim }}>Both intentional</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => Alert.alert('Cancel Subscription', `Mark one "${sub.description}" charge as cancelled?`, [{ text: 'Not yet' }, { text: 'Cancel one', style: 'destructive', onPress: () => handleCancelSub(sub.key) }])}
                                      style={{ flex: 1, backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d40', borderRadius: 8, padding: 7, alignItems: 'center' }}
                                    >
                                      <Text style={{ fontSize: 11, color: Colors.danger }}>Cancel one</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Add expense */}
                  <TouchableOpacity style={styles.addExpenseButton} onPress={() => openTransactionModal(undefined, budget.id, 'expense')}>
                    <Text style={styles.addExpenseText}>+ Add Expense</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Unassigned subscriptions (no budget category) */}
          {unassignedSubs.length > 0 && (
            <View style={[styles.budgetCard, { overflow: 'hidden' }]}>
              <View style={{ padding: 14, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={styles.budgetName}>📦 Uncategorized</Text>
                  <View style={{ backgroundColor: '#1e1629', borderWidth: 1, borderColor: '#4c1d9550', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#a78bfa' }}>{unassignedSubs.filter(s => !s.cancelled).length} subs</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: Colors.textDim }}>Subscriptions not linked to a budget category</Text>
              </View>
              <View style={{ backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
                <Text style={{ fontSize: 10, color: Colors.textDim, marginBottom: 6, letterSpacing: 0.3 }}>📡 SUBSCRIPTIONS</Text>
                {unassignedSubs.map((sub, si) => {
                  const isExpanded = expandedSubKeys.has(sub.key);
                  const allCharges = (allTxsBySubKey[sub.key] ?? []).filter(t => t.date.startsWith(activeSubsMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const groupColor = SUB_GROUPS[sub.group]?.color ?? '#9ca3af';
                  const subCount = subCountByKeyMonth[sub.key]?.[activeSubsMonth] ?? 1;
                  return (
                    <View key={`usub-${si}`} style={{ borderBottomWidth: si < unassignedSubs.length - 1 ? 1 : 0, borderBottomColor: Colors.border, paddingVertical: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: sub.cancelled ? 0.45 : 1 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: groupColor, flexShrink: 0 }} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: sub.cancelled ? Colors.textDim : Colors.text, textDecorationLine: sub.cancelled ? 'line-through' : 'none' }}>
                              {sub.description}
                            </Text>
                            {subCount > 1 && !sub.cancelled && (
                              <View style={{ backgroundColor: '#1e1a2e', borderWidth: 1, borderColor: '#6d28d960', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: '#a78bfa' }}>{subCount}×</Text>
                              </View>
                            )}
                            {sub.isDuplicate && !sub.cancelled && (
                              <View style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d60', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.danger }}>⚠ double charge?</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 1 }}>{sub.group} · {sub.cancelled ? `Cancelled` : `Last ${sub.date}`}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: sub.cancelled ? Colors.textDim : Colors.danger, textDecorationLine: sub.cancelled ? 'line-through' : 'none' }}>${sub.amount.toFixed(2)}</Text>
                        {allCharges.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setExpandedSubKeys(prev => { const n = new Set(prev); if (n.has(sub.key)) n.delete(sub.key); else n.add(sub.key); return n; })}
                            style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}
                          >
                            <Text style={{ fontSize: 10, color: Colors.textDim }}>{allCharges.length} charge{allCharges.length !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {/* Assign / Cancel row */}
                      {!sub.cancelled && (
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                          <TouchableOpacity
                            onPress={() => {
                              const budgetOptions = budgets.map(b => ({ text: `${b.icon} ${b.name}`, onPress: () => {
                                transactions.forEach(t => {
                                  if (t.type !== 'expense' || !t.date.startsWith(activeSubsMonth)) return;
                                  const d = (t.description ?? '').toLowerCase();
                                  if (d.includes(sub.key)) updateTransaction(t.id, { budgetId: b.id });
                                });
                              }}));
                              Alert.alert('Assign to Budget', `Where does "${sub.description}" belong?`, [...budgetOptions, { text: 'Cancel', style: 'cancel' as const }]);
                            }}
                            style={{ flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 7, paddingVertical: 5, alignItems: 'center' }}
                          >
                            <Text style={{ fontSize: 11, color: Colors.text, fontWeight: '600' }}>📂 Assign to budget</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => Alert.alert('Cancel Subscription', `Mark "${sub.description}" as cancelled?\n\nIt will still show in past months but won't appear going forward.`, [{ text: 'Not yet' }, { text: 'Cancel it', style: 'destructive', onPress: () => handleCancelSub(sub.key) }])}
                            style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d40', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 5, alignItems: 'center' }}
                          >
                            <Text style={{ fontSize: 11, color: Colors.danger }}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {sub.cancelled && (
                        <TouchableOpacity onPress={() => handleUncancelSub(sub.key)} style={{ marginTop: 6, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 7, paddingVertical: 5, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: Colors.textDim }}>Restore</Text>
                        </TouchableOpacity>
                      )}

                      {isExpanded && allCharges.length > 0 && (
                        <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                          <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textDim }}>All charges matching this service this month</Text>
                          </View>
                          {allCharges.map((t, ci) => {
                            const chargeType = classifyCharge(t, sub.key);
                            const typeLabel = chargeType === 'recurring' ? '🔁 Subscription' : chargeType === 'channel' ? '📺 Add-on' : '⚡ One-time';
                            const typeColor = chargeType === 'recurring' ? '#a78bfa' : chargeType === 'channel' ? '#60a5fa' : '#fbbf24';
                            return (
                              <View key={`uc-${ci}`} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderBottomWidth: ci < allCharges.length - 1 ? 1 : 0, borderBottomColor: Colors.border, gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 12, color: Colors.text }} numberOfLines={1}>{t.description}</Text>
                                  <Text style={{ fontSize: 10, color: Colors.textDim, marginTop: 2 }}>{t.date}</Text>
                                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                    <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                                      <Text style={{ fontSize: 9, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
                                    </View>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: typeColor, flexShrink: 0 }}>${t.amount.toFixed(2)}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Debt Tracker</Text>
            <TouchableOpacity onPress={() => openDebtModal()} style={styles.addButton}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {debts.length === 0 ? (
            <Text style={styles.emptyText}>No debts tracked</Text>
          ) : (
            debts.map((debt, idx) => {
              const original = debt.originalAmount || (debt.amount + (debt.amountPaid ?? 0));
              const paid = debt.amountPaid || 0;
              const progress = Math.min(100, (paid / original) * 100);
              const monthlyRate = debt.interest / 100 / 12;
              const nextInterest = parseFloat((debt.amount * monthlyRate).toFixed(2));
              const nextPrincipal = parseFloat(Math.max(0, debt.payment - nextInterest).toFixed(2));
              return (
                <TouchableOpacity
                  key={`debt-${debt.id}-${idx}`}
                  style={styles.debtCard}
                  onPress={() => { setSelectedDebt(debt); setDebtDetailVisible(true); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.debtHeader}>
                    <View style={styles.debtInfo}>
                      <Text style={styles.debtName}>💳 {debt.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                        <Text style={styles.debtAmount}>${debt.amount.toFixed(2)}</Text>
                        {paid > 0 && (
                          <Text style={{ fontSize: 11, color: Colors.textDim }}>of ${original.toFixed(2)}</Text>
                        )}
                      </View>
                      <Text style={styles.debtDetails}>
                        {debt.interest}% APR • ${debt.payment}/mo • Due day {debt.dueDay || debt.due}
                      </Text>
                      {paid > 0 && (
                        <Text style={{ fontSize: 11, color: Colors.success, marginTop: 2 }}>
                          ${paid.toFixed(2)} paid off total
                        </Text>
                      )}
                      {debt.payment > 0 && debt.interest > 0 && (
                        <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 2 }}>
                          Next pmt: ${nextPrincipal.toFixed(2)} principal + ${nextInterest.toFixed(2)} interest
                        </Text>
                      )}
                    </View>
                    <View style={styles.budgetActions}>
                      <TouchableOpacity onPress={() => openDebtModal(debt)} style={styles.iconButton}>
                        <Edit2 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteDebt(debt.id, debt.name)} style={styles.iconButton}>
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {paid > 0 && (
                    <View style={{ marginTop: 8, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <View style={{ width: `${progress}%`, height: 6, backgroundColor: Colors.success, borderRadius: 3 }} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ marginTop: 10, backgroundColor: Colors.danger, borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}
                    onPress={() => { setDebtPaymentTarget(debt); setDebtPaymentAmount(debt.payment.toString()); setDebtPaymentModalVisible(true); }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Make Payment</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Savings Goals</Text>
            <TouchableOpacity onPress={() => openSavingsModal()} style={styles.addButton}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {savings.length === 0 ? (
            <Text style={styles.emptyText}>No savings goals yet</Text>
          ) : (
            savings.map((goal, idx) => {
              const progress = Math.min(100, (goal.current / goal.target) * 100);
              return (
                <TouchableOpacity
                  key={`savings-${goal.id}-${idx}`}
                  style={styles.savingsCard}
                  onPress={() => openSavingsModal(goal)}
                  activeOpacity={0.7}
                >
                  <View style={styles.savingsHeader}>
                    <View style={styles.savingsInfo}>
                      <Text style={styles.savingsName}>🎯 {goal.name}</Text>
                      <Text style={styles.savingsAmount}>
                        ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}
                      </Text>
                      <Text style={styles.savingsDetails}>
                        ${goal.monthly}/mo • Deadline: {goal.deadline}
                      </Text>
                    </View>
                    <View style={styles.budgetActions}>
                      <TouchableOpacity
                        onPress={() => openSavingsModal(goal)}
                        style={styles.iconButton}
                      >
                        <Edit2 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSavings(goal.id, goal.name)}
                        style={styles.iconButton}
                      >
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: Colors.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* REMOVED: old subscriptions section replaced by combined Budget & Subscriptions above */}
        {false && <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📡 Subscriptions</Text>
          </View>

          {subsMonthOptions.length === 0 ? (
            <Text style={styles.emptyText}>No subscriptions detected yet. Upload a bank statement to auto-detect them.</Text>
          ) : (
            <>
              {/* Month selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                {subsMonthOptions.map(ym => (
                  <TouchableOpacity
                    key={ym}
                    onPress={() => setSubsViewMonth(ym)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: activeSubsMonth === ym ? Colors.primary : 'transparent',
                      borderWidth: 1,
                      borderColor: activeSubsMonth === ym ? Colors.primary : Colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: activeSubsMonth === ym ? '#fff' : Colors.textDim, fontWeight: activeSubsMonth === ym ? '700' : '400' }}>
                      {ym}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Budget cap bar */}
              {(() => {
                const activeTotal = subsForMonth.filter(s => !s.cancelled).reduce((sum, s) => sum + s.amount, 0);
                const goal = parseFloat(subsBudgetGoal) || 0;
                const over = goal > 0 ? activeTotal - goal : 0;
                const pct = goal > 0 ? Math.min(100, (activeTotal / goal) * 100) : 0;
                return (
                  <View style={[styles.metricsCard, { marginBottom: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      {subsBudgetEditing ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <Text style={{ color: Colors.textDim, fontSize: 12 }}>Budget cap: $</Text>
                          <TextInput
                            style={{ color: Colors.text, fontSize: 13, borderBottomWidth: 1, borderColor: Colors.primary, minWidth: 60, padding: 2 }}
                            value={subsBudgetDraft}
                            onChangeText={setSubsBudgetDraft}
                            keyboardType="numeric"
                            autoFocus
                            onBlur={() => {
                              const v = subsBudgetDraft.replace(/[^0-9.]/g, '');
                              setSubsBudgetGoal(v);
                              AsyncStorage.setItem('subsBudgetGoal', v);
                              setSubsBudgetEditing(false);
                            }}
                          />
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => { setSubsBudgetDraft(subsBudgetGoal); setSubsBudgetEditing(true); }}>
                          <Text style={{ color: Colors.textDim, fontSize: 12 }}>
                            {goal > 0 ? `Budget cap: $${goal.toFixed(0)}/mo` : 'Tap to set a budget cap'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: over > 0 ? Colors.danger : Colors.success }}>
                        ${activeTotal.toFixed(2)}/mo
                      </Text>
                    </View>
                    {goal > 0 && (
                      <>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: over > 0 ? Colors.danger : Colors.primary }]} />
                        </View>
                        <Text style={{ fontSize: 11, color: over > 0 ? Colors.danger : Colors.textDim, marginTop: 4 }}>
                          {over > 0 ? `$${over.toFixed(2)} over budget` : `$${(goal - activeTotal).toFixed(2)} under budget`}
                        </Text>
                      </>
                    )}
                    <View style={[styles.metricsGrid, { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 }]}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Active</Text>
                        <Text style={styles.metricValue}>{subsForMonth.filter(s => !s.cancelled).length}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Cancelled</Text>
                        <Text style={[styles.metricValue, { color: Colors.textDim }]}>{subsForMonth.filter(s => s.cancelled).length}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Annual</Text>
                        <Text style={[styles.metricValue, { color: Colors.danger }]}>${(activeTotal * 12).toFixed(0)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Grouped categories */}
              {Object.entries(subsGrouped).map(([groupName, subs]) => {
                const groupDef = SUB_GROUPS[groupName] ?? SUB_GROUPS['Other'];
                const isOpen = expandedSubGroups.has(groupName);
                const groupTotal = subs.filter(s => !s.cancelled).reduce((sum, s) => sum + s.amount, 0);
                return (
                  <View key={groupName} style={{ marginBottom: 8 }}>
                    {/* Group header */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: Colors.card,
                        borderWidth: 1, borderColor: Colors.border,
                        borderRadius: isOpen ? 12 : 12,
                        borderBottomLeftRadius: isOpen ? 0 : 12,
                        borderBottomRightRadius: isOpen ? 0 : 12,
                        padding: 12,
                      }}
                      onPress={() => setExpandedSubGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(groupName)) next.delete(groupName); else next.add(groupName);
                        return next;
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>
                        {groupDef.emoji} {groupName}
                        <Text style={{ fontSize: 12, color: Colors.textDim, fontWeight: '400' }}> ({subs.length})</Text>
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {groupTotal > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.danger }}>${groupTotal.toFixed(2)}</Text>}
                        <Text style={{ color: Colors.textDim, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Group body */}
                    {isOpen && (
                      <View style={{
                        backgroundColor: Colors.background,
                        borderWidth: 1, borderTopWidth: 0,
                        borderColor: Colors.border,
                        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                        paddingVertical: 4,
                      }}>
                        {subs.map((sub, idx) => (
                          <View
                            key={`sg-${idx}`}
                            style={{
                              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
                              borderBottomWidth: idx < subs.length - 1 ? 1 : 0, borderBottomColor: Colors.border,
                              opacity: sub.cancelled ? 0.5 : 1,
                            }}
                          >
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: groupDef.color, marginRight: 10, flexShrink: 0 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, color: sub.cancelled ? Colors.textDim : Colors.text, fontWeight: '500', textDecorationLine: sub.cancelled ? 'line-through' : 'none' }}>
                                {sub.description}
                              </Text>
                              <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 1 }}>
                                {sub.cancelled
                                  ? `Cancelled · last charged ${sub.date}`
                                  : `${sub.count} charge${sub.count !== 1 ? 's' : ''} · last ${sub.date}`}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: sub.cancelled ? Colors.textDim : Colors.danger, marginRight: 10, textDecorationLine: sub.cancelled ? 'line-through' : 'none' }}>
                              ${sub.amount.toFixed(2)}
                            </Text>
                            {sub.cancelled ? (
                              <TouchableOpacity
                                onPress={() => handleUncancelSub(sub.key)}
                                style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
                              >
                                <Text style={{ fontSize: 11, color: Colors.textDim }}>Restore</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={() => Alert.alert(
                                  'Cancel Subscription',
                                  `Mark "${sub.description}" as cancelled? It will still show in past months but won't appear going forward.`,
                                  [{ text: 'Not yet' }, { text: 'Cancel it', style: 'destructive', onPress: () => handleCancelSub(sub.key) }]
                                )}
                                style={{ backgroundColor: '#2d1515', borderWidth: 1, borderColor: '#7f1d1d50', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
                              >
                                <Text style={{ fontSize: 11, color: Colors.danger }}>Cancel</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>}

        {/* Yearly / Quarterly Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Bank Statement Overview</Text>
            <Calendar size={18} color={Colors.primary} />
          </View>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>Upload a bank statement to see your breakdown</Text>
          ) : (
            <>
              {yearlyGroupedData.map(yearData => {
                if (yearData.isCurrent) {
                  return (
                    <View key={yearData.year}>
                      <Text style={styles.yearLabel}>{yearData.year} — Current Year</Text>
                      {yearData.quarters.map(quarter => {
                        const qKey = `${yearData.year}-Q${quarter.quarter}`;
                        const isExpanded = expandedQuarters.has(qKey);
                        return (
                          <View key={qKey} style={styles.quarterCard}>
                            <TouchableOpacity
                              style={styles.quarterHeader}
                              onPress={() => toggleQuarter(qKey)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quarterTitle}>{quarter.label}</Text>
                              {quarter.hasData ? (
                                <View style={styles.quarterSummary}>
                                  <Text style={{ color: Colors.success, fontSize: 12 }}>+${quarter.income.toFixed(0)}</Text>
                                  <Text style={{ color: Colors.danger, fontSize: 12, marginLeft: 8 }}>-${quarter.expenses.toFixed(0)}</Text>
                                </View>
                              ) : (
                                <Text style={{ color: Colors.textDim, fontSize: 11 }}>No data</Text>
                              )}
                              {isExpanded ? <ChevronUp size={16} color={Colors.textDim} /> : <ChevronDown size={16} color={Colors.textDim} />}
                            </TouchableOpacity>
                            {isExpanded && (
                              <View style={styles.monthsGrid}>
                                {quarter.months.length === 0 && (
                                  <Text style={[styles.emptyText, { fontSize: 12, paddingVertical: 8 }]}>No statement data for this quarter</Text>
                                )}
                                {quarter.months.map((month, idx) => {
                                  const hasMonthData = month.transactions.length > 0;
                                  return (
                                    <TouchableOpacity
                                      key={`${qKey}-${idx}`}
                                      style={[styles.monthCard, !hasMonthData && styles.monthCardEmpty]}
                                      onPress={() => hasMonthData ? openMonthDetail(month.key) : null}
                                      activeOpacity={hasMonthData ? 0.7 : 1}
                                    >
                                      <Text style={[styles.monthCardTitle, !hasMonthData && { color: Colors.textDim }]}>{month.key}</Text>
                                      {hasMonthData ? (
                                        <>
                                          <View style={styles.monthCardRow}>
                                            <Text style={styles.monthCardLabel}>Income:</Text>
                                            <Text style={[styles.monthCardValue, { color: Colors.success }]}>${month.income.toFixed(2)}</Text>
                                          </View>
                                          <View style={styles.monthCardRow}>
                                            <Text style={styles.monthCardLabel}>Expense:</Text>
                                            <Text style={[styles.monthCardValue, { color: Colors.danger }]}>${month.expenses.toFixed(2)}</Text>
                                          </View>
                                          <View style={styles.monthCardRow}>
                                            <Text style={styles.monthCardLabel}>Cashflow:</Text>
                                            <Text style={[styles.monthCardValue, { color: month.cashflow >= 0 ? Colors.success : Colors.danger }]}>
                                              {month.cashflow >= 0 ? '+' : ''}${month.cashflow.toFixed(2)}
                                            </Text>
                                          </View>
                                          {monthlyEndingBalances[month.key] !== undefined && (
                                            <View style={styles.monthCardRow}>
                                              <Text style={styles.monthCardLabel}>Left Over:</Text>
                                              <Text style={[styles.monthCardValue, { color: Colors.success }]}>${monthlyEndingBalances[month.key].toFixed(2)}</Text>
                                            </View>
                                          )}
                                        </>
                                      ) : (
                                        <Text style={{ color: Colors.textDim, fontSize: 11, textAlign: 'center', paddingVertical: 8 }}>No data yet</Text>
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                } else {
                  const isYearExpanded = expandedArchiveYears.has(yearData.year);
                  const yearIncome = yearData.quarters.reduce((s, q) => s + q.income, 0);
                  const yearExpenses = yearData.quarters.reduce((s, q) => s + q.expenses, 0);
                  return (
                    <View key={yearData.year}>
                      <TouchableOpacity
                        style={styles.archiveYearCard}
                        onPress={() => toggleArchiveYear(yearData.year)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.archiveYearLeft}>
                          <Text style={styles.archiveYearTitle}>📦 {yearData.year} Archive</Text>
                          <Text style={styles.archiveYearSub}>
                            +${yearIncome.toFixed(0)} income  /  -${yearExpenses.toFixed(0)} expenses
                          </Text>
                        </View>
                        {isYearExpanded ? <ChevronUp size={16} color={Colors.textDim} /> : <ChevronDown size={16} color={Colors.textDim} />}
                      </TouchableOpacity>
                      {isYearExpanded && (
                        <View style={{ paddingLeft: 8, marginBottom: 8 }}>
                          {yearData.quarters.map(quarter => {
                            const qKey = `${yearData.year}-Q${quarter.quarter}`;
                            const isQExpanded = expandedQuarters.has(qKey);
                            return (
                              <View key={qKey} style={[styles.quarterCard, { marginBottom: 8 }]}>
                                <TouchableOpacity
                                  style={styles.quarterHeader}
                                  onPress={() => toggleQuarter(qKey)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.quarterTitle}>{quarter.label}</Text>
                                  <View style={styles.quarterSummary}>
                                    <Text style={{ color: Colors.success, fontSize: 12 }}>+${quarter.income.toFixed(0)}</Text>
                                    <Text style={{ color: Colors.danger, fontSize: 12, marginLeft: 8 }}>-${quarter.expenses.toFixed(0)}</Text>
                                  </View>
                                  {isQExpanded ? <ChevronUp size={16} color={Colors.textDim} /> : <ChevronDown size={16} color={Colors.textDim} />}
                                </TouchableOpacity>
                                {isQExpanded && (
                                  <View style={styles.monthsGrid}>
                                    {quarter.months.length === 0 && (
                                      <Text style={[styles.emptyText, { fontSize: 12, paddingVertical: 8 }]}>No statement data for this quarter</Text>
                                    )}
                                    {quarter.months.map((month, idx) => (
                                      <TouchableOpacity
                                        key={`${qKey}-${idx}`}
                                        style={styles.monthCard}
                                        onPress={() => openMonthDetail(month.key)}
                                        activeOpacity={0.7}
                                      >
                                        <Text style={styles.monthCardTitle}>{month.key}</Text>
                                        <View style={styles.monthCardRow}>
                                          <Text style={styles.monthCardLabel}>Income:</Text>
                                          <Text style={[styles.monthCardValue, { color: Colors.success }]}>${month.income.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.monthCardRow}>
                                          <Text style={styles.monthCardLabel}>Expense:</Text>
                                          <Text style={[styles.monthCardValue, { color: Colors.danger }]}>${month.expenses.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.monthCardRow}>
                                          <Text style={styles.monthCardLabel}>Cashflow:</Text>
                                          <Text style={[styles.monthCardValue, { color: month.cashflow >= 0 ? Colors.success : Colors.danger }]}>
                                            {month.cashflow >= 0 ? '+' : ''}${month.cashflow.toFixed(2)}
                                          </Text>
                                        </View>
                                        {monthlyEndingBalances[month.key] !== undefined && (
                                          <View style={styles.monthCardRow}>
                                            <Text style={styles.monthCardLabel}>Left Over:</Text>
                                            <Text style={[styles.monthCardValue, { color: Colors.success }]}>${monthlyEndingBalances[month.key].toFixed(2)}</Text>
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                }
              })}
            </>
          )}
        </View>
      </ScrollView>
      ) : (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Subscriptions View */}
        {(() => {
          const isYearly = (key: string, amount: number): boolean => {
            const txs = allTxsBySubKey[key] ?? [];
            const months = new Set(txs.map((t: Transaction) => t.date.substring(0, 7)));
            return months.size <= 2 && amount > 35;
          };

          // A charge amount is "recurring" (subscription) if it appears in the majority of months
          // the service was charged — this distinguishes subscriptions from one-time purchases
          const getRecurringAmounts = (key: string): Set<number> => {
            const txs = allTxsBySubKey[key] ?? [];
            // bucket amounts within $3 of each other; each bucket maps to the set of months it appeared in
            const buckets: { center: number; months: Set<string> }[] = [];
            for (const t of txs) {
              const existing = buckets.find(b => Math.abs(b.center - t.amount) <= 3);
              if (existing) { existing.months.add(t.date.substring(0, 7)); }
              else { buckets.push({ center: t.amount, months: new Set([t.date.substring(0, 7)]) }); }
            }
            // Total distinct months this service was seen
            const totalMonths = new Set(txs.map((t: Transaction) => t.date.substring(0, 7))).size;
            // Require amount appears in majority of months (>50%), minimum 2
            const threshold = Math.max(2, Math.ceil(totalMonths * 0.5));
            return new Set(buckets.filter(b => b.months.size >= threshold).map(b => b.center));
          };

          // Collect all subscription keys with at least one transaction
          const subEntries: {
            key: string; description: string; amount: number; group: string; emoji: string; color: string;
            subCharges: { description: string; amount: number }[];
            oneTimePurchases: { description: string; amount: number }[];
          }[] = [];

          for (const [groupName, { keywords, emoji, color }] of Object.entries(SUB_GROUPS)) {
            for (const kw of keywords) {
              const txs = allTxsBySubKey[kw] ?? [];
              if (txs.length === 0) continue;
              const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
              const recurringAmounts = getRecurringAmounts(kw);

              // Get this month's charges
              const latestMonth = sorted[0].date.substring(0, 7);
              const monthTxs = txs.filter((t: Transaction) => t.date.startsWith(latestMonth));

              // A charge this month is a subscription if its amount matches a recurring amount bucket
              // Otherwise it's a one-time purchase (e.g. buying a Kindle book)
              const subCharges: { description: string; amount: number }[] = [];
              const oneTimePurchases: { description: string; amount: number }[] = [];

              for (const t of monthTxs) {
                const isRecurring = recurringAmounts.size === 0 // if no history yet, treat all as subscriptions
                  || [...recurringAmounts].some(r => Math.abs(r - t.amount) <= 3);
                if (isRecurring) subCharges.push({ description: t.description ?? kw, amount: t.amount });
                else oneTimePurchases.push({ description: t.description ?? kw, amount: t.amount });
              }

              if (subCharges.length === 0 && monthTxs.length > 0) {
                // No recurring charges this month — show the charge anyway
                subCharges.push({ description: sorted[0].description ?? kw, amount: sorted[0].amount });
              }

              // Display amount = average of sub charges this month
              const displayAmt = subCharges.reduce((s, c) => s + c.amount, 0) / subCharges.length;

              subEntries.push({ key: kw, description: subCharges[0].description, amount: displayAmt, group: groupName, emoji, color, subCharges, oneTimePurchases });
            }
          }

          // Compute total monthly cost — sum of all subscription charges this month
          let totalMonthly = 0;
          for (const entry of subEntries) {
            if (cancelledSubs[entry.key]) continue;
            const total = entry.subCharges.reduce((s, c) => s + c.amount, 0);
            totalMonthly += isYearly(entry.key, entry.amount) ? total / 12 : total;
          }

          // Group by category
          const grouped: Record<string, typeof subEntries> = {};
          for (const entry of subEntries) {
            if (!grouped[entry.group]) grouped[entry.group] = [];
            grouped[entry.group].push(entry);
          }

          return (
            <View style={{ padding: 16 }}>
              {/* Total monthly header */}
              <View style={{ backgroundColor: '#1a1a24', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: Colors.textDim, fontSize: 13, marginBottom: 4 }}>Est. Monthly Cost</Text>
                <Text style={{ color: Colors.primary, fontSize: 32, fontWeight: '700' }}>${totalMonthly.toFixed(2)}</Text>
                <Text style={{ color: Colors.textDim, fontSize: 12, marginTop: 4 }}>{subEntries.filter(e => !cancelledSubs[e.key]).length} active • ${(totalMonthly * 12).toFixed(0)}/yr</Text>
              </View>

              {Object.entries(grouped).map(([groupName, entries]) => (
                <View key={groupName} style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                    {SUB_GROUPS[groupName]?.emoji} {groupName}
                  </Text>
                  {entries.map(entry => {
                    const yearly = isYearly(entry.key, entry.amount);
                    const cancelled = !!cancelledSubs[entry.key];
                    const multiAccount = entry.subCharges.length > 1;
                    return (
                      <View key={entry.key} style={{ marginBottom: 10 }}>
                        {/* Each subscription charge shown individually */}
                        {entry.subCharges.map((charge, ci) => {
                          const label = charge.description.length > 32 ? charge.description.substring(0, 32) : charge.description;
                          return (
                            <View key={ci} style={{ backgroundColor: '#1a1a24', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: ci < entry.subCharges.length - 1 ? 4 : 0 }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                  <Text style={{ color: cancelled ? Colors.textDim : '#fff', fontSize: 14, fontWeight: '600', textDecorationLine: cancelled ? 'line-through' : 'none' }}>
                                    {label}
                                  </Text>
                                  <View style={{ backgroundColor: yearly ? '#f59e0b22' : '#34d39922', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ color: yearly ? '#f59e0b' : Colors.success, fontSize: 10, fontWeight: '700' }}>
                                      {yearly ? 'YEARLY' : 'MONTHLY'}
                                    </Text>
                                  </View>
                                  {multiAccount && (
                                    <View style={{ backgroundColor: 'rgba(167,139,250,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                                      <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '700' }}>ACCOUNT {ci + 1} OF {entry.subCharges.length}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ color: cancelled ? Colors.textDim : Colors.primary, fontSize: 16, fontWeight: '700' }}>
                                  ${charge.amount.toFixed(2)}{yearly ? '/yr' : '/mo'}
                                </Text>
                              </View>
                              {ci === 0 && (
                                <TouchableOpacity
                                  onPress={() => cancelled ? handleUncancelSub(entry.key) : handleCancelSub(entry.key)}
                                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: cancelled ? Colors.success + '22' : Colors.danger + '22' }}
                                >
                                  <Text style={{ color: cancelled ? Colors.success : Colors.danger, fontSize: 12, fontWeight: '600' }}>
                                    {cancelled ? 'Restore' : 'Cancel'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                        {/* One-time purchases (e.g. buying a Kindle book) */}
                        {entry.oneTimePurchases.map((p, i) => (
                          <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginTop: 4, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: 'rgba(148,163,184,0.25)' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: Colors.textDim, fontSize: 12 }} numberOfLines={1}>{p.description}</Text>
                              <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 }}>${p.amount.toFixed(2)}</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(148,163,184,0.12)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ color: Colors.textDim, fontSize: 10, fontWeight: '700' }}>ONE-TIME</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          );
        })()}
      </ScrollView>
      )}

      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBudgetModalVisible(false)}
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
              <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Budget' : 'Add Budget Category'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={Colors.textDim}
              value={budgetName}
              onChangeText={setBudgetName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Budget amount"
              placeholderTextColor={Colors.textDim}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Icon (emoji)"
              placeholderTextColor={Colors.textDim}
              value={budgetIcon}
              onChangeText={setBudgetIcon}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Date (optional)"
              placeholderTextColor={Colors.textDim}
              value={budgetDate}
              onChangeText={setBudgetDate}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Recurring</Text>
              <Switch
                value={budgetRecurring}
                onValueChange={setBudgetRecurring}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="white"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setBudgetModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveBudget}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={transactionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTransactionModalVisible(false)}
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
              <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Transaction' : `Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
            </Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
                onPress={() => setTransactionType('expense')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActive]}
                onPress={() => setTransactionType('income')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, styles.amountInput]}
              placeholder="Amount"
              placeholderTextColor={Colors.textDim}
              value={transactionAmount}
              onChangeText={setTransactionAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              placeholderTextColor={Colors.textDim}
              value={transactionDesc}
              onChangeText={setTransactionDesc}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textDim}
              value={transactionDate}
              onChangeText={setTransactionDate}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setTransactionModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveTransaction}>
                <LinearGradient
                  colors={
                    transactionType === 'income'
                      ? [Colors.success, '#34d399']
                      : [Colors.danger, '#f87171']
                  }
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={debtModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDebtModalVisible(false)}
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
              <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Debt' : 'Add Debt'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Debt name"
              placeholderTextColor={Colors.textDim}
              value={debtName}
              onChangeText={setDebtName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Total amount"
              placeholderTextColor={Colors.textDim}
              value={debtAmount}
              onChangeText={setDebtAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Interest rate (%)"
              placeholderTextColor={Colors.textDim}
              value={debtInterest}
              onChangeText={setDebtInterest}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Monthly payment"
              placeholderTextColor={Colors.textDim}
              value={debtPayment}
              onChangeText={setDebtPayment}
              keyboardType="numeric"
            />
            <Text style={{ color: Colors.textDim, fontSize: 13, marginTop: 8, marginBottom: 6 }}>Payment Due Day of Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setDebtDueDay(day)}
                    style={{
                      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: debtDueDay === day ? Colors.danger : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ color: debtDueDay === day ? '#fff' : Colors.textDim, fontSize: 13, fontWeight: '600' }}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setDebtModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveDebt}>
                <LinearGradient
                  colors={[Colors.danger, '#f87171']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Make Payment Modal */}
      <Modal
        visible={debtPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDebtPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
                <Text style={styles.modalTitle}>Make Payment</Text>
                {debtPaymentTarget && (() => {
                  const debt = debtPaymentTarget;
                  const payAmt = parseFloat(debtPaymentAmount) || 0;
                  const monthlyRate = debt.interest / 100 / 12;
                  const interestCharge = parseFloat(Math.min(payAmt, debt.amount * monthlyRate).toFixed(2));
                  const principalCharge = parseFloat(Math.max(0, payAmt - interestCharge).toFixed(2));
                  const newBal = Math.max(0, debt.amount - payAmt);
                  return (
                    <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                      <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: 6 }}>{debt.name}</Text>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Current balance: <Text style={{ color: Colors.danger }}>${debt.amount.toFixed(2)}</Text></Text>
                      {payAmt > 0 && (
                        <View style={{ marginTop: 10, gap: 4 }}>
                          {debt.interest > 0 && <Text style={{ color: Colors.textDim, fontSize: 13 }}>Interest portion: <Text style={{ color: Colors.danger }}>${interestCharge.toFixed(2)}</Text></Text>}
                          {debt.interest > 0 && <Text style={{ color: Colors.textDim, fontSize: 13 }}>Principal portion: <Text style={{ color: Colors.success }}>${principalCharge.toFixed(2)}</Text></Text>}
                          <Text style={{ color: Colors.textDim, fontSize: 13 }}>New balance: <Text style={{ color: Colors.text, fontWeight: '700' }}>${newBal.toFixed(2)}</Text></Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
                <TextInput
                  style={styles.modalInput}
                  placeholder="Payment amount"
                  placeholderTextColor={Colors.textDim}
                  value={debtPaymentAmount}
                  onChangeText={setDebtPaymentAmount}
                  keyboardType="numeric"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setDebtPaymentModalVisible(false)}>
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleMakePayment}>
                    <LinearGradient colors={[Colors.success, '#34d399']} style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>Confirm Payment</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Debt Detail Modal */}
      <Modal
        visible={debtDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDebtDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom, maxHeight: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{selectedDebt?.name}</Text>
              <TouchableOpacity onPress={() => setDebtDetailVisible(false)}>
                <X size={22} color={Colors.textDim} />
              </TouchableOpacity>
            </View>
            {selectedDebt && (() => {
              const debt = selectedDebt;
              const original = debt.originalAmount || (debt.amount + (debt.amountPaid ?? 0));
              const paid = debt.amountPaid || 0;
              const progress = Math.min(100, (paid / original) * 100);
              const monthlyRate = debt.interest / 100 / 12;
              const nextInterest = parseFloat((debt.amount * monthlyRate).toFixed(2));
              const nextPrincipal = parseFloat(Math.max(0, debt.payment - nextInterest).toFixed(2));
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Original Amount</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700' }}>${original.toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Current Balance</Text>
                      <Text style={{ color: Colors.danger, fontWeight: '700' }}>${debt.amount.toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Total Paid Off</Text>
                      <Text style={{ color: Colors.success, fontWeight: '700' }}>${paid.toFixed(2)}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, marginVertical: 4 }}>
                      <View style={{ width: `${progress}%`, height: 8, backgroundColor: Colors.success, borderRadius: 4 }} />
                    </View>
                    <Text style={{ color: Colors.textDim, fontSize: 12, textAlign: 'center' }}>{progress.toFixed(1)}% paid off</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Interest Rate</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700' }}>{debt.interest}% APR</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Monthly Payment</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700' }}>${debt.payment.toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textDim, fontSize: 13 }}>Due Day</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700' }}>Day {debt.dueDay || debt.due} of each month</Text>
                    </View>
                    {debt.interest > 0 && (
                      <View style={{ marginTop: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, gap: 4 }}>
                        <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>Next Payment Breakdown</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: Colors.textDim, fontSize: 13 }}>Goes to Interest</Text>
                          <Text style={{ color: Colors.danger, fontWeight: '600' }}>${nextInterest.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: Colors.textDim, fontSize: 13 }}>Goes to Principal</Text>
                          <Text style={{ color: Colors.success, fontWeight: '600' }}>${nextPrincipal.toFixed(2)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  {(debt.paymentHistory?.length ?? 0) > 0 && (
                    <View>
                      <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Payment History</Text>
                      {[...(debt.paymentHistory ?? [])].reverse().map((p, i) => (
                        <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 2 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: Colors.textDim, fontSize: 12 }}>{p.date}</Text>
                            <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 13 }}>${p.amount.toFixed(2)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: Colors.textDim, fontSize: 11 }}>Principal: <Text style={{ color: Colors.success }}>${p.principal.toFixed(2)}</Text></Text>
                            <Text style={{ color: Colors.textDim, fontSize: 11 }}>Interest: <Text style={{ color: Colors.danger }}>${p.interest.toFixed(2)}</Text></Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ marginTop: 16, backgroundColor: Colors.danger, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => {
                      setDebtDetailVisible(false);
                      setDebtPaymentTarget(selectedDebt);
                      setDebtPaymentAmount(selectedDebt?.payment.toString() ?? '');
                      setDebtPaymentModalVisible(true);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Make Payment</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      <Modal
        visible={savingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavingsModalVisible(false)}
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
              <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Savings Goal' : 'Add Savings Goal'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Goal name"
              placeholderTextColor={Colors.textDim}
              value={savingsName}
              onChangeText={setSavingsName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Target amount"
              placeholderTextColor={Colors.textDim}
              value={savingsTarget}
              onChangeText={setSavingsTarget}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Current amount"
              placeholderTextColor={Colors.textDim}
              value={savingsCurrent}
              onChangeText={setSavingsCurrent}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Monthly contribution"
              placeholderTextColor={Colors.textDim}
              value={savingsMonthly}
              onChangeText={setSavingsMonthly}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Deadline date"
              placeholderTextColor={Colors.textDim}
              value={savingsDeadline}
              onChangeText={setSavingsDeadline}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setSavingsModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveSavings}>
                <LinearGradient
                  colors={[Colors.success, '#34d399']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setUploadModalVisible(false);
          setUploadStatus('');
          setIsUploading(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>Upload Status</Text>
            
            {uploadStatus ? (
              <View style={styles.uploadStatusContainer}>
                <Text style={styles.uploadStatus}>{uploadStatus}</Text>
              </View>
            ) : (
              <View style={styles.uploadStatusContainer}>
                <Text style={styles.uploadStatus}>Processing...</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setUploadModalVisible(false);
                  setUploadStatus('');
                  setIsUploading(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Financial Advisor Insights Modal */}
      <Modal
        visible={insightsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInsightsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: modalPaddingBottom }]}>
            <View style={styles.advisorModalHeader}>
              <View style={styles.advisorModalTitleRow}>
                <Lightbulb size={22} color="#f59e0b" />
                <Text style={styles.advisorModalTitle}>Financial Advisor</Text>
              </View>
              <TouchableOpacity onPress={() => setInsightsModalVisible(false)}>
                <X size={22} color={Colors.textDim} />
              </TouchableOpacity>
            </View>

            {expenseInsights.length === 0 ? (
              <View style={styles.advisorEmptyState}>
                <Text style={styles.advisorEmptyIcon}>🎉</Text>
                <Text style={styles.advisorEmptyTitle}>Looking Good!</Text>
                <Text style={styles.advisorEmptyText}>
                  No major spending issues detected. Keep it up!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.advisorSummaryRow}>
                  <Text style={styles.advisorSummaryText}>
                    {expenseInsights.length} issue{expenseInsights.length !== 1 ? 's' : ''} found
                  </Text>
                  <Text style={styles.advisorSavingsText}>
                    ~${expenseInsights.reduce((s, i) => s + i.potentialSavings, 0).toFixed(0)}/mo potential savings
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {expenseInsights.map((insight) => {
                    const severityColor =
                      insight.severity === 'high' ? Colors.danger :
                      insight.severity === 'medium' ? Colors.warning :
                      Colors.textDim;
                    const SeverityIcon =
                      insight.severity === 'high' ? TriangleAlert :
                      insight.severity === 'medium' ? AlertCircle :
                      Info;
                    return (
                      <View key={insight.id} style={[styles.insightCard, { borderLeftColor: severityColor }]}>
                        <View style={styles.insightHeader}>
                          <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                          <View style={styles.insightTitleBlock}>
                            <Text style={styles.insightTitle}>{insight.title}</Text>
                            <View style={[styles.insightBadge, { backgroundColor: `${severityColor}22` }]}>
                              <SeverityIcon size={10} color={severityColor} />
                              <Text style={[styles.insightBadgeText, { color: severityColor }]}>
                                {insight.severity.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          {insight.potentialSavings > 0 && (
                            <Text style={styles.insightSavings}>
                              Save ${insight.potentialSavings.toFixed(0)}/mo
                            </Text>
                          )}
                        </View>
                        <Text style={styles.insightDescription}>{insight.description}</Text>
                        <View style={styles.insightRecommendationBox}>
                          <Text style={styles.insightRecommendationLabel}>Advisor tip:</Text>
                          <Text style={styles.insightRecommendation}>{insight.recommendation}</Text>
                        </View>
                      </View>
                    );
                  })}
                  <View style={{ height: 16 }} />
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButtonSecondary, { marginTop: 12 }]}
              onPress={() => setInsightsModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Month Detail Modal */}
      <Modal
        visible={monthDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: modalPaddingBottom }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{selectedMonthKey}</Text>
              <TouchableOpacity onPress={() => setMonthDetailVisible(false)}>
                <ChevronDown size={24} color={Colors.textDim} />
              </TouchableOpacity>
            </View>

            {selectedMonthData && (
              <>
                <View style={styles.monthSummaryRow}>
                  <View style={styles.monthSummaryItem}>
                    <Text style={styles.monthSummaryLabel}>Income</Text>
                    <Text style={[styles.monthSummaryValue, { color: Colors.success }]}>
                      +${selectedMonthData.income.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.monthSummaryDivider} />
                  <View style={styles.monthSummaryItem}>
                    <Text style={styles.monthSummaryLabel}>Expenses</Text>
                    <Text style={[styles.monthSummaryValue, { color: Colors.danger }]}>
                      -${selectedMonthData.expenses.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.monthSummaryDivider} />
                  <View style={styles.monthSummaryItem}>
                    <Text style={styles.monthSummaryLabel}>Cashflow</Text>
                    <Text style={[styles.monthSummaryValue, { color: selectedMonthData.cashflow >= 0 ? Colors.success : Colors.danger }]}>
                      {selectedMonthData.cashflow >= 0 ? '+' : ''}${selectedMonthData.cashflow.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {selectedMonthKey && monthlyEndingBalances[selectedMonthKey] !== undefined && (
                  <View style={[styles.monthSummaryRow, { marginTop: 8 }]}>
                    <View style={styles.monthSummaryItem}>
                      <Text style={styles.monthSummaryLabel}>Left Over in Account</Text>
                      <Text style={[styles.monthSummaryValue, { color: Colors.success }]}>
                        ${monthlyEndingBalances[selectedMonthKey].toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>

              {/* Income sources */}
              {selectedMonthIncomes.length > 0 && (() => {
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Income</Text>
                    {selectedMonthIncomes.map((t, i) => (
                      <View key={`inc-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: i < selectedMonthIncomes.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}>
                        <Text style={{ fontSize: 13, color: Colors.text, flex: 1 }} numberOfLines={1}>{t.description}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.success, marginLeft: 8 }}>+${t.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Total Income</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.success }}>+${selectedMonthIncomes.reduce((s, t) => s + t.amount, 0).toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Auto-category expense breakdown */}
              {selectedMonthExpenses.length > 0 && (() => {
                const CATEGORY_ICONS: Record<string, string> = {
                  'Food & Dining': '🍔', 'Groceries': '🛒', 'Gas & Auto': '⛽',
                  'Health': '🏥', 'Shopping': '🛍️', 'Bills & Utilities': '📱',
                  'Entertainment': '🎬', 'Travel': '✈️', 'Housing': '🏠',
                  'Transportation': '🚗', 'Insurance': '🛡️', 'Pets': '🐾',
                  'Education': '📚', 'Savings & Investing': '📈', 'Transfers': '🔄',
                  'Kids': '👶', 'Home': '🔧', 'Other': '📦',
                };
                const byCategory: Record<string, number> = {};
                for (const t of selectedMonthExpenses) {
                  const desc = (t.description ?? '').toLowerCase();
                  let cat = 'Other';
                  for (const [kw, c] of Object.entries(MERCHANT_CATEGORIES)) {
                    if (desc.includes(kw) && c !== 'Income' && c !== 'Transfers') { cat = c; break; }
                  }
                  byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
                }
                const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
                const total = sorted.reduce((s, [, v]) => s + v, 0);
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💸 Expenses by Category</Text>
                    {sorted.map(([cat, amt], i) => {
                      const pct = Math.round((amt / total) * 100);
                      const icon = CATEGORY_ICONS[cat] ?? '📦';
                      return (
                        <View key={`cat-${i}`} style={{ marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: Colors.text, fontWeight: '600' }}>{icon} {cat}</Text>
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: Colors.textDim }}>{pct}%</Text>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.danger }}>${amt.toFixed(2)}</Text>
                            </View>
                          </View>
                          <View style={{ height: 5, backgroundColor: Colors.border, borderRadius: 3 }}>
                            <View style={{ height: 5, width: `${pct}%` as any, backgroundColor: Colors.primary, borderRadius: 3 }} />
                          </View>
                        </View>
                      );
                    })}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Total Expenses</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.danger }}>${total.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Subscriptions detected this month */}
              {(() => {
                const ym = selectedMonthKey ? (() => {
                  const parts = selectedMonthKey.split(' ');
                  if (parts.length === 2) {
                    const months: Record<string,string> = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' };
                    return `${parts[1]}-${months[parts[0]] ?? '01'}`;
                  }
                  return null;
                })() : null;
                if (!ym) return null;
                const monthSubs = subsForMonth.filter(s => !s.cancelled);
                if (monthSubs.length === 0) return null;
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📡 Subscriptions</Text>
                    {monthSubs.map((sub, i) => (
                      <View key={`ms-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: i < monthSubs.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}>
                        <Text style={{ fontSize: 13, color: Colors.text, flex: 1 }} numberOfLines={1}>{sub.description}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#a78bfa', marginLeft: 8 }}>${sub.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>Total Subscriptions</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#a78bfa' }}>${monthSubs.reduce((s, sub) => s + sub.amount, 0).toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Debt tracker */}
              {debts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💳 Debt Tracker</Text>
                  {debts.map((debt, idx) => {
                    const original = debt.originalAmount || (debt.amount + (debt.amountPaid ?? 0));
                    const paid = debt.amountPaid || 0;
                    const progress = Math.min(100, (paid / original) * 100);
                    const monthlyRate = debt.interest / 100 / 12;
                    const nextInterest = parseFloat((debt.amount * monthlyRate).toFixed(2));
                    const nextPrincipal = parseFloat(Math.max(0, debt.payment - nextInterest).toFixed(2));
                    return (
                      <TouchableOpacity key={`md-${debt.id}-${idx}`} style={styles.debtCard} onPress={() => { setSelectedDebt(debt); setDebtDetailVisible(true); }} activeOpacity={0.7}>
                        <View style={styles.debtHeader}>
                          <View style={styles.debtInfo}>
                            <Text style={styles.debtName}>💳 {debt.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                              <Text style={styles.debtAmount}>${debt.amount.toFixed(2)}</Text>
                              {paid > 0 && <Text style={{ fontSize: 11, color: Colors.textDim }}>of ${original.toFixed(2)}</Text>}
                            </View>
                            <Text style={styles.debtDetails}>{debt.interest}% APR • ${debt.payment}/mo • Due day {debt.dueDay || debt.due}</Text>
                            {paid > 0 && <Text style={{ fontSize: 11, color: Colors.success, marginTop: 2 }}>${paid.toFixed(2)} paid off total</Text>}
                            {debt.payment > 0 && debt.interest > 0 && (
                              <Text style={{ fontSize: 11, color: Colors.textDim, marginTop: 2 }}>Next: ${nextPrincipal.toFixed(2)} principal + ${nextInterest.toFixed(2)} interest</Text>
                            )}
                          </View>
                        </View>
                        {paid > 0 && (
                          <View style={{ marginTop: 8, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                            <View style={{ width: `${progress}%`, height: 6, backgroundColor: Colors.success, borderRadius: 3 }} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Savings goals */}
              {savings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎯 Savings Goals</Text>
                  {savings.map((goal, idx) => {
                    const progress = Math.min(100, (goal.current / goal.target) * 100);
                    return (
                      <View key={`ms-${goal.id}-${idx}`} style={styles.savingsCard}>
                        <View style={styles.savingsHeader}>
                          <View style={styles.savingsInfo}>
                            <Text style={styles.savingsName}>🎯 {goal.name}</Text>
                            <Text style={styles.savingsAmount}>
                              ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}
                            </Text>
                            <Text style={styles.savingsDetails}>
                              ${goal.monthly}/mo • Deadline: {goal.deadline}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.success }}>
                            {progress.toFixed(0)}%
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: Colors.success }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Transactions */}
              {selectedMonthExpenses.length === 0 && selectedMonthIncomes.length === 0 && (
                <Text style={{ color: Colors.textDim, textAlign: 'center', marginVertical: 24, fontSize: 14 }}>
                  No transactions yet for this month.{'\n'}Use the buttons below to add income or expenses.
                </Text>
              )}
              {selectedMonthExpenses.length > 0 && (
                <View style={styles.txnGroup}>
                  <Text style={styles.txnGroupTitle}>💸 Expenses ({selectedMonthExpenses.length})</Text>
                  {selectedMonthExpenses.map((t, idx) => {
                    const budget = budgets.find(b => b.id === t.budgetId);
                    return (
                      <TouchableOpacity
                        key={`me-${t.id}-${idx}`}
                        style={[styles.transactionCard, { borderLeftColor: Colors.danger }]}
                        onPress={() => {
                          setMonthDetailVisible(false);
                          openTransactionModal(t);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionName}>
                            💸 {budget?.name || t.description || 'Expense'}
                          </Text>
                          {t.description && budget && (
                            <Text style={styles.transactionDesc}>{t.description}</Text>
                          )}
                          <Text style={styles.transactionDate}>{t.date}</Text>
                        </View>
                        <View style={styles.transactionRight}>
                          <Text style={[styles.transactionAmount, { color: Colors.danger }]}>
                            -${t.amount.toFixed(2)}
                          </Text>
                          <View style={styles.transactionActions}>
                            <TouchableOpacity onPress={() => { setMonthDetailVisible(false); openTransactionModal(t); }} style={styles.iconButton}>
                              <Edit2 size={14} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteTransaction(t.id)} style={styles.iconButton}>
                              <Trash2 size={14} color={Colors.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {selectedMonthIncomes.length > 0 && (
                <View style={styles.txnGroup}>
                  <Text style={styles.txnGroupTitle}>💰 Income ({selectedMonthIncomes.length})</Text>
                  {selectedMonthIncomes.map((t, idx) => (
                    <TouchableOpacity
                      key={`mi-${t.id}-${idx}`}
                      style={[styles.transactionCard, { borderLeftColor: Colors.success }]}
                      onPress={() => {
                        setMonthDetailVisible(false);
                        openTransactionModal(t);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName}>
                          💰 {t.description || 'Income'}
                        </Text>
                        <Text style={styles.transactionDate}>{t.date}</Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: Colors.success }]}>
                          +${t.amount.toFixed(2)}
                        </Text>
                        <View style={styles.transactionActions}>
                          <TouchableOpacity onPress={() => { setMonthDetailVisible(false); openTransactionModal(t); }} style={styles.iconButton}>
                            <Edit2 size={14} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTransaction(t.id)} style={styles.iconButton}>
                            <Trash2 size={14} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Add buttons at bottom of modal */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => {
                    setMonthDetailVisible(false);
                    openTransactionModal(undefined, undefined, 'expense');
                  }}
                >
                  <View style={[styles.actionButtonSecondary, { borderColor: Colors.danger }]}>
                    <Plus size={16} color={Colors.danger} />
                    <Text style={[styles.actionButtonTextSecondary, { color: Colors.danger }]}>Add Expense</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => {
                    setMonthDetailVisible(false);
                    openTransactionModal(undefined, undefined, 'income');
                  }}
                >
                  <View style={[styles.actionButtonSecondary, { borderColor: Colors.success }]}>
                    <Plus size={16} color={Colors.success} />
                    <Text style={[styles.actionButtonTextSecondary, { color: Colors.success }]}>Add Income</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Budget Detail Modal */}
      <Modal
        visible={budgetDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBudgetDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: modalPaddingBottom }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>
                {selectedBudgetForDetail?.icon} {selectedBudgetForDetail?.name}
              </Text>
              <TouchableOpacity onPress={() => setBudgetDetailVisible(false)}>
                <ChevronDown size={24} color={Colors.textDim} />
              </TouchableOpacity>
            </View>

            {selectedBudgetForDetail && (() => {
              const detailSpent = monthlySpentByBudgetId[selectedBudgetForDetail.id] ?? 0;
              return (
              <View style={styles.monthSummaryRow}>
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>Spent</Text>
                  <Text style={[styles.monthSummaryValue, { color: Colors.danger }]}>
                    ${detailSpent.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.monthSummaryDivider} />
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>Budget</Text>
                  <Text style={styles.monthSummaryValue}>
                    ${selectedBudgetForDetail.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.monthSummaryDivider} />
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>Remaining</Text>
                  <Text style={[styles.monthSummaryValue, {
                    color: selectedBudgetForDetail.amount - detailSpent >= 0
                      ? Colors.success : Colors.danger
                  }]}>
                    ${(selectedBudgetForDetail.amount - detailSpent).toFixed(2)}
                  </Text>
                </View>
              </View>
              );
            })()}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              {budgetDetailTransactions.length === 0 ? (
                <Text style={{ color: Colors.textDim, textAlign: 'center', marginVertical: 24, fontSize: 14 }}>
                  No transactions yet for this category.
                </Text>
              ) : (
                <>
                  {(() => {
                    const subs = budgetDetailTransactions.filter(t =>
                      SUBSCRIPTION_KEYWORDS.some(k => (t.description ?? '').toLowerCase().includes(k))
                    );
                    if (subs.length === 0) return null;
                    return (
                      <View style={styles.txnGroup}>
                        <Text style={styles.txnGroupTitle}>📡 Subscriptions ({subs.length})</Text>
                        {subs.map((t, idx) => (
                          <TouchableOpacity
                            key={`bds-${t.id}-${idx}`}
                            style={[styles.transactionCard, { borderLeftColor: Colors.warning ?? '#f59e0b', borderLeftWidth: 3 }]}
                            onPress={() => { setBudgetDetailVisible(false); openTransactionModal(t); }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionName}>📡 {t.description || 'Subscription'}</Text>
                              <Text style={styles.transactionDate}>{t.date}</Text>
                            </View>
                            <View style={styles.transactionRight}>
                              <Text style={[styles.transactionAmount, { color: Colors.danger }]}>
                                -${t.amount.toFixed(2)}
                              </Text>
                              <View style={styles.transactionActions}>
                                <TouchableOpacity onPress={() => { setBudgetDetailVisible(false); openTransactionModal(t); }} style={styles.iconButton}>
                                  <Edit2 size={14} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteTransaction(t.id)} style={styles.iconButton}>
                                  <Trash2 size={14} color={Colors.danger} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })()}
                <View style={styles.txnGroup}>
                  <Text style={styles.txnGroupTitle}>💸 All Transactions ({budgetDetailTransactions.length})</Text>
                  {budgetDetailTransactions.map((t, idx) => (
                    <TouchableOpacity
                      key={`bd-${t.id}-${idx}`}
                      style={[styles.transactionCard, { borderLeftColor: Colors.danger }]}
                      onPress={() => {
                        setBudgetDetailVisible(false);
                        openTransactionModal(t);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName}>
                          {t.description || 'Expense'}
                        </Text>
                        <Text style={styles.transactionDate}>{t.date}</Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: Colors.danger }]}>
                          -${t.amount.toFixed(2)}
                        </Text>
                        <View style={styles.transactionActions}>
                          <TouchableOpacity
                            onPress={() => { setBudgetDetailVisible(false); openTransactionModal(t); }}
                            style={styles.iconButton}
                          >
                            <Edit2 size={14} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteTransaction(t.id)}
                            style={styles.iconButton}
                          >
                            <Trash2 size={14} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => {
                    setBudgetDetailVisible(false);
                    openTransactionModal(undefined, selectedBudgetForDetail?.id, 'expense');
                  }}
                >
                  <View style={[styles.actionButtonSecondary, { borderColor: Colors.danger }]}>
                    <Plus size={16} color={Colors.danger} />
                    <Text style={[styles.actionButtonTextSecondary, { color: Colors.danger }]}>Add Expense</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => {
                    setBudgetDetailVisible(false);
                    openBudgetModal(selectedBudgetForDetail || undefined);
                  }}
                >
                  <View style={styles.actionButtonSecondary}>
                    <Edit2 size={16} color={Colors.text} />
                    <Text style={styles.actionButtonTextSecondary}>Edit Budget</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Widget & Notification Settings Modal ──────────────────────── */}
      <Modal
        visible={widgetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWidgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', paddingBottom: modalPaddingBottom }]}>
            <Text style={styles.modalTitle}>📱 Widgets & Notifications</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>

              {/* Home screen widget info */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 6 }]}>Budget Overview Widget</Text>
                <Text style={{ color: Colors.textDim, fontSize: 13, lineHeight: 20 }}>
                  Long-press your Android home screen → Widgets → Zenith → Budget Overview. Shows this month's income, expenses, and net cashflow.
                </Text>
              </View>


              {/* Other available widgets */}
              <View style={{ backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 20 }}>
                <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>🧩 Other Available Widgets</Text>
                {[
                  { name: 'Tasks Today', screen: 'Tasks screen' },
                  { name: 'Habits Today', screen: 'Habits screen' },
                  { name: 'Calendar Agenda', screen: 'Calendar screen' },
                  { name: 'Notes Overview', screen: 'Notes screen' },
                  { name: 'Top 5 Priorities', screen: 'Home screen' },
                  { name: 'Gift Tracker', screen: 'Gifts screen' },
                  { name: '2026 Bingo Goals', screen: 'Bingo screen' },
                ].map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: Colors.textDim, fontSize: 12 }}>{w.name}</Text>
                    <Text style={{ color: Colors.primary, fontSize: 12 }}>{w.screen}</Text>
                  </View>
                ))}
                <Text style={{ color: Colors.textDim, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
                  Each screen has its own Widget settings button with notification toggles.
                </Text>
              </View>

            </ScrollView>

            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 8 }]}
              onPress={() => setWidgetModalVisible(false)}
            >
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native';

const zbStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textDim,
    lineHeight: 18,
    marginBottom: 14,
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  incomeLabel: {
    fontSize: 13,
    color: Colors.textDim,
    fontWeight: '500' as const,
  },
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencyPrefix: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  incomeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
    minWidth: 90,
    textAlign: 'right',
  },
  incomeConfirm: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  incomeConfirmText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  incomeValueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textDim,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.danger,
    lineHeight: 17,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  successText: {
    flex: 1,
    fontSize: 12,
    color: Colors.success,
    lineHeight: 17,
  },
});
