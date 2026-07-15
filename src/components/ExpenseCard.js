import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatINR } from '../utils/dateHelpers';

/**
 * Displays a single expense row with category color accent,
 * edit/delete actions (hidden in readonly mode).
 */
export default function ExpenseCard({ expense, onEdit, onDelete, readonly = false }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Color accent bar */}
      <View style={[styles.accent, { backgroundColor: expense.category_color || colors.primary }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: (expense.category_color || colors.primary) + '22' }]}>
        <Text style={styles.icon}>{expense.category_icon || '📦'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>{expense.category_name || 'Other'}</Text>
        {expense.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>{expense.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(expense.date)}</Text>
          {expense.payment_method ? (
            <Text style={[styles.date, { color: colors.textMuted }]}> • {expense.payment_method}</Text>
          ) : null}
          {expense.is_recurring ? <Text style={[styles.recurringBadge, { color: colors.accent }]}>🔄 Recurring</Text> : null}
        </View>
      </View>

      {/* Amount + Actions */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.textPrimary }]}>{formatINR(expense.amount)}</Text>
        {!readonly && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgInput }]} onPress={onEdit}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgInput }]} onPress={onDelete}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.card,
  },
  accent:      { width: 4, alignSelf: 'stretch' },
  iconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    margin: SPACING.sm,
  },
  icon:        { fontSize: 22 },
  info:        { flex: 1, paddingVertical: SPACING.sm },
  categoryName:{ fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md },
  description: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, marginTop: 2 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  date:        { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  recurringBadge:{ fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs },
  right:       { alignItems: 'flex-end', paddingRight: SPACING.sm, paddingVertical: SPACING.sm },
  amount:      { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md },
  actions:     { flexDirection: 'row', gap: 4, marginTop: 6 },
  actionBtn:   { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  editIcon:    { fontSize: 13 },
  deleteIcon:  { fontSize: 13 },
});
