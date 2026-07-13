import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { formatDate, formatINR } from '../utils/dateHelpers';

/**
 * Displays a single expense row with category color accent,
 * edit/delete actions (hidden in readonly mode).
 */
export default function ExpenseCard({ expense, onEdit, onDelete, readonly = false }) {
  return (
    <View style={styles.card}>
      {/* Color accent bar */}
      <View style={[styles.accent, { backgroundColor: expense.category_color || COLORS.primary }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: (expense.category_color || COLORS.primary) + '22' }]}>
        <Text style={styles.icon}>{expense.category_icon || '📦'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.categoryName} numberOfLines={1}>{expense.category_name || 'Other'}</Text>
        {expense.description ? (
          <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
          {expense.is_recurring ? <Text style={styles.recurringBadge}>🔄 Recurring</Text> : null}
        </View>
      </View>

      {/* Amount + Actions */}
      <View style={styles.right}>
        <Text style={styles.amount}>{formatINR(expense.amount)}</Text>
        {!readonly && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
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
  categoryName:{ fontFamily: FONTS.semiBold, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  description: { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: SPACING.sm },
  date:        { fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  recurringBadge:{ fontFamily: FONTS.regular, fontSize: FONTS.sizes.xs, color: COLORS.accent },
  right:       { alignItems: 'flex-end', paddingRight: SPACING.sm, paddingVertical: SPACING.sm },
  amount:      { fontFamily: FONTS.bold, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  actions:     { flexDirection: 'row', gap: 4, marginTop: 6 },
  actionBtn:   { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgInput },
  editIcon:    { fontSize: 13 },
  deleteBtn:   {},
  deleteIcon:  { fontSize: 13 },
});
