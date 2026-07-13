import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen   from '../screens/DashboardScreen';
import AddExpenseScreen  from '../screens/AddExpenseScreen';
import AnalyticsScreen   from '../screens/AnalyticsScreen';
import ReportsScreen     from '../screens/ReportsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon component ────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.tabIconWrap}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

// ── Bottom tab navigator (authenticated) ──────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="🏠" label="Home" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="📊" label="Analytics" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="📄" label="Reports" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
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
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontFamily: FONTS.semiBold,
  },
});
