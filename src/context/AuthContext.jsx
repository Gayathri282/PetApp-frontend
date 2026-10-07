import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi, getConversations, getNotifications } from '../api';
import { DEFAULT_CK_CUSTOM_CATEGORIES } from '../data/ckGuppyCategories';

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
      localStorage.removeItem('jwt');
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

  const isVendor = user?.role === 'vendor' || user?.vendorApproved === true || user?.email?.toLowerCase() === 'contact.ckguppyfarm@gmail.com';
  const isAdmin = user?.role === 'admin';

  const effectiveUser = user?.email?.toLowerCase() === 'contact.ckguppyfarm@gmail.com' ? {
    ...user,
    role: 'vendor',
    vendorApproved: true,
    name: user.name || 'CK Guppies',
    avatar: user.avatar || '/ck-guppies-logo.jpg',
    bio: user.bio || '🏆 India’s Biggest Guppy Farm 🇮🇳 | 🎉 7600+ Happy Customers | 🌿 100+ Premium Guppy Strains | 💯 Educational 🎬 No Harm to Fish',
    vendorDetails: {
      ...(user?.vendorDetails || {}),
      businessName: user?.vendorDetails?.businessName || 'CK Guppies',
      contactEmail: user?.vendorDetails?.contactEmail || 'contact.ckguppyfarm@gmail.com',
      contactNumber: user?.vendorDetails?.contactNumber || '8667377338',
      upiDetails: user?.vendorDetails?.upiDetails || { upiId: '8667377338@paytm', accountHolderName: 'CK Guppies' },
      customCategories: (user?.vendorDetails?.customCategories && user.vendorDetails.customCategories.length > 0)
        ? user.vendorDetails.customCategories
        : DEFAULT_CK_CUSTOM_CATEGORIES,
    }
  } : user;

  return (
    <AuthContext.Provider
      value={{ 
        user: effectiveUser, loading, isVendor, isAdmin, 
        unreadCount, updateUnread, 
        notificationCount, updateNotifications, 
        logout, refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

