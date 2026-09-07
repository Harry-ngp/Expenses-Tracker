import { getDb } from './schema';
import { currentMonthKey, todayISO } from '../utils/dateHelpers';

// ═══════════════════════════════════════════════════════════════
//  AUTH QUERIES
// ═══════════════════════════════════════════════════════════════

export const createUser = (email, username, passwordHash) => {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?);',
    [email.toLowerCase().trim(), username.trim(), passwordHash]
  );
  return result.lastInsertRowId;
};

export const getUserByEmail = (email) => {
  const db = getDb();
  return db.getFirstSync(
    'SELECT * FROM users WHERE email = ?;',
    [email.toLowerCase().trim()]
  );
};

export const updateMonthlyBudget = (userId, budget) => {
  const db = getDb();
  db.runSync('UPDATE users SET monthly_budget = ? WHERE id = ?;', [budget, userId]);
};

// ═══════════════════════════════════════════════════════════════
//  EXPENSE QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Insert a new expense. Returns the new row id.
 */
export const addExpense = ({ userId, categoryId, amount, description, date, paymentMethod }) => {
  const db = getDb();
  const result = db.runSync(
    `INSERT INTO expenses
       (user_id, category_id, amount, description, date, payment_method, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'));`,
    [userId, categoryId, amount, description || null, date, paymentMethod || 'Cash']
  );
  return result.lastInsertRowId;
};

/**
 * Update an existing expense row.
 */
export const updateExpense = ({ id, categoryId, amount, description, date, paymentMethod }) => {
  const db = getDb();
  db.runSync(
    `UPDATE expenses
     SET category_id = ?, amount = ?, description = ?, date = ?, payment_method = ?, updated_at = datetime('now')
     WHERE id = ?;`,
    [categoryId, amount, description || null, date, paymentMethod || 'Cash', id]
  );
};

/**
 * Soft-delete: permanently removes the expense row.
 */
export const deleteExpense = (expenseId) => {
  const db = getDb();
  db.runSync('DELETE FROM expenses WHERE id = ?;', [expenseId]);
};

/**
 * Fetch all expenses for a user with optional filters.
 */
export const getExpenses = ({ userId, categoryId, startDate, endDate, minAmount, maxAmount, search } = {}) => {
  const db = getDb();
  let query = `
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  const params = [userId];

  if (categoryId) { query += ' AND e.category_id = ?'; params.push(categoryId); }
  if (startDate)  { query += ' AND substr(e.date, 1, 10) >= ?'; params.push(startDate); }
  if (endDate)    { query += ' AND substr(e.date, 1, 10) <= ?'; params.push(endDate); }
  if (minAmount != null) { query += ' AND e.amount >= ?'; params.push(minAmount); }
  if (maxAmount != null) { query += ' AND e.amount <= ?'; params.push(maxAmount); }
  if (search) {
    const isNumeric = !isNaN(Number(search)) && search.trim() !== '';
    if (isNumeric) {
      query += ' AND (e.description LIKE ? OR c.name LIKE ? OR e.payment_method LIKE ? OR e.amount = ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, Number(search));
    } else {
      query += ' AND (e.description LIKE ? OR c.name LIKE ? OR e.payment_method LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
  }

  query += ' ORDER BY e.date DESC, e.created_at DESC;';
  return db.getAllSync(query, params);
};

/**
 * Get total spent for a specific month (YYYY-MM).
 */
export const getMonthlyTotal = (userId, monthKey) => {
  const db = getDb();
  const row = db.getFirstSync(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE user_id = ? AND substr(date, 1, 7) = ?;`,
    [userId, monthKey]
  );
  return row?.total || 0;
};

/**
 * Returns daily totals for a date range — for charts and calendar view.
 * Result: [{ date: 'YYYY-MM-DD', total: number }, ...]
 */
export const getDailyTotals = (userId, startDate, endDate) => {
  const db = getDb();
  return db.getAllSync(
    `SELECT substr(date, 1, 10) as date, SUM(amount) as total
     FROM expenses
     WHERE user_id = ? AND substr(date, 1, 10) >= ? AND substr(date, 1, 10) <= ?
     GROUP BY substr(date, 1, 10)
     ORDER BY date ASC;`,
    [userId, startDate, endDate]
  );
};

/**
 * Returns monthly totals for a date range (e.g. for a year) — for charts.
 * Result: [{ month: 'YYYY-MM', total: number }, ...]
 */
export const getMonthlyTotals = (userId, startDate, endDate) => {
  const db = getDb();
  return db.getAllSync(
    `SELECT substr(date, 1, 7) as month, SUM(amount) as total
     FROM expenses
     WHERE user_id = ? AND substr(date, 1, 7) >= ? AND substr(date, 1, 7) <= ?
     GROUP BY month
     ORDER BY month ASC;`,
    [userId, startDate.substring(0, 7), endDate.substring(0, 7)]
  );
};

/**
 * Returns per-category totals for a date range — for pie chart.
 */
export const getCategoryTotals = (userId, startDate, endDate) => {
  const db = getDb();
  return db.getAllSync(
    `SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e
       ON c.id = e.category_id AND e.user_id = ? AND e.date BETWEEN ? AND ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY total DESC;`,
    [userId, startDate, endDate]
  );
};

/**
 * Get a single expense by id.
 */
export const getExpenseById = (expenseId) => {
  const db = getDb();
  return db.getFirstSync(
    `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.id = ?;`,
    [expenseId]
  );
};

// ═══════════════════════════════════════════════════════════════
//  RECURRING EXPENSE AUTO-TRIGGER
// ═══════════════════════════════════════════════════════════════

/**
 * On each app launch, auto-add recurring expenses for current month
 * if they haven't already been triggered this month.
 */
export const processRecurringExpenses = (userId) => {
  const db = getDb();
  const monthKey = currentMonthKey();
  const today    = todayISO();

  const recurring = db.getAllSync(
    `SELECT * FROM expenses
     WHERE user_id = ? AND is_recurring = 1;`,
    [userId]
  );

  for (const expense of recurring) {
    // Check if already triggered this month
    const alreadyDone = db.getFirstSync(
      `SELECT id FROM recurring_log
       WHERE expense_id = ? AND triggered_month = ?;`,
      [expense.id, monthKey]
    );

    if (!alreadyDone) {
      // Add a new expense entry for this month
      const recDay = expense.recurrence_day || 1;
      const [year, month] = today.split('-');
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const day = Math.min(recDay, daysInMonth);
      const newDate = `${year}-${month}-${String(day).padStart(2, '0')}`;

      db.runSync(
        `INSERT INTO expenses
           (user_id, category_id, amount, description, date, is_recurring, recurrence_day, payment_method, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, NULL, ?, datetime('now'));`,
        [userId, expense.category_id, expense.amount,
         `[Auto] ${expense.description || ''}`, newDate, expense.payment_method || 'Cash']
      );

      // Log it
      db.runSync(
        `INSERT INTO recurring_log (expense_id, triggered_month) VALUES (?, ?);`,
        [expense.id, monthKey]
      );
    }
  }
};



// ═══════════════════════════════════════════════════════════════
//  CATEGORY & BUDGET QUERIES
// ═══════════════════════════════════════════════════════════════

export const getCategoriesForUser = (userId) => {
  const db = getDb();
  return db.getAllSync(
    'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY id ASC;',
    [userId]
  );
};

export const addCategory = (userId, name, icon, color) => {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO categories (name, icon, color, user_id) VALUES (?, ?, ?, ?);',
    [name, icon, color, userId]
  );
  return result.lastInsertRowId;
};

export const updateCategory = (categoryId, name, icon, color) => {
  const db = getDb();
  db.runSync(
    'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?;',
    [name, icon, color, categoryId]
  );
};

export const deleteCategory = (categoryId) => {
  const db = getDb();
  db.runSync('DELETE FROM categories WHERE id = ?;', [categoryId]);
};

// ═══════════════════════════════════════════════════════════════
//  MONTH-WISE BUDGET & CATEGORY LIMIT QUERIES (JSON-BACKED)
// ═══════════════════════════════════════════════════════════════

export const getMonthlyBudgetsJson = (userId) => {
  if (!userId) return {};
  const db = getDb();
  try {
    const row = db.getFirstSync('SELECT monthly_budgets_json FROM users WHERE id = ?;', [userId]);
    if (row && row.monthly_budgets_json) {
      const parsed = JSON.parse(row.monthly_budgets_json);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('getMonthlyBudgetsJson parse error:', err);
  }
  return {};
};

export const saveMonthlyBudgetsJson = (userId, budgetsMap) => {
  if (!userId) return;
  const db = getDb();
  const jsonStr = JSON.stringify(budgetsMap || {});
  db.runSync('UPDATE users SET monthly_budgets_json = ? WHERE id = ?;', [jsonStr, userId]);
};

export const getMonthlyBudget = (userId, month) => {
  if (!userId || !month) return 0;
  const budgets = getMonthlyBudgetsJson(userId);
  if (budgets[month] && budgets[month].overall != null) {
    return Number(budgets[month].overall) || 0;
  }
  return 0;
};

export const setMonthlyBudget = (userId, month, budget) => {
  if (!userId || !month) return;
  const budgets = getMonthlyBudgetsJson(userId);
  if (!budgets[month]) {
    budgets[month] = { overall: 0, categories: {} };
  }
  budgets[month].overall = Number(budget) || 0;
  saveMonthlyBudgetsJson(userId, budgets);

  // Keep users.monthly_budget in sync if setting current month
  if (month === currentMonthKey()) {
    updateMonthlyBudget(userId, Number(budget) || 0);
  }
};

export const deleteMonthlyBudget = (userId, month) => {
  if (!userId || !month) return;
  const budgets = getMonthlyBudgetsJson(userId);
  if (budgets[month]) {
    budgets[month].overall = 0;
    saveMonthlyBudgetsJson(userId, budgets);
  }
};

export const getCategoryBudgets = (userId, month) => {
  if (!userId) return [];
  const db = getDb();
  const allCats = getCategoriesForUser(userId);

  if (month) {
    const budgetsMap = getMonthlyBudgetsJson(userId);
    const monthCatLimits = budgetsMap[month]?.categories || {};

    return allCats
      .filter(c => monthCatLimits[c.id] != null && Number(monthCatLimits[c.id]) > 0)
      .map(c => ({
        category_id: c.id,
        budget: Number(monthCatLimits[c.id]),
        name: c.name,
        icon: c.icon,
        color: c.color,
      }));
  }

  // Fallback if no month passed (legacy)
  return db.getAllSync(
    `SELECT cb.*, c.name, c.icon, c.color 
     FROM category_budgets cb
     JOIN categories c ON cb.category_id = c.id
     WHERE cb.user_id = ?;`,
    [userId]
  );
};

export const setCategoryBudget = (userId, categoryId, budget, month) => {
  if (!userId || !categoryId) return;
  if (month) {
    const budgets = getMonthlyBudgetsJson(userId);
    if (!budgets[month]) {
      budgets[month] = { overall: 0, categories: {} };
    }
    if (!budgets[month].categories) {
      budgets[month].categories = {};
    }
    const val = Number(budget);
    if (val > 0) {
      budgets[month].categories[categoryId] = val;
    } else {
      delete budgets[month].categories[categoryId];
    }
    saveMonthlyBudgetsJson(userId, budgets);
    return;
  }

  // Legacy fallback
  const db = getDb();
  db.runSync(
    `INSERT INTO category_budgets (user_id, category_id, budget)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, category_id) DO UPDATE SET budget = excluded.budget;`,
    [userId, categoryId, budget]
  );
};

export const deleteCategoryBudget = (userId, categoryId, month) => {
  if (!userId || !categoryId) return;
  if (month) {
    const budgets = getMonthlyBudgetsJson(userId);
    if (budgets[month]?.categories && budgets[month].categories[categoryId]) {
      delete budgets[month].categories[categoryId];
      saveMonthlyBudgetsJson(userId, budgets);
    }
    return;
  }

  // Legacy fallback
  const db = getDb();
  db.runSync('DELETE FROM category_budgets WHERE user_id = ? AND category_id = ?;', [userId, categoryId]);
};
