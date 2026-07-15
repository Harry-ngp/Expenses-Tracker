import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';

import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { addExpense, updateExpense, getCategoriesForUser } from '../db/queries';
import { todayISO, formatDate } from '../utils/dateHelpers';

export default function AddExpenseScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const editingExpense = route.params?.expense || null;
  const isEditing = !!editingExpense;

  // Form state
  const [amount, setAmount]           = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [date, setDate]               = useState(editingExpense?.date || todayISO());
  const [categoryId, setCategoryId]   = useState(editingExpense?.category_id || null);
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.payment_method || 'Cash');
  const [isRecurring, setIsRecurring] = useState(editingExpense?.is_recurring === 1);
  const [recurrenceDay, setRecurrenceDay] = useState(String(editingExpense?.recurrence_day || 1));
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});

  // Dropdowns
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [catItems, setCatItems]       = useState([]);
  
  const [payDropOpen, setPayDropOpen] = useState(false);
  const [payItems, setPayItems]       = useState([
    { label: '💵 Cash', value: 'Cash' },
    { label: '💳 Card', value: 'Card' },
    { label: '📱 UPI', value: 'UPI' },
    { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
  ]);

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      const dbCats = getCategoriesForUser(user.id);
      const items = dbCats.map(c => ({
        label: `${c.icon || '📦'}  ${c.name}`,
        value: c.id
      }));
      setCatItems(items);
      if (!isEditing && items.length > 0) {
        setCategoryId(items[0].value);
      }
    }
  }, [user]);

  const validate = () => {
    const e = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid positive amount';
    if (!date)       e.date     = 'Select a date';
    if (!categoryId) e.category = 'Select a category';
    if (isRecurring) {
      const day = Number(recurrenceDay);
      if (!day || day < 1 || day > 31) e.recurrenceDay = 'Enter a valid day (1–31)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        categoryId,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        paymentMethod,
        isRecurring,
        recurrenceDay: isRecurring ? Number(recurrenceDay) : null,
      };

      if (isEditing) {
        updateExpense({ id: editingExpense.id, ...payload });
      } else {
        addExpense(payload);
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
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {isEditing ? 'Edit Expense' : 'New Expense'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Amount input — hero style */}
          <LinearGradient colors={colors.gradientPrimary} style={styles.amountCard}>
            <Text style={[styles.currencyLabel, { color: 'rgba(255,255,255,0.8)' }]}>₹  INR</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSym}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: '' })); }}
              />
            </View>
            {errors.amount ? <Text style={styles.errorTextHero}>{errors.amount}</Text> : null}
          </LinearGradient>

          {/* Form fields */}
          <View style={[styles.form, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            
            {/* Category */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <DropDownPicker
              open={catDropOpen}
              value={categoryId}
              items={catItems}
              setOpen={setCatDropOpen}
              setValue={setCategoryId}
              setItems={setCatItems}
              onOpen={() => setPayDropOpen(false)}
              style={[styles.dropdown, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
              dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              textStyle={[styles.dropdownText, { color: colors.textPrimary }]}
              placeholderStyle={{ color: colors.textMuted }}
              arrowIconStyle={{ tintColor: colors.textSecondary }}
              tickIconStyle={{ tintColor: colors.primary }}
              theme={isDarkMode ? "DARK" : "LIGHT"}
              placeholder="Select category"
              zIndex={3000}
              zIndexInverse={1000}
            />
            {errors.category ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.category}</Text> : null}

            {/* Payment Method */}
            <Text style={[styles.label, { marginTop: SPACING.md, color: colors.textSecondary }]}>Payment Method</Text>
            <DropDownPicker
              open={payDropOpen}
              value={paymentMethod}
              items={payItems}
              setOpen={setPayDropOpen}
              setValue={setPaymentMethod}
              setItems={setPayItems}
              onOpen={() => setCatDropOpen(false)}
              style={[styles.dropdown, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
              dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              textStyle={[styles.dropdownText, { color: colors.textPrimary }]}
              placeholderStyle={{ color: colors.textMuted }}
              arrowIconStyle={{ tintColor: colors.textSecondary }}
              tickIconStyle={{ tintColor: colors.primary }}
              theme={isDarkMode ? "DARK" : "LIGHT"}
              placeholder="Select payment method"
              zIndex={2000}
              zIndexInverse={2000}
            />

            {/* Date */}
            <Text style={[styles.label, { marginTop: SPACING.md, color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity 
              style={[styles.dateBtn, { backgroundColor: colors.bgInput, borderColor: colors.border }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateBtnIcon}>📅</Text>
              <Text style={[styles.dateBtnText, { color: colors.textPrimary }]}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {/* Description */}
            <Text style={[styles.label, { marginTop: SPACING.md, color: colors.textSecondary }]}>
              Description <Text style={[styles.optional, { color: colors.textMuted }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.descInput, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="What was this for?"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={120}
            />

            {/* Recurring toggle */}
            <View style={[styles.recurringRow, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.recurringLabel, { color: colors.textPrimary }]}>Recurring Monthly</Text>
                <Text style={[styles.recurringSubLabel, { color: colors.textSecondary }]}>Auto-add every month</Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isRecurring ? '#fff' : colors.textMuted}
              />
            </View>

            {isRecurring && (
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Day of month (1–31)</Text>
                <TextInput
                  style={[styles.descInput, { height: 48, textAlignVertical: 'center', backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. 1 for 1st of month"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={recurrenceDay}
                  onChangeText={(t) => { setRecurrenceDay(t); setErrors((e) => ({ ...e, recurrenceDay: '' })); }}
                  maxLength={2}
                />
                {errors.recurrenceDay ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.recurrenceDay}</Text> : null}
              </View>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{isEditing ? '✓  Update Expense' : '+ Add Expense'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  flex:          { flex: 1 },
  container:     { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backIcon:      { fontSize: 20 },
  headerTitle:   { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg },
  amountCard: {
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  currencyLabel: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs, letterSpacing: 2, marginBottom: SPACING.sm },
  amountRow:     { flexDirection: 'row', alignItems: 'center' },
  rupeeSym:      { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxxl, color: 'rgba(255,255,255,0.7)', marginRight: 8 },
  amountInput:   { fontFamily: FONTS.bold, fontSize: 48, color: '#fff', minWidth: 140, textAlign: 'center' },
  errorTextHero: { color: '#FF4A5A', fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 4 },
  form:          { borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1 },
  label:         { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, marginBottom: 8 },
  optional:      { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  dropdown: {
    borderRadius: RADIUS.md, height: 52, borderWidth: 1
  },
  dropdownContainer: {
    borderRadius: RADIUS.md, borderWidth: 1
  },
  dropdownText:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.md },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md, height: 52,
  },
  dateBtnIcon:  { fontSize: 16, marginRight: SPACING.sm },
  dateBtnText:  { fontFamily: FONTS.medium, fontSize: FONTS.sizes.md },
  descInput: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md, minHeight: 72, textAlignVertical: 'top',
  },
  recurringRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  recurringLabel:    { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  recurringSubLabel: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 2 },
  saveBtn:           { marginTop: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  saveBtnGradient:   { height: 56, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:       { color: '#fff', fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg },
  errorText:         { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 4 },
});
