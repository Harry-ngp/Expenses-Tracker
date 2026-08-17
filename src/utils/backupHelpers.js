import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { getDb } from '../db/schema';

/**
 * Export all user data (expenses, categories, category budgets) directly into user's public folder (Downloads).
 * Uses modern Expo SDK 54 Directory & File APIs.
 */
export const exportUserDataBackup = async (user) => {
  if (!user || !user.id) {
    Alert.alert('Error', 'User session not found.');
    return;
  }

  try {
    const db = getDb();

    // 1. Fetch expenses
    const expenses = db.getAllSync(
      `SELECT e.id, e.category_id, e.amount, e.currency, e.payment_method, e.description, e.date, c.name as category_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ?
       ORDER BY e.date DESC;`,
      [user.id]
    );

    // 2. Fetch custom categories
    const categories = db.getAllSync(
      `SELECT id, name, icon, color FROM categories WHERE user_id = ? OR user_id IS NULL;`,
      [user.id]
    );

    // 3. Fetch category budgets
    const categoryBudgets = db.getAllSync(
      `SELECT category_id, budget FROM category_budgets WHERE user_id = ?;`,
      [user.id]
    );

    const backupPayload = {
      app: 'ExpenseIQ',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        username: user.username,
        email: user.email,
        monthly_budget: user.monthly_budget,
      },
      categories,
      categoryBudgets,
      expenses,
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `ExpenseIQ_Backup_${dateStr}.json`;
    const jsonContent = JSON.stringify(backupPayload, null, 2);

    // 1. Try modern Expo SDK 54 Directory.pickDirectoryAsync to save directly into phone's Downloads folder
    try {
      const selectedDir = await Directory.pickDirectoryAsync();
      if (selectedDir && selectedDir.uri) {
        const createdFile = selectedDir.createFile(fileName, 'application/json');
        createdFile.write(jsonContent);
        Alert.alert('Download Complete 📥', `Backup file successfully saved to ${selectedDir.name || 'selected folder'}!\nFile: ${fileName}`);
        return;
      }
    } catch (e) {
      console.log('Directory picker skipped/cancelled, falling back to share dialog:', e);
    }

    // 2. Fallback: Save to Documents directory & open system file saver / share
    const backupFile = new File(Paths.document, fileName);
    backupFile.write(jsonContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File to Downloads',
        UTI: 'public.json',
      });
    } else {
      Alert.alert('Download Complete 📥', `File saved to Documents:\n${fileName}`);
    }
  } catch (error) {
    console.error('Export Backup Error:', error);
    Alert.alert('Export Failed', error.message || 'Unable to generate backup file.');
  }
};

/**
 * Prompt user to select a JSON backup file and import data into the local SQLite database.
 */
export const importUserDataBackup = async (user, onSuccess) => {
  if (!user || !user.id) {
    Alert.alert('Error', 'User session not found.');
    return;
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // User cancelled picking file
    }

    const pickedFile = result.assets[0];
    const backupFile = new File(pickedFile.uri);
    const fileContent = await backupFile.text();

    let backupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (e) {
      Alert.alert('Invalid File', 'The selected file is not a valid JSON backup file.');
      return;
    }

    if (!backupData || !Array.isArray(backupData.expenses)) {
      Alert.alert('Invalid Backup Format', 'The file does not contain valid ExpenseIQ data.');
      return;
    }

    const db = getDb();
    let importedCount = 0;

    // Begin database import
    db.withTransactionSync(() => {
      // Import/Update monthly budget if provided
      if (backupData.user && backupData.user.monthly_budget) {
        db.runSync('UPDATE users SET monthly_budget = ? WHERE id = ?;', [
          backupData.user.monthly_budget,
          user.id,
        ]);
      }

      // Import category budgets if provided
      if (Array.isArray(backupData.categoryBudgets)) {
        for (const cb of backupData.categoryBudgets) {
          if (cb.category_id && cb.budget > 0) {
            db.runSync(
              `INSERT INTO category_budgets (user_id, category_id, budget)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id, category_id) DO UPDATE SET budget = excluded.budget;`,
              [user.id, cb.category_id, cb.budget]
            );
          }
        }
      }

      // Import expenses
      for (const exp of backupData.expenses) {
        if (exp.amount && exp.date) {
          db.runSync(
            `INSERT INTO expenses
               (user_id, category_id, amount, currency, payment_method, description, date, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
            [
              user.id,
              exp.category_id || 10,
              exp.amount,
              exp.currency || 'INR',
              exp.payment_method || 'Cash',
              exp.description || null,
              exp.date,
            ]
          );
          importedCount++;
        }
      }
    });

    Alert.alert(
      'Backup Restored! 🎉',
      `Successfully imported ${importedCount} expense records into your account.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) onSuccess();
          },
        },
      ]
    );
  } catch (error) {
    console.error('Import Backup Error:', error);
    Alert.alert('Import Failed', error.message || 'An error occurred while importing backup.');
  }
};
