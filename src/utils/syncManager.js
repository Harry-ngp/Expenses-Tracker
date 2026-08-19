import { supabase } from '../config/supabase';
import NetInfo from '@react-native-community/netinfo';
import { getDb } from '../db/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SYNC_KEY = '@expenses_last_sync_at';

export const getExportPayload = (user) => {
  if (!user || !user.id) return null;
  const db = getDb();
  
  const expenses = db.getAllSync(
    `SELECT e.id, e.category_id, e.amount, e.currency, e.payment_method, e.description, e.date, c.name as category_name
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = ?`,
    [user.id]
  );
  
  const categories = db.getAllSync(
    `SELECT id, name, icon, color FROM categories WHERE user_id = ? OR user_id IS NULL;`,
    [user.id]
  );
  
  const categoryBudgets = db.getAllSync(
    `SELECT category_id, budget FROM category_budgets WHERE user_id = ?;`,
    [user.id]
  );
  
  return {
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
};

export const syncUp = async (user) => {
  if (!user || !user.email) return { success: false, message: 'No user session' };
  
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { success: false, message: 'Offline' };
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false, message: 'Not authenticated with cloud' };
    
    const payload = getExportPayload(user);
    if (!payload) return { success: false, message: 'Failed to generate payload' };
    
    const { error } = await supabase.from('user_sync_data').upsert({
      user_id: session.user.id,
      email: session.user.email,
      username: user.username,
      monthly_budget: user.monthly_budget || 0,
      data_json: payload,
      last_synced_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    
    if (error) throw error;
    
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return { success: true };
  } catch (err) {
    console.error('Sync Up Error:', err);
    return { success: false, message: err.message };
  }
};

export const syncDown = async (user) => {
  if (!user || !user.id || !user.email) return { success: false, message: 'No user session' };
  
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { success: false, message: 'Offline' };
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false, message: 'Not authenticated with cloud' };
    
    const { data, error } = await supabase
      .from('user_sync_data')
      .select('data_json, last_synced_at')
      .eq('user_id', session.user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    if (!data || !data.data_json) return { success: true, message: 'No cloud data to sync' };
    
    // Check if we already synced this
    const localLastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (localLastSync && new Date(data.last_synced_at) <= new Date(localLastSync)) {
      return { success: true, message: 'Already up to date' };
    }
    
    const backupData = data.data_json;
    if (!backupData.expenses) return { success: false, message: 'Invalid cloud payload' };
    
    const db = getDb();
    
    db.withTransactionSync(() => {
      // Clean old data first since we are mirroring the exact state
      db.runSync('DELETE FROM expenses WHERE user_id = ?', [user.id]);
      db.runSync('DELETE FROM category_budgets WHERE user_id = ?', [user.id]);
      db.runSync('DELETE FROM categories WHERE user_id = ?', [user.id]);
      
      if (backupData.user && backupData.user.monthly_budget) {
        db.runSync('UPDATE users SET monthly_budget = ? WHERE id = ?;', [backupData.user.monthly_budget, user.id]);
      }
      
      if (Array.isArray(backupData.categories)) {
        for (const cat of backupData.categories) {
          db.runSync(
            'INSERT INTO categories (id, user_id, name, icon, color) VALUES (?, ?, ?, ?, ?)',
            [cat.id, cat.user_id || user.id, cat.name, cat.icon, cat.color]
          );
        }
      }
      
      if (Array.isArray(backupData.categoryBudgets)) {
        for (const cb of backupData.categoryBudgets) {
          db.runSync(
            'INSERT INTO category_budgets (user_id, category_id, budget) VALUES (?, ?, ?)',
            [user.id, cb.category_id, cb.budget]
          );
        }
      }
      
      if (Array.isArray(backupData.expenses)) {
        for (const exp of backupData.expenses) {
          db.runSync(
            `INSERT INTO expenses
               (id, user_id, category_id, amount, currency, payment_method, description, date, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
            [
              exp.id,
              user.id,
              exp.category_id,
              exp.amount,
              exp.currency || 'INR',
              exp.payment_method || 'Cash',
              exp.description || null,
              exp.date,
            ]
          );
        }
      }
    });
    
    await AsyncStorage.setItem(LAST_SYNC_KEY, data.last_synced_at);
    return { success: true, imported: backupData.expenses.length };
  } catch (err) {
    console.error('Sync Down Error:', err);
    return { success: false, message: err.message };
  }
};
