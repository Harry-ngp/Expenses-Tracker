import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatDate } from './dateHelpers';
import { getCategoryById } from '../constants/categories';

/**
 * Converts an array of expense objects to CSV string and shares it
 * @param {Array} expenses - list of expense rows from DB
 */
export const exportToCSV = async (expenses) => {
  if (!expenses || expenses.length === 0) {
    throw new Error('No expenses to export.');
  }

  const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Recurring'];
  const rows = expenses.map((e) => {
    const category = getCategoryById(e.category_id);
    return [
      formatDate(e.date),
      category?.name || 'Other',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.is_recurring ? 'Yes' : 'No',
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  const fileName = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Expenses CSV',
    UTI: 'public.comma-separated-values-text',
  });
};
