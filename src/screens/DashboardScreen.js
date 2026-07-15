import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-gifted-charts';

import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getExpenses, getMonthlyTotal, getCategoryTotals, processRecurringExpenses } from '../db/queries';
import { currentMonthKey, formatINR, currentMonthStart, todayISO } from '../utils/dateHelpers';
import ExpenseCard from '../components/ExpenseCard';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [pieData, setPieData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    try {
      processRecurringExpenses(user.id);
      
      // Get recent 5 expenses
      const data = getExpenses({ userId: user.id });
      setRecentExpenses(data.slice(0, 5));
      
      const total = getMonthlyTotal(user.id, currentMonthKey());
      setMonthTotal(total);

      const catTotals = getCategoryTotals(user.id, currentMonthStart(), todayISO());
      setPieData(
        catTotals.map(c => ({
          value: Math.round(c.total),
          color: c.color,
          text: c.icon,
          label: c.name,
        }))
      );
    } catch (err) {
      console.error('loadData error', err);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const ListHeader = () => {
    const budget = user?.monthly_budget || 0;
    const actualPct = budget > 0 ? Math.round((monthTotal / budget) * 100) : 0;
    const fillWidth = Math.min(actualPct, 100);

    return (
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Dashboard</Text>
          <TouchableOpacity onPress={() => navigation.navigate('More')}>
             <Text style={{fontSize: 20, color: colors.textPrimary}}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Total Expenses Card */}
        <LinearGradient 
          colors={colors.gradientPrimary} 
          style={styles.totalCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        >
          <Text style={styles.totalLabel}>Total Expenses (This Month)</Text>
          <Text style={styles.totalAmount}>{formatINR(monthTotal)}</Text>
        </LinearGradient>

        {/* Budget Progress */}
        {budget > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Monthly Budget</Text>
              <Text style={[styles.budgetVal, { color: colors.textSecondary }]}>
                {formatINR(budget)}
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.bgInput }]}>
              <View style={[
                styles.progressBarFill, 
                { width: `${fillWidth}%`, backgroundColor: actualPct >= 100 ? colors.danger : colors.primary }
              ]} />
            </View>
            <Text style={[styles.progressText, { color: actualPct >= 100 ? colors.danger : colors.textSecondary }]}>
              {actualPct >= 100 ? `Exceeded by ${actualPct - 100}%` : `${actualPct}% used`}
            </Text>
          </View>
        )}

        {/* Expenses Overview Pie Chart */}
        {pieData.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: SPACING.md }]}>Expenses Overview</Text>
            <View style={styles.pieWrap}>
              <PieChart
                data={pieData}
                donut
                radius={70}
                innerRadius={45}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={[styles.pieCenterText, { color: colors.textPrimary }]}>
                      {formatINR(monthTotal).replace('.00', '')}
                    </Text>
                  </View>
                )}
                strokeColor={colors.bgCard}
                strokeWidth={2}
                isAnimated
              />
              <View style={styles.legend}>
                {pieData.slice(0, 4).map((item, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                    <Text style={[styles.legendValue, { color: colors.textPrimary }]}>
                      {Math.round((item.value / monthTotal) * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <FlatList
        data={recentExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => navigation.navigate('AddExpense', { expense: item })}
            onDelete={null} // Swipe delete handled in full list to keep dashboard clean
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense', {})}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
  },
  greeting: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.xl },
  totalCard: {
    margin: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.xl,
    ...SHADOWS.card,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, marginBottom: 4 },
  totalAmount: { color: '#fff', fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxxl },
  card: {
    marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  budgetVal: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, alignSelf: 'flex-end' },
  pieWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pieCenter: { alignItems: 'center', justifyContent: 'center' },
  pieCenterText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md },
  legend: { flex: 1, marginLeft: SPACING.md, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  legendValue: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.xs },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.xs,
  },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg },
  seeAll: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm },
  listContent: { paddingBottom: 100 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden', ...SHADOWS.button,
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { color: '#fff', fontSize: 32, fontFamily: FONTS.bold, lineHeight: 36 },
});
