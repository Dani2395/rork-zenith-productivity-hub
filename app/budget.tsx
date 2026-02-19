import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useData } from '@/contexts/DataContext';
import { Budget, Transaction, Debt, Savings } from '@/types';

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

  const parseDate = (dateStr: string): string => {
    const trimmed = dateStr.trim();
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [m, d, y] = trimmed.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // DD/MM/YYYY (fallback)
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [m, d, y] = trimmed.split('-');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Try native Date parsing as last resort
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const processCSVText = (text: string) => {
    setUploadStatus('Processing transactions...');

    const lines = text.split(/\r?\n/);
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length < 3) {
        skipped++;
        continue;
      }

      const dateStr = parts[0]?.trim();
      const description = parts[1]?.trim();
      const amountStr = parts[2]?.trim().replace(/[^0-9.\-]/g, '');
      const amountNum = parseFloat(amountStr);

      if (!dateStr || isNaN(amountNum) || amountNum === 0) {
        skipped++;
        continue;
      }

      const isExpense = amountNum < 0;
      const amount = Math.abs(amountNum);
      const date = parseDate(dateStr);

      addTransaction({
        amount,
        description: description || (isExpense ? 'Expense' : 'Income'),
        date,
        type: isExpense ? 'expense' : 'income',
      });

      imported++;
    }

    if (imported === 0) {
      setUploadStatus(
        `No transactions could be imported${skipped > 0 ? ` (${skipped} rows skipped)` : ''}. Check the CSV format.`
      );
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 5000);
      return;
    }

    setUploadStatus(`Imported ${imported} transactions${skipped > 0 ? ` (${skipped} rows skipped)` : ''}`);
    setIsUploading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setUploadModalVisible(false);
      setUploadStatus('');
    }, 2000);
  };

  const triggerWebFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,text/csv,text/plain';
    input.onchange = (event: any) => {
      const selectedFile = event.target?.files?.[0];
      if (!selectedFile) {
        console.log('No file selected');
        return;
      }

      console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
      setIsUploading(true);
      setUploadStatus('Reading file...');

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        console.log('File read complete, length:', text?.length);
        if (!text || text.trim().length === 0) {
          setUploadStatus('File appears to be empty');
          setIsUploading(false);
          setTimeout(() => setUploadStatus(''), 3000);
          return;
        }
        processCSVText(text);
      };
      reader.onerror = () => {
        console.log('FileReader error');
        setUploadStatus('Error reading file. Please try again.');
        setIsUploading(false);
        setTimeout(() => setUploadStatus(''), 5000);
      };
      reader.readAsText(selectedFile);
    };
    input.click();
  };

  const handleUploadStatement = async () => {
    if (Platform.OS === 'web') {
      triggerWebFilePicker();
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Picking file...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploadStatus('');
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const fileName = file.name?.toLowerCase() || '';
      const mimeType = file.mimeType?.toLowerCase() || '';

      if (
        !fileName.endsWith('.csv') &&
        !fileName.endsWith('.txt') &&
        !mimeType.includes('csv') &&
        !mimeType.includes('text')
      ) {
        setUploadStatus('Please upload a CSV or text file');
        setIsUploading(false);
        setTimeout(() => setUploadStatus(''), 3000);
        return;
      }

      setUploadStatus('Reading file...');

      let text: string;
      try {
        text = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (readError) {
        const response = await fetch(file.uri);
        text = await response.text();
      }

      if (!text || text.trim().length === 0) {
        setUploadStatus('File appears to be empty');
        setIsUploading(false);
        setTimeout(() => setUploadStatus(''), 3000);
        return;
      }

      processCSVText(text);
    } catch (error) {
      console.log('Upload error:', error);
      setUploadStatus('Error processing file. Please check the format and try again.');
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 5000);
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

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setUploadModalVisible(true)}
        >
          <Upload size={18} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Upload Bank Statement (CSV)</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Budgets</Text>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets set up yet</Text>
          ) : (
            budgets.map(budget => {
              const percent = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
              const isOverBudget = budget.spent > budget.amount;

              return (
                <TouchableOpacity
                  key={budget.id}
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
            debts.map(debt => (
              <TouchableOpacity
                key={debt.id}
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
            savings.map(goal => {
              const progress = Math.min(100, (goal.current / goal.target) * 100);
              return (
                <TouchableOpacity
                  key={goal.id}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            [...transactions]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 15)
              .map(t => {
                const budget = budgets.find(b => b.id === t.budgetId);
                const isIncome = t.type === 'income';

                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.transactionCard,
                      { borderLeftColor: isIncome ? Colors.success : Colors.danger },
                    ]}
                    onPress={() => openTransactionModal(t)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>
                        {isIncome ? '💰' : '💸'}{' '}
                        {isIncome ? (t.description || 'Income') : (budget?.name || 'Expense')}
                      </Text>
                      {t.description && !isIncome && (
                        <Text style={styles.transactionDesc}>{t.description}</Text>
                      )}
                      <Text style={styles.transactionDate}>{t.date}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: isIncome ? Colors.success : Colors.danger },
                        ]}
                      >
                        {isIncome ? '+' : '-'}${t.amount.toFixed(2)}
                      </Text>
                      <View style={styles.transactionActions}>
                        <TouchableOpacity
                          onPress={() => openTransactionModal(t)}
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
                );
              })
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
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Bank Statement</Text>
            <Text style={styles.uploadInstructions}>
              Upload a CSV file with the following format:{`\n\n`}
              Date, Description, Amount{`\n`}
              2024-01-15, Grocery Store, -45.99{`\n`}
              2024-01-16, Salary Deposit, 2500.00{`\n\n`}
              Negative amounts are expenses, positive are income.
            </Text>
            
            {uploadStatus ? (
              <View style={styles.uploadStatusContainer}>
                <Text style={styles.uploadStatus}>{uploadStatus}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setUploadModalVisible(false);
                  setUploadStatus('');
                  setIsUploading(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleUploadStatement}
                disabled={isUploading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Choose File</Text>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  netContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: 4,
  },
  netAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  metricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textDim,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  uploadInstructions: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 8,
  },
  uploadStatusContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadStatus: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    paddingVertical: 20,
    fontSize: 14,
  },
  budgetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetIcon: {
    fontSize: 24,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  budgetSpent: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
  budgetRecurringLabel: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  addExpenseButton: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  addExpenseText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  debtCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.danger,
    marginBottom: 4,
  },
  debtDetails: {
    fontSize: 11,
    color: Colors.textDim,
  },
  savingsCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
    marginBottom: 4,
  },
  savingsDetails: {
    fontSize: 11,
    color: Colors.textDim,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textDim,
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transactionDesc: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
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
  amountInput: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textDim,
  },
  typeButtonTextActive: {
    color: 'white',
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
});
