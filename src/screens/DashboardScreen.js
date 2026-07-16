import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, RefreshControl, LayoutAnimation, Platform, UIManager, Animated as RNAnimated, InteractionManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Plus, Receipt } from 'lucide-react-native';

import { FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getExpenses, getMonthlyTotal, getCategoryTotals } from '../db/queries';
import ExpenseCard from '../components/ExpenseCard';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedNumber from '../components/AnimatedNumber';
import SkeletonLoader from '../components/SkeletonLoader';

const BRAND_PURPLE = '#FF6B6B'; // Sunset Horizon Primary
const BG_WHITE = '#FFFFFF';
const TEXT_DARK = '#1C1C28';
const TEXT_MUTED = '#8F92A1';

// Generate last 12 months for the dropdown
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ label, value: key });
  }
  return options;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  // Data state
  const [selectedMonth, setSelectedMonth] = useState(generateMonthOptions()[0].value);
  const [monthTotal, setMonthTotal] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Advanced breathing animation for FAB
  const fabScale = useSharedValue(1);

  useEffect(() => {
    fabScale.value = withRepeat(
      withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse (pulse)
    );
  }, []);

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Dropdown state
  const [monthDropOpen, setMonthDropOpen] = useState(false);
  const [monthItems, setMonthItems] = useState(generateMonthOptions());

  // Progress Bar Animation
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  const loadData = useCallback(() => {
    if (!user) return;
    
    try {
      // 1. Get total
      const total = getMonthlyTotal(user.id, selectedMonth);
      setMonthTotal(total);

      // 2. Get recent expenses (just get all for the month and take top 5)
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      const data = getExpenses({ userId: user.id, startDate, endDate });
      setRecentExpenses(data.slice(0, 5));

      // 3. Get category totals
      const catTotals = getCategoryTotals(user.id, startDate, endDate);

      // Calculate pie data
      let formattedPie = catTotals.map(c => ({
        value: Math.round(c.total),
        color: c.color || BRAND_PURPLE,
        label: c.name,
        icon: c.icon || '📦',
      }));

      // If empty, put a placeholder so it doesn't look completely empty
      if (formattedPie.length === 0) {
        formattedPie = [{ value: 100, color: '#E4E7ED', label: 'No Data', icon: '⚪' }];
      }
      setPieData(formattedPie);

      // 4. Animate progress bar (budget logic)
      const budget = user?.monthly_budget || 0;
      const actualPct = budget > 0 ? Math.round((total / budget) * 100) : 0;

      if (budget > 0) {
        RNAnimated.timing(progressAnim, {
          toValue: Math.min(actualPct, 100),
          duration: 1500,
          useNativeDriver: false,
        }).start();
      }

    } catch (err) {
      console.error('loadData error', err);
    }
  }, [user, selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadData();
      });
      return () => task.cancel();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const budget = user?.monthly_budget || 0;
  const actualPct = budget > 0 ? Math.round((monthTotal / budget) * 100) : 0;

  // Progress bar color
  let progressColor = '#10B981'; // Green
  if (actualPct >= 90) progressColor = '#EF4444'; // Red
  else if (actualPct >= 70) progressColor = '#F59E0B'; // Orange

  return (
    <View style={styles.safeArea}>
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* 2. Total Expenses Card */}
        <View style={{ marginHorizontal: 20, zIndex: 3000 }}>
          <LinearGradient
            colors={[BRAND_PURPLE, '#8862F8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.totalCardLabel}>Total Expenses</Text>

              {/* Dropdown for Month Selection */}
              <View style={styles.dropdownContainerWrapper}>
                <DropDownPicker
                  open={monthDropOpen}
                  value={selectedMonth}
                  items={monthItems}
                  setOpen={setMonthDropOpen}
                  setValue={setSelectedMonth}
                  setItems={setMonthItems}
                  listMode="SCROLLVIEW,MODAL"
                  style={styles.monthDropdown}
                  dropDownContainerStyle={styles.monthDropdownList}
                  textStyle={styles.monthDropdownText}
                  listItemLabelStyle={{ color: TEXT_DARK }} // Fix invisible text
                  arrowIconStyle={{ tintColor: '#fff', width: 15, height: 15 }}
                  tickIconStyle={{ tintColor: BRAND_PURPLE }}
                  placeholder="Select Month"
                  modalProps={{ animationType: 'fade' }}
                  modalTitle="Select Month"
                />
              </View>
            </View>
            <AnimatedNumber value={monthTotal} duration={1200} style={styles.totalCardAmount} />
            <Text style={styles.totalCardTrend}>Updated for {monthItems.find(m => m.value === selectedMonth)?.label}</Text>
          </LinearGradient>
        </View>

        {/* 3. Monthly Budget Card (Only show if budget > 0) */}
        {budget > 0 && (
          <View style={styles.budgetCard}>
            <View style={[styles.rowBetween, { marginBottom: 12 }]}>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetSubLabel}>of ₹ {budget.toLocaleString('en-IN')}.00</Text>
            </View>

            <View style={[styles.rowBetween, { marginBottom: 8, alignItems: 'flex-end' }]}>
              <Text style={styles.budgetAmount}>₹ {budget.toLocaleString('en-IN')}.00</Text>
              <Text style={styles.budgetPercent}>{actualPct}%</Text>
            </View>

            <View style={styles.progressBg}>
              <RNAnimated.View style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: progressColor
                }
              ]} />
            </View>
          </View>
        )}

        {/* 4. Expenses Overview */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Expenses Overview</Text>

          <View style={styles.overviewCard}>
            <View style={styles.pieWrap}>
              <PieChart
                data={pieData}
                donut
                radius={65}
                innerRadius={45}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterAmount}>₹ {monthTotal > 1000 ? (monthTotal / 1000).toFixed(1) + 'k' : monthTotal}</Text>
                    <Text style={styles.pieCenterSub}>This Month</Text>
                  </View>
                )}
                strokeColor={BG_WHITE}
                strokeWidth={3}
                isAnimated
              />
            </View>

            <View style={styles.legendWrap}>
              {pieData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.legendRow}>
                  <View style={styles.legendLabelGroup}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabelText} numberOfLines={1}>{item.label}</Text>
                  </View>
                  <Text style={styles.legendValueText}>
                    {monthTotal > 0 ? Math.round((item.value / monthTotal) * 100) : 0}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 5. Recent Transactions */}
        <View style={styles.sectionWrap}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            {recentExpenses.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Receipt stroke={BRAND_PURPLE} size={28} opacity={0.6} />
                </View>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySub}>When you add expenses, they'll show up here.</Text>
              </View>
            ) : (
              recentExpenses.slice(0, 5).map((t) => (
                <ExpenseCard
                  key={t.id}
                  expense={t}
                  onEdit={() => navigation.navigate('AddExpense', { expense: t })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Minimal, soft shadow helper
const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK },
  iconBtn: { padding: 4 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Total Expenses Card
  totalCard: {
    marginTop: 16, marginBottom: 20,
    padding: 24, borderRadius: 24,
    ...softShadow, shadowColor: BRAND_PURPLE, shadowOpacity: 0.25,
  },
  totalCardLabel: { fontFamily: FONTS.medium, fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  dropdownContainerWrapper: {
    width: 135, // slightly wider for longer month names
  },
  monthDropdown: {
    backgroundColor: 'rgba(255,255,255,0.25)', // More visible
    borderWidth: 0,
    minHeight: 36, // Better touch target
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  monthDropdownList: {
    backgroundColor: BG_WHITE,
    borderWidth: 0,
    borderRadius: 16,
    ...softShadow,
    marginTop: 4,
    elevation: 5000, // Ensure it sits on top of everything
  },
  monthDropdownText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#fff',
  },

  totalCardAmount: { fontFamily: FONTS.bold, fontSize: 32, color: '#fff', marginTop: 16, marginBottom: 8 },
  totalCardTrend: { fontFamily: FONTS.medium, fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  // Budget Card
  budgetCard: {
    backgroundColor: BG_WHITE, marginHorizontal: 20, padding: 20,
    borderRadius: 20, marginBottom: 24,
    ...softShadow,
  },
  budgetLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: TEXT_DARK },
  budgetSubLabel: { fontFamily: FONTS.medium, fontSize: 12, color: TEXT_MUTED },
  budgetAmount: { fontFamily: FONTS.bold, fontSize: 22, color: TEXT_DARK },
  budgetPercent: { fontFamily: FONTS.bold, fontSize: 16, color: TEXT_DARK },
  progressBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Sections
  sectionWrap: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 18, color: TEXT_DARK, marginBottom: 16 },

  // Overview Card (Donut)
  overviewCard: {
    backgroundColor: BG_WHITE, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...softShadow,
  },
  pieWrap: { flex: 0.45, alignItems: 'center', justifyContent: 'center' },
  pieCenter: { alignItems: 'center', justifyContent: 'center' },
  pieCenterAmount: { fontFamily: FONTS.bold, fontSize: 16, color: TEXT_DARK },
  pieCenterSub: { fontFamily: FONTS.medium, fontSize: 10, color: TEXT_MUTED, marginTop: 2 },

  legendWrap: { flex: 0.55, gap: 10, paddingLeft: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLabelGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabelText: { fontFamily: FONTS.semiBold, fontSize: 12, color: TEXT_MUTED, flexShrink: 1 },
  legendValueText: { fontFamily: FONTS.bold, fontSize: 12, color: TEXT_DARK, marginLeft: 8 },

  // Recent Transactions
  seeAllText: { fontFamily: FONTS.bold, fontSize: 14, color: BRAND_PURPLE },
  transactionList: { gap: 12 },
  txCard: {
    backgroundColor: BG_WHITE, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    ...softShadow,
  },
  txIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  txInfo: { flex: 1 },
  txCategory: { fontFamily: FONTS.bold, fontSize: 15, color: TEXT_DARK, marginBottom: 2 },
  txMerchant: { fontFamily: FONTS.medium, fontSize: 13, color: TEXT_MUTED },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontFamily: FONTS.bold, fontSize: 15, color: TEXT_DARK, marginBottom: 2 },
  txDate: { fontFamily: FONTS.medium, fontSize: 12, color: TEXT_MUTED },

  // Empty State
  emptyWrap: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: BRAND_PURPLE + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  emptySub: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginTop: 4, textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 64, height: 64, borderRadius: 32,
    ...softShadow, shadowColor: BRAND_PURPLE, shadowOpacity: 0.3, shadowRadius: 12,
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
});
