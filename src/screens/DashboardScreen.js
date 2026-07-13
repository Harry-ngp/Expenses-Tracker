import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  getExpenses, getMonthlyTotal, deleteExpense, processRecurringExpenses,
} from '../db/queries';
import { formatINR, currentMonthKey } from '../utils/dateHelpers';
import { CATEGORIES } from '../constants/categories';
import ExpenseCard from '../components/ExpenseCard';
import SummaryBanner from '../components/SummaryBanner';
import FilterBar from '../components/FilterBar';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [expenses, setExpenses]     = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ categoryId: null, startDate: null, endDate: null });

  const loadData = useCallback(() => {
    if (!user) return;
    try {
      processRecurringExpenses(user.id);
      const data = getExpenses({
        userId: user.id,
        categoryId: filters.categoryId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: search.trim() || undefined,
      });
      setExpenses(data);
      const total = getMonthlyTotal(user.id, currentMonthKey());
      setMonthTotal(total);
    } catch (err) {
      console.error('loadData error', err);
    }
  }, [user?.id, filters, search]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleDelete = (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { deleteExpense(expenseId); loadData(); },
        },
      ]
    );
  };

  const handleEdit = (expense) => {
    navigation.navigate('AddExpense', { expense });
  };

  const ListHeader = () => (
    <View>
      {/* Header */}
      <LinearGradient colors={['#1A0A2E', '#0F0F1A']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.username}>{user?.username} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>↩ Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Summary banner */}
        <SummaryBanner monthTotal={monthTotal} budget={user?.monthly_budget} />
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Transactions</Text>
        <Text style={styles.listCount}>{expenses.length} records</Text>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyTitle}>No expenses found</Text>
      <Text style={styles.emptySub}>Tap + to add your first expense</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExpense', {})}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: COLORS.bg },
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header:       { padding: SPACING.lg, paddingBottom: SPACING.md },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  greeting:     { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  username:     { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xl, color: COLORS.textPrimary },
  logoutBtn:    { backgroundColor: COLORS.bgCard, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  logoutText:   { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm, height: 46,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon:   { fontSize: 16, marginRight: SPACING.sm },
  searchInput:  { flex: 1, color: COLORS.textPrimary, fontFamily: FONTS.regular, fontSize: FONTS.sizes.md },
  clearIcon:    { color: COLORS.textMuted, fontSize: 14, paddingHorizontal: 4 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.xs,
  },
  listTitle:    { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, color: COLORS.textPrimary },
  listCount:    { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  listContent:  { paddingBottom: 100 },
  emptyState:   { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptySub:     { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden', ...SHADOWS.button,
  },
  fabGradient:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabIcon:      { color: '#fff', fontSize: 32, fontFamily: FONTS.bold, lineHeight: 36 },
});
