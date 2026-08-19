import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  PieChart, BarChart2, Tag, CreditCard, HardDrive, Cloud,
  Download, Settings, HelpCircle, Info, LogOut, ChevronRight, Calendar, Bell
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { FONTS, SHADOWS, RADIUS } from '../constants/theme';
import { exportUserDataBackup, importUserDataBackup } from '../utils/backupHelpers';
import { syncUp, syncDown } from '../utils/syncManager';
import { getDb } from '../db/schema';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';

const BRAND_PURPLE = '#FF6B6B'; // Sunset Horizon Primary
const BG_APP = '#F7F8FA';
const TEXT_DARK = '#1C1C28';
const TEXT_MUTED = '#8F92A1';

const MenuRow = ({ icon: Icon, iconColor, label, onPress, rightElement }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
      <Icon stroke={iconColor} size={20} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <View style={styles.menuRight}>
      {rightElement || <ChevronRight stroke={TEXT_MUTED} size={18} />}
    </View>
  </TouchableOpacity>
);

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [syncing, setSyncing] = useState(false);
  const [expenseCount, setExpenseCount] = useState(0);

  const initials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : 'JD';

  const loadStats = () => {
    try {
      if (!user) return;
      const db = getDb();
      const res = db.getFirstSync(
        `SELECT COUNT(*) as count FROM expenses WHERE user_id = ?;`,
        [user.id]
      );
      if (res) setExpenseCount(res.count);
    } catch (e) {
      console.error('Failed to load menu stats', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [user])
  );

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const downResult = await syncDown(user);
      const upResult = await syncUp(user);
      
      if (upResult.success || downResult.success) {
        Alert.alert('Sync Successful', 'Your data is up to date with the cloud.');
        loadStats();
      } else {
        Alert.alert('Sync Notice', upResult.message || downResult.message || 'Could not sync.');
      }
    } catch (error) {
      Alert.alert('Sync Error', error.message || 'An unexpected error occurred.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.username || 'John Doe'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Menu Rows */}
        <View style={styles.section}>
          <MenuRow
            icon={PieChart} iconColor={BRAND_PURPLE} label="Budget"
            onPress={() => navigation.navigate('Main', { screen: 'Budget' })}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Calendar} iconColor="#F59E0B" label="Calendar View"
            onPress={() => navigation.navigate('Calendar')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={BarChart2} iconColor="#10B981" label="Reports"
            onPress={() => navigation.navigate('Main', { screen: 'Reports' })}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Bell} iconColor="#10B981" label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Tag} iconColor="#F59E0B" label="Categories"
            onPress={() => Alert.alert('Coming Soon', 'Category management coming soon.')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={CreditCard} iconColor="#3F8CFF" label="Payment Methods"
            onPress={() => Alert.alert('Coming Soon', 'Payment method management coming soon.')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={HardDrive} iconColor="#6B7280" label="Backup & Restore"
            onPress={() => {
              Alert.alert('Backup & Restore', 'Choose an option to manage your data backup:', [
                {
                  text: 'Export Backup',
                  onPress: () => exportUserDataBackup(user),
                },
                {
                  text: 'Import Backup',
                  onPress: () => importUserDataBackup(user, () => navigation.navigate('Main', { screen: 'Dashboard' })),
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Cloud} iconColor="#3B82F6" label="Sync Data Now"
            onPress={handleManualSync}
            rightElement={syncing ? <Text style={{color: TEXT_MUTED}}>Syncing...</Text> : null}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Download} iconColor="#8B5CF6" label="Export Data"
            onPress={() => exportUserDataBackup(user)}
          />
        </View>

        <View style={styles.section}>
          <MenuRow
            icon={HelpCircle} iconColor="#F59E0B" label="Help & Support"
            onPress={() => Alert.alert('Help', 'For help, visit our support page.')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Info} iconColor="#3F8CFF" label="About App"
            onPress={() => Alert.alert('LocalBite AI Expense Tracker', 'Version 1.0.0\nBuilt with ❤️ using React Native & Expo')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut stroke="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_APP },
  content: { padding: 20, paddingBottom: 100 },

  profileCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    marginBottom: 24, gap: 16, ...SHADOWS.card,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xl, color: '#FFF' },
  profileName: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg, color: TEXT_DARK },
  profileEmail: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, color: TEXT_MUTED, marginTop: 3 },

  section: {
    backgroundColor: '#FFF', borderRadius: RADIUS.xl,
    marginBottom: 16, overflow: 'hidden', ...SHADOWS.card,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: TEXT_DARK },
  menuRight: { marginLeft: 8 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: RADIUS.xl,
    paddingVertical: 16, gap: 10, ...SHADOWS.card,
  },
  logoutText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: '#EF4444' },
});
