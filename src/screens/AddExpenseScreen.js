import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { addExpense, updateExpense } from '../db/queries';
import { CATEGORY_DROPDOWN_ITEMS } from '../constants/categories';
import { todayISO, formatDate } from '../utils/dateHelpers';

export default function AddExpenseScreen({ navigation, route }) {
  const { user } = useAuth();
  const editingExpense = route.params?.expense || null;
  const isEditing = !!editingExpense;

  // Form state
  const [amount, setAmount]           = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [date, setDate]               = useState(editingExpense?.date || todayISO());
  const [categoryId, setCategoryId]   = useState(editingExpense?.category_id || 1);
  const [isRecurring, setIsRecurring] = useState(editingExpense?.is_recurring === 1);
  const [recurrenceDay, setRecurrenceDay] = useState(String(editingExpense?.recurrence_day || 1));
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});

  // Dropdown
  const [dropOpen, setDropOpen]   = useState(false);
  const [items, setItems]         = useState(CATEGORY_DROPDOWN_ITEMS);

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'New Expense'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Amount input — hero style */}
          <LinearGradient colors={['#1A0A2E', '#16213E']} style={styles.amountCard}>
            <Text style={styles.currencyLabel}>₹  INR</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSym}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: '' })); }}
              />
            </View>
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </LinearGradient>

          {/* Form fields */}
          <View style={styles.form}>
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <DropDownPicker
              open={dropOpen}
              value={categoryId}
              items={items}
              setOpen={setDropOpen}
              setValue={setCategoryId}
              setItems={setItems}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={{ color: COLORS.textMuted }}
              arrowIconStyle={{ tintColor: COLORS.textSecondary }}
              tickIconStyle={{ tintColor: COLORS.primary }}
              theme="DARK"
              placeholder="Select category"
              zIndex={3000}
            />
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

            {/* Date */}
            <Text style={[styles.label, { marginTop: SPACING.md }]}>Date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateBtnIcon}>📅</Text>
              <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
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
            <Text style={[styles.label, { marginTop: SPACING.md }]}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.descInput}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={120}
            />

            {/* Recurring toggle */}
            <View style={styles.recurringRow}>
              <View>
                <Text style={styles.recurringLabel}>Recurring Monthly</Text>
                <Text style={styles.recurringSubLabel}>Auto-add every month</Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={isRecurring ? COLORS.primaryLight : COLORS.textMuted}
              />
            </View>

            {isRecurring && (
              <View>
                <Text style={styles.label}>Day of month (1–31)</Text>
                <TextInput
                  style={[styles.descInput, { height: 48, textAlignVertical: 'center' }]}
                  placeholder="e.g. 1 for 1st of month"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  value={recurrenceDay}
                  onChangeText={(t) => { setRecurrenceDay(t); setErrors((e) => ({ ...e, recurrenceDay: '' })); }}
                  maxLength={2}
                />
                {errors.recurrenceDay ? <Text style={styles.errorText}>{errors.recurrenceDay}</Text> : null}
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
                colors={COLORS.gradientPrimary}
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
  safeArea:      { flex: 1, backgroundColor: COLORS.bg },
  flex:          { flex: 1 },
  container:     { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  backIcon:      { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle:   { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: COLORS.textPrimary },
  amountCard: {
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  currencyLabel: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs, color: COLORS.accent, letterSpacing: 2, marginBottom: SPACING.sm },
  amountRow:     { flexDirection: 'row', alignItems: 'center' },
  rupeeSym:      { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxxl, color: COLORS.textSecondary, marginRight: 8 },
  amountInput:   { fontFamily: FONTS.bold, fontSize: 48, color: COLORS.textPrimary, minWidth: 140, textAlign: 'center' },
  form:          { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  label:         { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 8 },
  optional:      { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  dropdown: {
    backgroundColor: COLORS.bgInput, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 52,
  },
  dropdownContainer: {
    backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: RADIUS.md,
  },
  dropdownText:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  dateBtnIcon:  { fontSize: 16, marginRight: SPACING.sm },
  dateBtnText:  { fontFamily: FONTS.medium, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  descInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: COLORS.textPrimary, fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md, minHeight: 72, textAlignVertical: 'top',
  },
  recurringRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  recurringLabel:    { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  recurringSubLabel: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  saveBtn:           { marginTop: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  saveBtnGradient:   { height: 56, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:       { color: '#fff', fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg },
  errorText:         { color: COLORS.danger, fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 4 },
});
