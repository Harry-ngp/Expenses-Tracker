import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const AUTH_KEY = '@expenses_user';

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

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(sanitizeUserData(parsed));
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (userData) => {
    const cleanUser = sanitizeUserData(userData);
    setUser(cleanUser);
    try {
      if (cleanUser) {
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(cleanUser));
      }
    } catch (err) {
      console.error('Failed to save user session:', err);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (err) {
      console.error('Failed to clear user session:', err);
    }
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
    <AuthContext.Provider value={{ user, loading, login, logout, updateBudget }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

