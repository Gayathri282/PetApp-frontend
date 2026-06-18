import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi, getConversations, getNotifications } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    return await fetchUser();
  };

  const updateUnread = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getConversations();
      const count = data.conversations.filter(c => c.unread).length;
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, [user]);

  const updateNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getNotifications();
      const count = data.notifications.filter(n => !n.read).length;
      setNotificationCount(count);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    // Check for token in URL (from Google redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      localStorage.setItem('jwt', urlToken);
      // Clean up the URL with a fresh navigation to ensure correct viewport rendering on mobile
      window.location.replace(window.location.pathname);
      return; // Stop execution here as the page will reload
    }
    
    fetchUser();
  }, [fetchUser]);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // If already in standalone mode, we cannot install
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setCanInstall(false);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      localStorage.setItem('pwa_installed', 'true');
      // Reopen in standalone mode after install completes
      setTimeout(() => window.location.reload(), 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
      // Reload so the browser relaunches in standalone (PWA) mode immediately
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    localStorage.removeItem('jwt');
    setUser(null);
    setUnreadCount(0);
    setNotificationCount(0);
  };

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const wasInstalled = localStorage.getItem('pwa_installed') === 'true';

  return (
    <AuthContext.Provider
      value={{ 
        user, loading, isVendor, isAdmin, 
        unreadCount, updateUnread, 
        notificationCount, updateNotifications, 
        logout, refreshUser,
        canInstall, installApp,
        isStandalone, wasInstalled
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

