import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS } from '../constants/theme';

import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen   from '../screens/DashboardScreen';
import AddExpenseScreen  from '../screens/AddExpenseScreen';
import ReportsScreen     from '../screens/ReportsScreen';

// New Screens
import TransactionsListScreen from '../screens/TransactionsListScreen';
import BudgetOverviewScreen   from '../screens/BudgetOverviewScreen';
import BudgetSettingsScreen   from '../screens/BudgetSettingsScreen';
import CalendarScreen         from '../screens/CalendarScreen';
import MenuScreen             from '../screens/MenuScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon component ────────────────────────────────────────
const TabIcon = ({ emoji, label, focused, colors }) => (
  <View style={styles.tabIconWrap}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
    <Text style={[
      styles.tabLabel, 
      { color: focused ? colors.primary : colors.textMuted },
      focused && styles.tabLabelActive
    ]}>
      {label}
    </Text>
  </View>
);

// ── Bottom tab navigator (authenticated) ──────────────────────
const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Dashboard" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📜" label="Transactions" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetOverviewScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💰" label="Budget" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Reports" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MenuScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="More" focused={focused} colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ── Root navigator ────────────────────────────────────────────
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
            <Stack.Screen name="Main"       component={MainTabs} />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{
                presentation: 'modal',
                cardStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen
              name="BudgetSettings"
              component={BudgetSettingsScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              options={{
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
  },
  tabLabelActive: {
    fontFamily: FONTS.semiBold,
  },
});
