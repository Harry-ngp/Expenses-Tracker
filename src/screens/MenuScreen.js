import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>More Options</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Profile</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>Username: {user?.username}</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>Email: {user?.email}</Text>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Settings</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingIcon}>🎨</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#fff' : colors.textMuted}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Coming Soon', 'Backup feature is not implemented yet.')}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingIcon}>☁️</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Backup Data</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Help', 'Visit our website for help.')}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Help & FAQ</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Contact', 'Email support@example.com')}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingIcon}>✉️</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Contact Us</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: SPACING.md, borderBottomWidth: 1 },
  title: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.xxl },
  content: { padding: SPACING.md, paddingBottom: 100 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  cardTitle: { fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.lg, marginBottom: 8 },
  cardText: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.md, marginBottom: 4 },
  sectionTitle: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.sm, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 20, marginRight: SPACING.sm },
  settingText: { fontFamily: FONTS.medium, fontSize: FONTS.sizes.md },
  divider: { height: 1, marginVertical: SPACING.xs },
  arrow: { fontSize: 24, fontFamily: FONTS.regular, marginBottom: 4 },
  logoutBtn: { alignItems: 'center', marginTop: SPACING.xl, padding: SPACING.md },
  logoutText: { fontFamily: FONTS.bold, fontSize: FONTS.sizes.lg },
});
