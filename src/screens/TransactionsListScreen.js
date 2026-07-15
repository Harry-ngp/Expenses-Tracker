import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Search, X } from 'lucide-react-native';

import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getExpenses, deleteExpense } from '../db/queries';
import ExpenseCard from '../components/ExpenseCard';

const BG_APP = '#F7F8FA';
const TEXT_DARK = '#1C1C28';
const TEXT_MUTED = '#8F92A1';
const BRAND_PURPLE = '#6C4CF1';
const BORDER = '#E8EAF0';

const relativeHeader = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Format date's day total amount
const formatAmount = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TransactionsListScreen({ navigation }) {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All' | 'Expense'
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const data = getExpenses({
      userId: user.id,
      search: search.trim() || undefined,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpenses(data);
  }, [user?.id, search]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleDelete = (id) => { deleteExpense(id); loadData(); };
  const handleEdit = (expense) => navigation.navigate('AddExpense', { expense });

  // Filter and group by date for SectionList
  const sections = useMemo(() => {
    const map = {};
    const filtered = expenses.filter(e => {
      if (filter === 'All') return true;
      if (filter === 'Expense') return true; // Add income check here if Income is added to DB
      return true;
    });

    filtered.forEach(e => {
      const dateKey = e.date.split('T')[0]; // normalize to YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: date,
        total: map[date].reduce((sum, e) => sum + e.amount, 0),
        data: map[date],
      }));
  }, [expenses, filter]);

  return (
    <View style={styles.safeArea}>

      {/* Search bar (collapsible) */}
      {searchVisible && (
        <View style={styles.searchWrap}>
          <Search stroke={TEXT_MUTED} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={TEXT_MUTED}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X stroke={TEXT_MUTED} size={18} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Segmented Control: All | Expense */}
      <View style={styles.segmentWrap}>
        {['All', 'Expense'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentTab, filter === tab && styles.segmentTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.segmentText, filter === tab && styles.segmentTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>{relativeHeader(section.title)}</Text>
            <Text style={styles.sectionHeaderTotal}>{formatAmount(section.total)}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_PURPLE} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Search stroke={BRAND_PURPLE} size={32} opacity={0.6} />
            </View>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySub}>We couldn't find anything matching your filters.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_APP },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: BG_APP,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl, color: TEXT_DARK },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, borderRadius: RADIUS.md, backgroundColor: '#FFF', ...SHADOWS.card },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#FFF', borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 10, ...SHADOWS.card,
  },
  searchInput: { flex: 1, fontFamily: FONTS.medium, fontSize: FONTS.sizes.md, color: TEXT_DARK },

  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#EDEEF5',
    borderRadius: RADIUS.full,
    padding: 4,
  },
  segmentTab: {
    flex: 1, paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  segmentTabActive: { backgroundColor: '#FFF', ...SHADOWS.card },
  segmentText: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, color: TEXT_MUTED },
  segmentTextActive: { color: BRAND_PURPLE, fontFamily: FONTS.bold },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8, marginTop: 4,
  },
  sectionHeaderTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  sectionHeaderTotal: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, color: TEXT_MUTED },

  listContent: { paddingBottom: 100 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_PURPLE + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: TEXT_DARK },
  emptySub: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND_PURPLE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  fabText: { color: '#FFF', fontSize: 32, fontFamily: FONTS.regular, lineHeight: 36 },
});
