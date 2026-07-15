import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { FONTS, SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getExpenses, getCategoriesForUser, deleteExpense } from '../db/queries';
import ExpenseCard from '../components/ExpenseCard';

export default function TransactionsListScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const cats = getCategoriesForUser(user.id);
    setCategories([{ id: null, name: 'All' }, ...cats]);
    
    const data = getExpenses({
      userId: user.id,
      categoryId: selectedCategory,
      search: search.trim() || undefined,
    });
    setExpenses(data);
  }, [user?.id, selectedCategory, search]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    deleteExpense(id);
    loadData();
  };

  const handleEdit = (expense) => {
    navigation.navigate('AddExpense', { expense });
  };

  // Group by date for SectionList
  const sections = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const date = e.date; // YYYY-MM-DD
      if (!map[date]) map[date] = [];
      map[date].push(e);
    });
    return Object.keys(map).sort((a,b) => b.localeCompare(a)).map(date => ({
      title: date,
      data: map[date],
    }));
  }, [expenses]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header & Search */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Transactions</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Text style={{color: colors.textMuted}}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={c => c.id?.toString() || 'all'}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.bgCard,
                    borderColor: isActive ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[
                  styles.filterText,
                  { color: isActive ? '#fff' : colors.textPrimary }
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
        />
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => handleEdit(item)}>
            <ExpenseCard
              expense={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: SPACING.md, borderBottomWidth: 1 },
  title: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl, marginBottom: SPACING.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm,
    height: 40, borderRadius: RADIUS.md, borderWidth: 1
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm },
  filterWrap: { paddingVertical: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm
  },
  filterText: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.xs },
  listContent: { paddingBottom: 100 },
  sectionHeader: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm },
  empty: { padding: SPACING.xxl, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.md },
});
