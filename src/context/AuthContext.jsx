import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for token in URL (from Google redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      localStorage.setItem('jwt', urlToken);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    localStorage.removeItem('jwt');
    setUser(null);
  };

  const refreshUser = () => fetchUser();

  const isVendor = user?.role === 'vendor' && user?.vendorApproved;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, loading, isVendor, isAdmin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
