import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    async function initAuth() {
      try {
        if (window.api) {
          const currentUser = await window.api.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
          const demos = await window.api.getDemoAccounts();
          setDemoAccounts(demos || []);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      if (!window.api) throw new Error('Desktop IPC bridge not available');
      const loggedUser = await window.api.login(email, password);
      setUser(loggedUser);
      addToast(`Welcome, ${loggedUser.full_name} (${loggedUser.role.toUpperCase()})`, 'success');
      return loggedUser;
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (window.api) {
        await window.api.logout();
      }
      setUser(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      console.error(err);
      setUser(null);
    }
  };

  const switchUser = async (userId) => {
    try {
      if (!window.api) throw new Error('Desktop IPC bridge not available');
      const newUser = await window.api.switchUser(userId);
      setUser(newUser);
      addToast(`Switched active session to: ${newUser.full_name} (${newUser.role.toUpperCase()})`, 'info');
      return newUser;
    } catch (err) {
      addToast(err.message || 'Failed to switch user', 'error');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      if (window.api) {
        const refreshed = await window.api.getCurrentUser();
        if (refreshed) {
          setUser(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUser,
        demoAccounts,
        refreshUser,
        isAdmin: user?.role === 'admin',
        isHod: user?.role === 'hod',
        isGuide: user?.role === 'guide',
        isStudent: user?.role === 'student',
        isEthics: user?.role === 'ethics',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
