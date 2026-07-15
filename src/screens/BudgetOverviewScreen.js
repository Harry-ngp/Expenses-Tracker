import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated as RNAnimated, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Settings2, ChevronDown, Plus, PiggyBank } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { getCategoryBudgets, getCategoryTotals, getCategoriesForUser, getMonthlyTotal } from '../db/queries';
import { formatINR, currentMonthStart, todayISO, currentMonthKey } from '../utils/dateHelpers';
import DropDownPicker from 'react-native-dropdown-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from '../components/AnimatedBackground';

const BRAND_PURPLE = '#FF6B6B'; // Sunset Horizon Primary
const BG_APP = '#F7F8FA';
const TEXT_DARK = '#1C1C28';
const TEXT_MUTED = '#8F92A1';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ label, value: key });
  }
  return options;
}

function getMonthDisplay(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetOverviewScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [categories, setCategories] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(generateMonthOptions()[0].value);
  
  const [monthDropOpen, setMonthDropOpen] = useState(false);
  const [monthItems, setMonthItems] = useState(generateMonthOptions());

  const loadData = useCallback(() => {
    if (!user) return;
    const total = getMonthlyTotal(user.id, selectedMonth);
    setMonthTotal(total);

    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const allCats = getCategoriesForUser(user.id);
    const budgets = getCategoryBudgets(user.id);
    const totals = getCategoryTotals(user.id, startDate, endDate);

    const totalsMap = {};
    totals.forEach(t => { totalsMap[t.id] = t.total; });
    setCategoryTotals(totalsMap);

    const merged = allCats.map(c => {
      const b = budgets.find(bdg => bdg.category_id === c.id);
      return { ...c, budget: b ? b.budget : 0 };
    });

    const relevant = merged.filter(c => c.budget > 0 || totalsMap[c.id] > 0);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategories(relevant);
  }, [user, selectedMonth]);

  // FAB Breathing
  const fabScale = useSharedValue(1);
  useEffect(() => {
    fabScale.value = withRepeat(
      withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const overallBudget = user?.monthly_budget || 0;
  const isExceeded = overallBudget > 0 && monthTotal > overallBudget;
  const overAmount = isExceeded ? monthTotal - overallBudget : 0;
  const pct = overallBudget > 0 ? Math.min(Math.round((monthTotal / overallBudget) * 100), 100) : 0;

  // Progress bar color
  let barColor = '#10B981';
  if (pct >= 90) barColor = '#EF4444';
  else if (pct >= 70) barColor = '#F59E0B';

  const remaining = Math.max(overallBudget - monthTotal, 0);

  return (
    <View style={styles.safeArea}>
      <AnimatedBackground />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); setRefreshing(false); }} tintColor={BRAND_PURPLE} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Budget Exceeded Alert Card */}
        {isExceeded && (
          <View style={styles.alertCard}>
            <View style={styles.alertLeft}>
              <Text style={styles.alertTitle}>⚠️  Budget Exceeded</Text>
              <Text style={styles.alertSub}>You have exceeded your monthly budget</Text>
              <Text style={styles.alertOverAmount}>{formatINR(overAmount)}</Text>
              <Text style={styles.alertOverLabel}>over-budget</Text>
            </View>
          </View>
        )}

        {/* Monthly Budget Card */}
        {overallBudget > 0 ? (
          <View style={[styles.budgetCard, { zIndex: 1000 }]}>
            <View style={styles.budgetRow}>
              <View>
                <Text style={styles.budgetLabel}>Monthly Budget</Text>
                <Text style={styles.budgetOfLabel}>of {formatINR(overallBudget)}</Text>
              </View>
              <View style={styles.dropdownContainerWrapper}>
                <DropDownPicker
                  open={monthDropOpen}
                  value={selectedMonth}
                  items={monthItems}
                  setOpen={setMonthDropOpen}
                  setValue={setSelectedMonth}
                  setItems={setMonthItems}
                  style={styles.dropdown}
                  textStyle={styles.dropdownText}
                  dropDownContainerStyle={styles.dropdownList}
                  arrowIconStyle={styles.dropdownArrow}
                  listMode="MODAL"
                  modalProps={{ animationType: 'fade' }}
                  modalTitle="Select Month"
                />
              </View>
            </View>
            <Text style={styles.budgetAmount}>{formatINR(monthTotal)}</Text>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>

            <View style={styles.budgetFooter}>
              <Text style={styles.budgetRemaining}>
                {isExceeded
                  ? `${formatINR(overAmount)} over budget`
                  : `${formatINR(remaining)} left`}
              </Text>
              <Text style={[styles.budgetPct, { color: barColor }]}>{pct}%</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.setBudgetCard, { zIndex: 1000 }]}>
            <View style={{ width: '100%', zIndex: 2000, marginBottom: 16 }}>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginBottom: 8 }}>Select Month</Text>
              <DropDownPicker
                open={monthDropOpen}
                value={selectedMonth}
                items={monthItems}
                setOpen={setMonthDropOpen}
                setValue={setSelectedMonth}
                setItems={setMonthItems}
                style={[styles.dropdown, { backgroundColor: '#F3F4F6', width: '100%' }]}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={styles.dropdownList}
                arrowIconStyle={styles.dropdownArrow}
                listMode="MODAL"
                modalProps={{ animationType: 'fade' }}
                modalTitle="Select Month"
              />
            </View>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 14, backgroundColor: BRAND_PURPLE + '12', borderRadius: RADIUS.full }} 
              onPress={() => navigation.navigate('BudgetSettings')}
            >
              <Plus stroke={BRAND_PURPLE} size={22} />
              <Text style={styles.setBudgetText}>Set a Monthly Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Budget Section */}
        {categories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Category Budget</Text>
            {categories.map(cat => {
              const spent = categoryTotals[cat.id] || 0;
              const limit = cat.budget || 0;
              const hasLimit = limit > 0;
              const catPct = hasLimit ? Math.round((spent / limit) * 100) : 0;
              const catFill = hasLimit ? Math.min(catPct, 100) : 0;
              let catBarColor = '#10B981';
              if (catPct >= 100) catBarColor = '#EF4444';
              else if (catPct >= 70) catBarColor = '#F59E0B';

              return (
                <View key={cat.id} style={styles.catCard}>
                  <View style={styles.catRow}>
                    <View style={[styles.catIconWrap, { backgroundColor: (cat.color || BRAND_PURPLE) + '20' }]}>
                      <Text style={styles.catIcon}>{cat.icon || '📦'}</Text>
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      {hasLimit && (
                        <Text style={styles.catLimit}>{formatINR(limit)}</Text>
                      )}
                    </View>
                    <View style={styles.catRight}>
                      <Text style={styles.catSpent}>{formatINR(spent)}</Text>
                      {hasLimit && (
                        <Text style={[styles.catPct, { color: catBarColor }]}>{catPct}%</Text>
                      )}
                    </View>
                  </View>
                  {hasLimit && (
                    <View style={styles.catProgressBg}>
                      <View style={[styles.catProgressFill, { width: `${catFill}%`, backgroundColor: catBarColor }]} />
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {categories.length === 0 && overallBudget > 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <PiggyBank stroke={BRAND_PURPLE} size={32} opacity={0.6} />
            </View>
            <Text style={styles.emptyTitle}>No spending yet</Text>
            <Text style={styles.emptySub}>You haven't recorded any expenses for this budget period.</Text>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, animatedFabStyle]}>
        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={[{flex:1, alignItems:'center', justifyContent:'center'}]} onPress={() => navigation.navigate('BudgetSettings')}>
            <Settings2 stroke="#FFF" size={24} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'transparent',
  },headerTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl, color: TEXT_DARK },
  iconBtn: { padding: 6, borderRadius: RADIUS.md, backgroundColor: '#FFF', ...SHADOWS.card },

  monthSelector: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full, gap: 8, ...SHADOWS.card,
  },
  monthSelectorText: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, color: TEXT_DARK },

  content: { paddingHorizontal: 20, paddingBottom: 100 },

  // Exceeded Alert Card
  alertCard: {
    backgroundColor: '#EF4444',
    borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 16,
    ...SHADOWS.strong,
  },
  alertLeft: {},
  alertTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: '#FFF' },
  alertSub: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  alertOverAmount: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxxl, color: '#FFF', marginTop: 12 },
  alertOverLabel: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.85)' },

  // Monthly Budget Card
  budgetCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 24, ...SHADOWS.card,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLabel: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  budgetOfLabel: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED },
  budgetAmount: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxxl, color: TEXT_DARK, marginBottom: 14 },
  progressBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 8, zIndex: -1 },
  progressFill: { height: '100%', borderRadius: 4 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', zIndex: -1 },
  budgetRemaining: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED },
  budgetPct: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.sm },

  dropdownContainerWrapper: { width: 130, zIndex: 5000 },
  dropdown: { minHeight: 38, backgroundColor: '#F9FAFB', borderColor: '#E8EAF0', borderRadius: RADIUS.full, paddingHorizontal: 12 },
  dropdownText: { fontFamily: FONTS.semiBold, fontSize: 13, color: TEXT_DARK },
  dropdownList: { borderColor: '#E8EAF0', borderRadius: RADIUS.lg, zIndex: 6000, elevation: 6000 },
  dropdownArrow: { width: 16, height: 16, tintColor: TEXT_MUTED },

  setBudgetCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl, padding: 20,
    alignItems: 'center', marginBottom: 24, ...SHADOWS.card,
    flexDirection: 'column',
  },
  setBudgetText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: BRAND_PURPLE },

  sectionTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: TEXT_DARK, marginBottom: 14 },

  // Category Cards
  catCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 10, ...SHADOWS.card,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catIcon: { fontSize: 20 },
  catInfo: { flex: 1 },
  catName: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  catLimit: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginTop: 2 },
  catRight: { alignItems: 'flex-end' },
  catSpent: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  catPct: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.sm, marginTop: 2 },
  catProgressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 3 },

  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_PURPLE + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: TEXT_DARK },
  emptySub: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.strong,
  },
});
