import React, { useState, useMemo } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import styles from '@/styles/budgetStyles';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useData } from '@/contexts/DataContext';
import { Budget, Transaction, Debt, Savings } from '@/types';
import { processCSVData, cleanDescription, categorizeTransaction } from '@/utils/budgetHelpers';
import { extractTextFromPDF, isPDFContent } from '@/utils/pdfExtractor';

export default function BudgetScreen() {
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

  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');
  const [savingsMonthly, setSavingsMonthly] = useState('');
  const [savingsDeadline, setSavingsDeadline] = useState('');

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [monthDetailVisible, setMonthDetailVisible] = useState(false);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(() => {
    const now = new Date();
    return new Set([`${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`]);
  });
  const [expandedArchiveYears, setExpandedArchiveYears] = useState<Set<number>>(new Set());

  const thisMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === thisMonth;
  });

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalSavingsTarget = savings.reduce((sum, s) => sum + s.target, 0);
  const totalSavingsCurrent = savings.reduce((sum, s) => sum + s.current, 0);

  const monthsWithData = useMemo(() => {
    const monthMap: Record<string, { income: number; expenses: number; transactions: Transaction[] }> = {};
    for (const t of transactions) {
      const rawDate = t.date.split('T')[0];
      const parts = rawDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const tempDate = new Date(year, month, 1);
      const key = tempDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
  }, [transactions]);

  const yearlyGroupedData = useMemo(() => {
    const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
    const currentYear = new Date().getFullYear();
    const yearMap: Record<number, Record<number, { income: number; expenses: number; monthMap: Record<string, { income: number; expenses: number; transactions: Transaction[] }> }>> = {};
    for (const t of transactions) {
      const rawDate = t.date.split('T')[0];
      const parts = rawDate.split('-');
      const parsedYear = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (isNaN(month)) continue;
      // Remap corrupt years (e.g. 1901) to current year for display
      const year = (isNaN(parsedYear) || parsedYear < 2000) ? currentYear : parsedYear;
      const quarter = Math.ceil(month / 3);
      const monthKey = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!yearMap[year]) yearMap[year] = {};
      if (!yearMap[year][quarter]) yearMap[year][quarter] = { income: 0, expenses: 0, monthMap: {} };
      if (!yearMap[year][quarter].monthMap[monthKey]) yearMap[year][quarter].monthMap[monthKey] = { income: 0, expenses: 0, transactions: [] };
      if (t.type === 'income') {
        yearMap[year][quarter].income += t.amount;
        yearMap[year][quarter].monthMap[monthKey].income += t.amount;
      } else {
        yearMap[year][quarter].expenses += t.amount;
        yearMap[year][quarter].monthMap[monthKey].expenses += t.amount;
      }
      yearMap[year][quarter].monthMap[monthKey].transactions.push(t);
    }
    return Object.entries(yearMap)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([yearStr, quarters]) => {
        const year = parseInt(yearStr);
        return {
          year,
          isCurrent: year === currentYear,
          quarters: [1, 2, 3, 4].map(q => {
            const qData = quarters[q] || { income: 0, expenses: 0, monthMap: {} };
            const months = Object.entries(qData.monthMap)
              .map(([key, data]) => ({
                key,
                income: data.income,
                expenses: data.expenses,
                cashflow: data.income - data.expenses,
                transactions: data.transactions,
              }))
              .sort((a, b) => {
                const [am, ay] = a.key.split(' ');
                const [bm, by] = b.key.split(' ');
                return new Date(`${bm} 1, ${by}`).getTime() - new Date(`${am} 1, ${ay}`).getTime();
              });
            return {
              quarter: q,
              label: QUARTER_LABELS[q - 1],
              income: qData.income,
              expenses: qData.expenses,
              cashflow: qData.income - qData.expenses,
              months,
              hasData: months.length > 0,
            };
          }),
        };
      });
  }, [transactions]);

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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    } else {
      setEditingId(null);
      setDebtName('');
      setDebtAmount('');
      setDebtInterest('');
      setDebtPayment('');
      setDebtDue('');
    }
    setDebtModalVisible(true);
  };

  const handleSaveDebt = () => {
    if (!debtName.trim() || !debtAmount) return;

    const debtData: Omit<Debt, 'id'> = {
      name: debtName.trim(),
      amount: parseFloat(debtAmount),
      interest: parseFloat(debtInterest) || 0,
      payment: parseFloat(debtPayment) || 0,
      due: debtDue,
    };

    if (editingId) {
      updateDebt(editingId, debtData);
    } else {
      addDebt(debtData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };



  const processCSVText = (text: string) => {
    try {
      setUploadStatus('Processing transactions...');
      console.log('CSV text length:', text.length);

      const result = processCSVData(text, budgets);
      console.log('Import results:', { imported: result.imported.length, skipped: result.skipped, errors: result.errors });

      if (result.errors.length > 0 && result.imported.length === 0) {
        setUploadStatus(result.errors[0]);
        setIsUploading(false);
        return;
      }

      for (const t of result.imported) {
        addTransaction(t);
      }

      if (result.imported.length === 0) {
        const hint = result.errors.length > 0 ? `\nDebug: ${result.errors.join(', ')}` : '';
        setUploadStatus(
          `No transactions imported${result.skipped > 0 ? ` (${result.skipped} rows skipped)` : ''}. Check CSV format.${hint}`
        );
        setIsUploading(false);
        return;
      }

      const skipMsg = result.skipped > 0
        ? ` (${result.skipped} row${result.skipped > 1 ? 's' : ''} skipped)`
        : '';
      setUploadStatus(`Imported ${result.imported.length} transactions${skipMsg}`);
      setIsUploading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.skipped > 0 && result.errors.length > 0) {
        setTimeout(() => {
          Alert.alert(
            `${result.skipped} Row${result.skipped > 1 ? 's' : ''} Skipped`,
            result.errors.join('\n\n'),
            [{ text: 'OK' }]
          );
        }, 500);
      }
      setTimeout(() => {
        setUploadModalVisible(false);
        setUploadStatus('');
      }, 2500);
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 {thisMonth}</Text>
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
            <Text style={styles.netLabel}>Net Cashflow</Text>
            <Text style={[styles.netAmount, { color: netCashflow >= 0 ? Colors.success : Colors.danger }]}>
              {netCashflow >= 0 ? '+' : ''}${netCashflow.toFixed(2)}
            </Text>
          </View>
        </View>

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

        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadStatement}
          >
            <Upload size={18} color={Colors.primary} />
            <Text style={styles.uploadButtonText}>Upload Statement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
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
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
                  },
                ]
              );
            }}
          >
            <RotateCcw size={16} color={Colors.danger} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Budgets</Text>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets set up yet</Text>
          ) : (
            budgets.map((budget, idx) => {
              const percent = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
              const isOverBudget = budget.spent > budget.amount;

              return (
                <TouchableOpacity
                  key={`budget-${budget.id}-${idx}`}
                  style={styles.budgetCard}
                  onPress={() => openBudgetModal(budget)}
                  activeOpacity={0.7}
                >
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetIcon}>{budget.icon}</Text>
                      <View>
                        <Text style={styles.budgetName}>{budget.name}</Text>
                        <Text style={styles.budgetSpent}>
                          ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                        </Text>
                        {budget.recurring && (
                          <Text style={styles.budgetRecurringLabel}>🔄 Recurring</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.budgetActions}>
                      <TouchableOpacity
                        onPress={() => openBudgetModal(budget)}
                        style={styles.iconButton}
                      >
                        <Edit2 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteBudget(budget.id, budget.name)}
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
                          width: `${Math.min(100, percent)}%`,
                          backgroundColor: isOverBudget ? Colors.danger : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addExpenseButton}
                    onPress={() => openTransactionModal(undefined, budget.id, 'expense')}
                  >
                    <Text style={styles.addExpenseText}>+ Add Expense</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
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
            debts.map((debt, idx) => (
              <TouchableOpacity
                key={`debt-${debt.id}-${idx}`}
                style={styles.debtCard}
                onPress={() => openDebtModal(debt)}
                activeOpacity={0.7}
              >
                <View style={styles.debtHeader}>
                  <View style={styles.debtInfo}>
                    <Text style={styles.debtName}>💳 {debt.name}</Text>
                    <Text style={styles.debtAmount}>${debt.amount.toFixed(2)}</Text>
                    <Text style={styles.debtDetails}>
                      {debt.interest}% APR • ${debt.payment}/mo • Due: {debt.due}
                    </Text>
                  </View>
                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      onPress={() => openDebtModal(debt)}
                      style={styles.iconButton}
                    >
                      <Edit2 size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteDebt(debt.id, debt.name)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
                        if (!quarter.hasData) return null;
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
                              <View style={styles.quarterSummary}>
                                <Text style={{ color: Colors.success, fontSize: 12 }}>+${quarter.income.toFixed(0)}</Text>
                                <Text style={{ color: Colors.danger, fontSize: 12, marginLeft: 8 }}>-${quarter.expenses.toFixed(0)}</Text>
                              </View>
                              {isExpanded ? <ChevronUp size={16} color={Colors.textDim} /> : <ChevronDown size={16} color={Colors.textDim} />}
                            </TouchableOpacity>
                            {isExpanded && (
                              <View style={styles.monthsGrid}>
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
                                  </TouchableOpacity>
                                ))}
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
                          {yearData.quarters.filter(q => q.hasData).map(quarter => {
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
              <View style={styles.modalContent}>
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
              <View style={styles.modalContent}>
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
              <View style={styles.modalContent}>
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
            <TextInput
              style={styles.modalInput}
              placeholder="Due date"
              placeholderTextColor={Colors.textDim}
              value={debtDue}
              onChangeText={setDebtDue}
            />
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
              <View style={styles.modalContent}>
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
          <View style={styles.modalContent}>
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

      {/* Month Detail Modal */}
      <Modal
        visible={monthDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>{selectedMonthKey}</Text>
              <TouchableOpacity onPress={() => setMonthDetailVisible(false)}>
                <ChevronDown size={24} color={Colors.textDim} />
              </TouchableOpacity>
            </View>

            {selectedMonthData && (
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
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
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

    </SafeAreaView>
  );
}

