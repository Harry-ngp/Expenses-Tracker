import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { getDb } from '../db/schema';
import { getUserByEmail } from '../db/queries';

const AuthContext = createContext(null);
const AUTH_KEY = '@expenses_user_local'; // keep local profile cached

const sanitizeUserData = (data) => {
  if (!data) return null;
  return {
    id: Number(data.id),
    email: String(data.email || ''),
    username: String(data.username || ''),
    monthly_budget: Number(data.monthly_budget || 0),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, username, monthly_budget }
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Try to load local cached user for fast offline startup
        const storedUser = await AsyncStorage.getItem(AUTH_KEY);
        if (storedUser) {
          setUser(sanitizeUserData(JSON.parse(storedUser)));
        }

        // 2. Check Supabase session (handles token refresh automatically)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          syncLocalUserWithSupabase(session.user);
        } else if (!session && mounted) {
          // If no supabase session, and we are online, maybe we shouldn't be logged in?
          // Actually, persistSession is true in Supabase, so if it's null, they really are logged out.
          setUser(null);
          await AsyncStorage.removeItem(AUTH_KEY);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await syncLocalUserWithSupabase(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_KEY);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Helper to ensure Supabase user exists in local SQLite
  const syncLocalUserWithSupabase = async (supabaseUser) => {
    try {
      const email = supabaseUser.email.toLowerCase().trim();
      let localUser = getUserByEmail(email);

      if (!localUser) {
        // First time logging in on this device. Create local user shell.
        const db = getDb();
        const username = supabaseUser.user_metadata?.username || email.split('@')[0];
        
        const result = db.runSync(
          'INSERT INTO users (email, username, password_hash, monthly_budget) VALUES (?, ?, ?, ?)',
          [email, username, 'supabase_auth', 0]
        );
        localUser = { id: result.lastInsertRowId, email, username, monthly_budget: 0 };
      }

      const cleanUser = sanitizeUserData(localUser);
      setUser(cleanUser);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(cleanUser));
      return cleanUser;
    } catch (err) {
      console.error('Error syncing local user:', err);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Signout error:', error);
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    setLoading(false);
  };

  const updateBudget = async (budget) => {
    setUser((u) => {
      const updated = sanitizeUserData({ ...u, monthly_budget: budget });
      if (updated) {
        AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated)).catch((err) =>
          console.error('Failed to update user budget in storage:', err)
        );
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBudget }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

