import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { X, Check, Calendar as CalendarIcon } from 'lucide-react-native';

import { FONTS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { addExpense, updateExpense, getCategoriesForUser, getMonthlyTotal } from '../db/queries';
import { formatINR } from '../utils/dateHelpers';

const BRAND_PURPLE = '#6C4CF1';
const BG_WHITE = '#FFFFFF';
const BG_APP = '#FAFAFC';
const TEXT_DARK = '#1C1C28';
const TEXT_MUTED = '#8F92A1';
const BORDER_COLOR = '#E4E7ED';

// Custom Date formatter "5 Jun 2024, 9:30 AM"
const formatCustomDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };
  return d.toLocaleDateString('en-GB', options);
};

export default function AddExpenseScreen({ navigation, route }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const editingExpense = route.params?.expense || null;
  const isEditing = !!editingExpense;

  // Ensure default date includes current time for "9:30 AM" format
  const initialDate = editingExpense ? new Date(editingExpense.date) : new Date();

  // Form state
  const [amount, setAmount]           = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [date, setDate]               = useState(initialDate.toISOString());
  const [categoryId, setCategoryId]   = useState(editingExpense?.category_id || null);
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.payment_method || 'Cash');
  const [loading, setLoading]         = useState(false);

  // Dropdowns
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [catItems, setCatItems]       = useState([]);
  
  const [payDropOpen, setPayDropOpen] = useState(false);
  const [payItems, setPayItems]       = useState([
    { label: 'Cash', value: 'Cash' },
    { label: 'Card', value: 'Card' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      const dbCats = getCategoriesForUser(user.id);
      const items = dbCats.map(c => ({
        label: c.name,
        value: c.id,
        icon: () => (
          <View style={[styles.dropdownIconWrap, { backgroundColor: c.color + '22' }]}>
            <Text style={styles.dropdownIconText}>{c.icon || '📦'}</Text>
          </View>
        )
      }));
      setCatItems(items);
      if (!isEditing && items.length > 0) {
        setCategoryId(items[0].value);
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount');
      return;
    }
    if (!categoryId) {
      Alert.alert('Category Required', 'Please select a category');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        categoryId,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        paymentMethod,
      };

      if (isEditing) {
        updateExpense({ id: editingExpense.id, ...payload });
      } else {
        addExpense(payload);
        
        // Logical Push Notification Check: Did this expense blow the monthly budget?
        const currentMonthKey = date.substring(0, 7); // 'YYYY-MM'
        const newTotal = getMonthlyTotal(user.id, currentMonthKey);
        if (user.monthly_budget && user.monthly_budget > 0 && newTotal > user.monthly_budget) {
          addNotification({
            title: 'Budget Exceeded! ⚠️',
            message: `You've spent ${formatINR(newTotal)}, which exceeds your monthly budget of ${formatINR(user.monthly_budget)}.`,
            type: 'warning',
            time: new Date().toISOString(),
          });
        } else if (user.monthly_budget && user.monthly_budget > 0 && newTotal > user.monthly_budget * 0.9) {
          addNotification({
            title: 'Nearing Budget Limit ⚠️',
            message: `You've spent ${formatINR(newTotal)}, which is over 90% of your monthly budget.`,
            type: 'warning',
            time: new Date().toISOString(),
          });
        }
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString());
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* Header (X - Title - ✓) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <X stroke={TEXT_DARK} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.iconBtn} disabled={loading}>
            {loading ? <ActivityIndicator color={BRAND_PURPLE} /> : <Check stroke={TEXT_DARK} size={24} />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Category Dropdown */}
          <Text style={styles.label}>Category</Text>
          <DropDownPicker
            open={catDropOpen}
            value={categoryId}
            items={catItems}
            setOpen={setCatDropOpen}
            setValue={setCategoryId}
            setItems={setCatItems}
            onOpen={() => setPayDropOpen(false)}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            placeholderStyle={{ color: TEXT_MUTED }}
            placeholder="Select category"
            listMode="MODAL"
            modalProps={{ animationType: 'slide' }}
            modalTitle="Select Category"
          />

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputCard}>
            <Text style={styles.rupeeSymbol}>₹ </Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={[styles.inputCard, styles.rowBetween]} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{formatCustomDate(date)}</Text>
            <CalendarIcon stroke={TEXT_DARK} size={20} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="datetime"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Payment Method */}
          <Text style={styles.label}>Payment Method</Text>
          <DropDownPicker
            open={payDropOpen}
            value={paymentMethod}
            items={payItems}
            setOpen={setPayDropOpen}
            setValue={setPaymentMethod}
            setItems={setPayItems}
            onOpen={() => setCatDropOpen(false)}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            placeholderStyle={{ color: TEXT_MUTED }}
            placeholder="Select payment method"
            listMode="MODAL"
            modalProps={{ animationType: 'slide' }}
            modalTitle="Select Payment Method"
          />

          {/* Notes (Optional) */}
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.inputCard, styles.textArea]}
            placeholder="What was this for?"
            placeholderTextColor={TEXT_MUTED}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={120}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_APP },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: BG_APP,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK },
  
  container: { padding: 20, paddingBottom: 60 },
  
  label: { fontFamily: FONTS.semiBold, fontSize: 13, color: TEXT_DARK, marginBottom: 8, marginTop: 20 },
  
  inputCard: {
    backgroundColor: BG_WHITE,
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  rowBetween: { justifyContent: 'space-between' },
  
  rupeeSymbol: { fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK },
  amountInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK },
  
  dateText: { fontFamily: FONTS.semiBold, fontSize: 15, color: TEXT_DARK },
  
  textArea: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: 16,
    textAlignVertical: 'top',
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: TEXT_DARK,
  },

  dropdown: {
    backgroundColor: BG_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    minHeight: 56,
  },
  dropdownContainer: {
    backgroundColor: BG_WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  dropdownText: { fontFamily: FONTS.semiBold, fontSize: 15, color: TEXT_DARK },
  dropdownIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dropdownIconText: { fontSize: 16 },
});
