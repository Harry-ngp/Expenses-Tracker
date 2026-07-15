import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  PieChart, BarChart2, Tag, CreditCard, HardDrive,
  Download, Settings, HelpCircle, Info, LogOut, ChevronRight, Calendar, Bell
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SHADOWS, RADIUS } from '../constants/theme';

const BRAND_PURPLE = '#6C4CF1';
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
  const { isDarkMode, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const initials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : 'JD';

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
            onPress={() => navigation.navigate('Budget')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Calendar} iconColor="#F59E0B" label="Calendar View"
            onPress={() => navigation.navigate('Calendar')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={BarChart2} iconColor="#10B981" label="Reports"
            onPress={() => navigation.navigate('Reports')}
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
            onPress={() => Alert.alert('Coming Soon', 'Backup & Restore coming soon.')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon={Download} iconColor="#8B5CF6" label="Export Data"
            onPress={() => Alert.alert('Coming Soon', 'Data export coming soon.')}
          />
        </View>

        <View style={styles.section}>
          <MenuRow
            icon={Settings} iconColor={TEXT_DARK} label="Dark Mode"
            onPress={toggleTheme}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E8EAF0', true: BRAND_PURPLE }}
                thumbColor="#FFF"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            }
          />
          <View style={styles.divider} />
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
