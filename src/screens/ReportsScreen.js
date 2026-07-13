import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getExpenses } from '../db/queries';
import { exportToCSV } from '../utils/csvExport';
import { formatDate, formatINR, currentMonthStart, todayISO } from '../utils/dateHelpers';
import { CATEGORY_DROPDOWN_ITEMS } from '../constants/categories';
import ExpenseCard from '../components/ExpenseCard';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses]   = useState([]);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate]   = useState(currentMonthStart());
  const [endDate, setEndDate]       = useState(todayISO());
  const [showStart, setShowStart]   = useState(false);
  const [showEnd, setShowEnd]       = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const [items, setItems]           = useState([
    { label: '🔍  All Categories', value: null },
    ...CATEGORY_DROPDOWN_ITEMS,
  ]);

  const totalFiltered = expenses.reduce((s, e) => s + e.amount, 0);

  const loadExpenses = useCallback(() => {
    if (!user) return;
    const data = getExpenses({
      userId: user.id,
      startDate,
      endDate,
      categoryId: categoryId || undefined,
    });
    setExpenses(data);
  }, [user?.id, startDate, endDate, categoryId]);

  useFocusEffect(useCallback(() => { loadExpenses(); }, [loadExpenses]));

  const handleExport = async () => {
    if (expenses.length === 0) {
      Alert.alert('Nothing to export', 'Apply filters to see results first.');
      return;
    }
    setExporting(true);
    try {
      await exportToCSV(expenses);
    } catch (err) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  const ListHeader = () => (
    <View>
      <LinearGradient colors={['#1A0A2E', '#0F0F1A']} style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSub}>Filter, analyze & export</Text>
      </LinearGradient>

      {/* Filters card */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>🔍  Filter Expenses</Text>

        {/* Date range */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>From</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)}>
              <Text style={styles.dateBtnText}>📅  {formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>To</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(true)}>
              <Text style={styles.dateBtnText}>📅  {formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStart && (
          <DateTimePicker
            value={new Date(startDate)}
            mode="date"
            display="default"
            maximumDate={new Date(endDate)}
            onChange={(_, d) => { setShowStart(false); if (d) setStartDate(d.toISOString().split('T')[0]); }}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={new Date(endDate)}
            mode="date"
            display="default"
            minimumDate={new Date(startDate)}
            maximumDate={new Date()}
            onChange={(_, d) => { setShowEnd(false); if (d) setEndDate(d.toISOString().split('T')[0]); }}
          />
        )}

        {/* Category filter */}
        <Text style={[styles.label, { marginTop: SPACING.sm }]}>Category</Text>
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
          theme="DARK"
          zIndex={3000}
          listMode="SCROLLVIEW"
        />

        {/* Summary & Export */}
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total ({expenses.length} entries)</Text>
            <Text style={styles.summaryValue}>{formatINR(totalFiltered)}</Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={COLORS.gradientAccent}
              style={styles.exportBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {exporting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.exportBtnText}>⬇️  Export CSV</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.listTitle}>Results</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onEdit={null} onDelete={null} readonly />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySub}>Try adjusting the date range or category</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: COLORS.bg },
  header:        { padding: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle:   { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl, color: COLORS.textPrimary },
  headerSub:     { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  filterCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTitle:   { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  dateRow:       { flexDirection: 'row', gap: SPACING.sm },
  dateField:     { flex: 1 },
  label:         { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 6 },
  dateBtn: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, height: 44,
    justifyContent: 'center',
  },
  dateBtnText:   { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs, color: COLORS.textPrimary },
  dropdown: {
    backgroundColor: COLORS.bgInput, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 48,
  },
  dropdownContainer: {
    backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: RADIUS.md,
  },
  dropdownText:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  summaryLabel:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  summaryValue:  { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: COLORS.success },
  exportBtn:     { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  exportBtnGradient:{ paddingHorizontal: SPACING.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  exportBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: FONTS.sizes.sm },
  listTitle:     { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginHorizontal: SPACING.md, marginBottom: SPACING.xs },
  listContent:   { paddingBottom: SPACING.xxl },
  emptyState:    { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptySub:      { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
});
