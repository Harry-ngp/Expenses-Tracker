import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, List, PieChart, BarChart2, MoreHorizontal, AlignLeft, Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FONTS } from '../constants/theme';

import LoginScreen           from '../screens/LoginScreen';
import RegisterScreen        from '../screens/RegisterScreen';
import DashboardScreen       from '../screens/DashboardScreen';
import AddExpenseScreen      from '../screens/AddExpenseScreen';
import ReportsScreen         from '../screens/ReportsScreen';
import TransactionsListScreen from '../screens/TransactionsListScreen';
import BudgetOverviewScreen  from '../screens/BudgetOverviewScreen';
import BudgetSettingsScreen  from '../screens/BudgetSettingsScreen';
import CalendarScreen        from '../screens/CalendarScreen';
import MenuScreen            from '../screens/MenuScreen';
import NotificationsScreen   from '../screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const BRAND_PURPLE = '#6C4CF1';
const TEXT_DARK    = '#1C1C28';
const TEXT_MUTED   = '#8F92A1';
const BG_WHITE     = '#FFFFFF';
const BG_APP       = '#F7F8FA';
const BORDER       = '#F0F1F5';

// ── Shared static header (same on every tab screen) ─────────────
const AppHeader = ({ title }) => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  
  return (
    <SafeAreaView style={headerStyles.safe} edges={['top']}>
      <View style={headerStyles.container}>
        {/* Left — hamburger */}
        <TouchableOpacity style={headerStyles.iconBtn}>
          <AlignLeft stroke={TEXT_DARK} size={22} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Center — page title */}
        <Text style={headerStyles.title}>{title}</Text>

        {/* Right — bell */}
        <TouchableOpacity
          style={headerStyles.iconBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell stroke={TEXT_DARK} size={22} strokeWidth={2.5} />
          {unreadCount > 0 && (
            <View style={headerStyles.badge}>
              <Text style={headerStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Tab icon — icon + label SAME ROW (horizontal) ───────────────
const TabIcon = ({ IconComponent, label, focused }) => {
  const color = focused ? BRAND_PURPLE : TEXT_MUTED;
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
      <IconComponent stroke={color} size={22} strokeWidth={focused ? 2.5 : 2} />
      <Text 
        style={[tabStyles.label, { color }, focused && tabStyles.labelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
};

// ── Bottom tab navigator ────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      // Render the shared header for every tab
      header: () => <AppHeader title={route.name === 'More' ? 'More' : route.name} />,
      tabBarStyle: {
        backgroundColor: BG_WHITE,
        borderTopColor: BORDER,
        borderTopWidth: 1,
        height: 64,
        paddingVertical: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
      },
      tabBarShowLabel: false,
      tabBarItemStyle: {
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
      },
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon IconComponent={Home} label="Dashboard" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Transactions"
      component={TransactionsListScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon IconComponent={List} label="Transactions" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Budget"
      component={BudgetOverviewScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon IconComponent={PieChart} label="Budget" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon IconComponent={BarChart2} label="Reports" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="More"
      component={MenuScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon IconComponent={MoreHorizontal} label="More" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// ── Root navigator ──────────────────────────────────────────────
const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ presentation: 'modal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="BudgetSettings"
              component={BudgetSettingsScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

// ── Header styles ───────────────────────────────────────────────
const headerStyles = StyleSheet.create({
  safe: { backgroundColor: BG_APP },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG_APP,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: TEXT_DARK,
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: BG_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444', // Red
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG_APP,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  }
});

// ── Tab icon styles (COLUMN — icon on top, text under) ─────────
const tabStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    minWidth: 56, // Ensure enough width so text doesn't squish too easily
  },
  wrapActive: {
    // No background pill for column layout usually, rely on color
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 10,
  },
  labelActive: {
    fontFamily: FONTS.semiBold,
    color: BRAND_PURPLE,
  },
});
