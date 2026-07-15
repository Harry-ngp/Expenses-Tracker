import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';

import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getExpenses, getCategoriesForUser, getDailyTotals } from '../db/queries';
import { exportToCSV } from '../utils/csvExport';
import { formatDate, formatINR, currentMonthStart, todayISO } from '../utils/dateHelpers';
import ExpenseCard from '../components/ExpenseCard';

export default function ReportsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [expenses, setExpenses]   = useState([]);
  const [chartData, setChartData] = useState([]);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate]   = useState(currentMonthStart());
  const [endDate, setEndDate]       = useState(todayISO());
  const [showStart, setShowStart]   = useState(false);
  const [showEnd, setShowEnd]       = useState(false);
  
  const [categoryId, setCategoryId] = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const [items, setItems]           = useState([
    { label: '🔍  All Categories', value: null }
  ]);

  const totalFiltered = expenses.reduce((s, e) => s + e.amount, 0);

  const loadData = useCallback(() => {
    if (!user) return;
    
    // Load categories
    const dbCats = getCategoriesForUser(user.id);
    setItems([
      { label: '🔍  All Categories', value: null },
      ...dbCats.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
    ]);

    // Load expenses
    const data = getExpenses({
      userId: user.id,
      startDate,
      endDate,
      categoryId: categoryId || undefined,
    });
    setExpenses(data);

    // Load chart data
    const daily = getDailyTotals(user.id, startDate, endDate);
    if (daily.length > 0) {
      setChartData(daily.map(d => ({ 
        value: d.total, 
        label: d.date.substring(8, 10) // day only
      })));
    } else {
      setChartData([]);
    }
  }, [user?.id, startDate, endDate, categoryId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
      <LinearGradient colors={colors.gradientPrimary} style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>Filter, analyze & export</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
            <Text style={{ fontSize: 24, color: '#fff' }}>📅</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters card */}
      <View style={[styles.filterCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>🔍  Filter Expenses</Text>

        {/* Date range */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>From</Text>
            <TouchableOpacity style={[styles.dateBtn, { backgroundColor: colors.bgInput, borderColor: colors.border }]} onPress={() => setShowStart(true)}>
              <Text style={[styles.dateBtnText, { color: colors.textPrimary }]}>📅  {formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateField}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>To</Text>
            <TouchableOpacity style={[styles.dateBtn, { backgroundColor: colors.bgInput, borderColor: colors.border }]} onPress={() => setShowEnd(true)}>
              <Text style={[styles.dateBtnText, { color: colors.textPrimary }]}>📅  {formatDate(endDate)}</Text>
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
        <Text style={[styles.label, { marginTop: SPACING.sm, color: colors.textSecondary }]}>Category</Text>
        <DropDownPicker
          open={dropOpen}
          value={categoryId}
          items={items}
          setOpen={setDropOpen}
          setValue={setCategoryId}
          setItems={setItems}
          style={[styles.dropdown, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
          dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          textStyle={[styles.dropdownText, { color: colors.textPrimary }]}
          theme={isDarkMode ? "DARK" : "LIGHT"}
          zIndex={3000}
          listMode="SCROLLVIEW"
        />

        {/* Summary & Export */}
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total ({expenses.length} entries)</Text>
            <Text style={styles.summaryValue}>{formatINR(totalFiltered)}</Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradientAccent}
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

      {/* Line Chart */}
      {chartData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Spending Trend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
            <LineChart
              data={chartData}
              color={colors.primary}
              thickness={3}
              dataPointsColor={colors.accent}
              xAxisColor={colors.border}
              yAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              spacing={40}
              initialSpacing={10}
              isAnimated
              hideDataPoints={chartData.length > 20}
            />
          </ScrollView>
        </View>
      )}

      <Text style={[styles.listTitle, { color: colors.textPrimary }]}>Results</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
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
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No records found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try adjusting the date range or category</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  header:        { padding: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle:   { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl, color: '#fff' },
  headerSub:     { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, marginTop: 4 },
  filterCard: {
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    padding: SPACING.md, borderWidth: 1,
  },
  chartCard: {
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    padding: SPACING.md, borderWidth: 1,
  },
  filterTitle:   { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, marginBottom: SPACING.sm },
  dateRow:       { flexDirection: 'row', gap: SPACING.sm },
  dateField:     { flex: 1 },
  label:         { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs, marginBottom: 6 },
  dateBtn: {
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingHorizontal: SPACING.sm, height: 44,
    justifyContent: 'center',
  },
  dateBtnText:   { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs },
  dropdown: {
    borderRadius: RADIUS.md, height: 48, borderWidth: 1
  },
  dropdownContainer: {
    borderRadius: RADIUS.md, borderWidth: 1
  },
  dropdownText:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  summaryLabel:  { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  summaryValue:  { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: '#10B981' },
  exportBtn:     { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button },
  exportBtnGradient:{ paddingHorizontal: SPACING.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  exportBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: FONTS.sizes.sm },
  listTitle:     { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, marginHorizontal: SPACING.md, marginBottom: SPACING.xs },
  listContent:   { paddingBottom: SPACING.xxl },
  emptyState:    { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, marginTop: SPACING.md },
  emptySub:      { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, marginTop: SPACING.xs },
});
