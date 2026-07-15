import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import { getCategoryBudgets, getCategoryTotals, getCategoriesForUser, updateMonthlyBudget, setCategoryBudget } from '../db/queries';
import { formatINR, currentMonthStart, todayISO } from '../utils/dateHelpers';

const CategoryBudgetCard = ({ cat, spent, limit, colors, onUpdate }) => {
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const pctText = Math.round(pct * 100);
  const [catBudgetInput, setCatBudgetInput] = useState(limit > 0 ? String(limit) : '');

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.catHeader}>
        <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.icon} {cat.name}</Text>
        {limit > 0 && (
          <Text style={[styles.catSpent, { color: colors.textSecondary }]}>
            Spent: <Text style={{ color: pct >= 1 ? colors.danger : colors.textPrimary }}>{formatINR(spent)}</Text> / {formatINR(limit)}
          </Text>
        )}
      </View>
      {limit > 0 && (
        <View style={[styles.progressBarBg, { backgroundColor: colors.bgInput }]}>
          <View style={[styles.progressBarFill, { width: `${pctText}%`, backgroundColor: pct >= 1 ? colors.danger : colors.primary }]} />
        </View>
      )}
      
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: colors.textMuted }]}>₹</Text>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgInput, borderColor: colors.border }]}
          value={catBudgetInput}
          onChangeText={setCatBudgetInput}
          keyboardType="numeric"
          placeholder="Set Limit"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => onUpdate(cat.id, catBudgetInput)}>
          <Text style={styles.btnText}>Set</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BudgetSettingsScreen() {
  const { user, updateBudget } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [monthlyBudget, setMonthlyBudgetInput] = useState(user?.monthly_budget ? String(user.monthly_budget) : '');
  const [categories, setCategories] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const allCats = getCategoriesForUser(user.id);
    const budgets = getCategoryBudgets(user.id);
    const totals = getCategoryTotals(user.id, currentMonthStart(), todayISO());

    const totalsMap = {};
    totals.forEach(t => { totalsMap[t.id] = t.total; });
    setCategoryTotals(totalsMap);

    const merged = allCats.map(c => {
      const b = budgets.find(bdg => bdg.category_id === c.id);
      return {
        ...c,
        budget: b ? b.budget : 0
      };
    });
    setCategories(merged);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleUpdateMonthly = () => {
    const val = parseFloat(monthlyBudget);
    if (isNaN(val) || val < 0) {
      Alert.alert('Error', 'Enter a valid positive number');
      return;
    }
    updateMonthlyBudget(user.id, val);
    updateBudget(val); // Sync to React Context
    Alert.alert('Success', 'Monthly budget updated!');
  };

  const handleUpdateCategoryBudget = (catId, valStr) => {
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) {
      Alert.alert('Error', 'Enter a valid positive number');
      return;
    }
    setCategoryBudget(user.id, catId, val);
    loadData();
    Alert.alert('Success', 'Category budget updated!');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: SPACING.md }}>
          <Text style={{ fontSize: 24, color: colors.textPrimary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Budget Settings</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Overall Monthly Budget</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Set a global limit for your monthly expenses.</Text>
          <View style={styles.inputRow}>
            <Text style={[styles.currency, { color: colors.textMuted }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgInput, borderColor: colors.border }]}
              value={monthlyBudget}
              onChangeText={setMonthlyBudgetInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleUpdateMonthly}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Category Budgets</Text>
        {categories.map(cat => {
          const spent = categoryTotals[cat.id] || 0;
          const limit = cat.budget || 0;

          return (
            <CategoryBudgetCard
              key={cat.id}
              cat={cat}
              spent={spent}
              limit={limit}
              colors={colors}
              onUpdate={handleUpdateCategoryBudget}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: SPACING.md, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xl },
  content: { padding: SPACING.md, paddingBottom: 100 },
  sectionTitle: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  cardDesc: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, marginRight: SPACING.sm },
  input: { flex: 1, height: 44, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, fontFamily: FONTS.regular, fontSize: FONTS.sizes.md },
  btn: { marginLeft: SPACING.sm, height: 44, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  catName: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  catSpent: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.md },
  progressBarFill: { height: '100%', borderRadius: 3 },
});
