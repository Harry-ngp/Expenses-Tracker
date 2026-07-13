import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/db/schema';
import { COLORS } from './src/constants/theme';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'VirtualizedLists should never be nested',
]);

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      initializeDatabase();
    } catch (err) {
      console.error('DB init failed:', err);
    } finally {
      setDbReady(true);
    }
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
