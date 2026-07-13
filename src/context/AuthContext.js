import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, username, monthly_budget }

  const login  = (userData) => setUser(userData);
  const logout = () => setUser(null);
  const updateBudget = (budget) => setUser((u) => ({ ...u, monthly_budget: budget }));

  return (
    <AuthContext.Provider value={{ user, login, logout, updateBudget }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
