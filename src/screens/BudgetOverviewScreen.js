import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-gifted-charts';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { getCategoryBudgets, getCategoryTotals, getCategoriesForUser } from '../db/queries';
import { formatINR, currentMonthStart, todayISO, currentMonthKey } from '../utils/dateHelpers';
import { getMonthlyTotal } from '../db/queries';

export default function BudgetOverviewScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [categories, setCategories] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    
    // Overall month total
    const total = getMonthlyTotal(user.id, currentMonthKey());
    setMonthTotal(total);

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
    
    // Only show categories that have a budget set, or just show all. Let's show all that have a budget or some spending.
    const relevantCats = merged.filter(c => c.budget > 0 || (totalsMap[c.id] > 0));
    setCategories(relevantCats);
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const overallBudget = user?.monthly_budget || 0;
  const isBudgetSet = overallBudget > 0;
  
  // Data for the Donut Chart
  let pieData = [];
  let centerText = "";
  let centerSub = "";

  if (isBudgetSet) {
    const spent = monthTotal;
    const remaining = Math.max(overallBudget - spent, 0);
    const exceeded = spent > overallBudget;

    pieData = [
      { value: spent, color: exceeded ? colors.danger : colors.primary },
      { value: remaining, color: colors.bgInput }
    ];
    centerText = formatINR(spent).replace('.00', '');
    centerSub = `of ${formatINR(overallBudget).replace('.00', '')}`;
  } else {
    // If no budget, just show a full circle representing total spent
    pieData = [
      { value: monthTotal > 0 ? monthTotal : 1, color: colors.primary }
    ];
    centerText = formatINR(monthTotal).replace('.00', '');
    centerSub = "Total Spent";
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Budget overview</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BudgetSettings')}>
          <Text style={{ fontSize: 22, color: colors.textPrimary }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); setRefreshing(false); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Budget Donut */}
        <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Monthly Budget</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={65}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text style={[styles.pieCenterText, { color: colors.textPrimary }]}>{centerText}</Text>
                  <Text style={[styles.pieCenterSub, { color: colors.textSecondary }]}>{centerSub}</Text>
                </View>
              )}
              strokeColor={colors.bgCard}
              strokeWidth={2}
            />
          </View>
          
          {!isBudgetSet && (
             <TouchableOpacity style={[styles.setBudgetBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('BudgetSettings')}>
               <Text style={styles.setBudgetBtnText}>Set a Monthly Budget</Text>
             </TouchableOpacity>
          )}
          {isBudgetSet && monthTotal > overallBudget && (
            <View style={[styles.alertBox, { backgroundColor: colors.danger + '22', borderColor: colors.danger }]}>
              <Text style={[styles.alertText, { color: colors.danger }]}>⚠️ You have exceeded your monthly budget!</Text>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Limits</Text>
        </View>
        
        {categories.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No category budgets or spending yet.</Text>
        ) : (
          categories.map(cat => {
            const spent = categoryTotals[cat.id] || 0;
            const limit = cat.budget || 0;
            
            // If no limit set for this category, we just show how much is spent with a full bar or grey bar.
            const hasLimit = limit > 0;
            const actualPct = hasLimit ? Math.round((spent / limit) * 100) : 0;
            const fillWidth = hasLimit ? Math.min(actualPct, 100) : 100; // 100% fill but different color if no limit

            return (
              <View key={cat.id} style={[styles.catCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.catHeader}>
                  <View style={styles.catNameRow}>
                    <View style={[styles.iconWrap, { backgroundColor: (cat.color || colors.primary) + '22' }]}>
                      <Text style={styles.icon}>{cat.icon}</Text>
                    </View>
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.catSpent, { color: colors.textPrimary }]}>{formatINR(spent)}</Text>
                    {hasLimit && (
                      <Text style={[styles.catLimit, { color: colors.textSecondary }]}>of {formatINR(limit)}</Text>
                    )}
                  </View>
                </View>

                {hasLimit ? (
                  <View style={[styles.progressBarBg, { backgroundColor: colors.bgInput }]}>
                    <View style={[styles.progressBarFill, { width: `${fillWidth}%`, backgroundColor: actualPct >= 100 ? colors.danger : colors.primary }]} />
                  </View>
                ) : (
                  <View style={[styles.progressBarBg, { backgroundColor: colors.bgInput }]}>
                    <View style={[styles.progressBarFill, { width: `100%`, backgroundColor: colors.border }]} />
                  </View>
                )}
                
                {hasLimit && (
                  <Text style={[styles.progressText, { color: actualPct >= 100 ? colors.danger : colors.textSecondary }]}>
                    {actualPct >= 100 ? `Exceeded by ${actualPct - 100}%` : `${actualPct}% used`}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, borderBottomWidth: 1 
  },
  title: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xl },
  content: { padding: SPACING.md, paddingBottom: 100 },
  
  chartCard: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  chartTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, marginBottom: SPACING.lg, alignSelf: 'flex-start' },
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.sm },
  pieCenter: { alignItems: 'center', justifyContent: 'center' },
  pieCenterText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xl },
  pieCenterSub: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.sm, marginTop: 4 },
  
  setBudgetBtn: { marginTop: SPACING.lg, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.md },
  setBudgetBtnText: { color: '#fff', fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  
  alertBox: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, width: '100%' },
  alertText: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, textAlign: 'center' },

  sectionHeader: { marginBottom: SPACING.sm, marginLeft: 4 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg },
  
  catCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.md },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  catNameRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  icon: { fontSize: 20 },
  catName: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  catSpent: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md },
  catLimit: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 2 },
  
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, alignSelf: 'flex-end', marginTop: 6 },
  
  emptyText: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.md, textAlign: 'center', marginTop: SPACING.xl },
});
