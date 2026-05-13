import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { getConversations } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function Layout({ children }) {
  const { user, unreadCount, updateUnread, notificationCount, updateNotifications } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const prevCount = useRef(0);
  const prevNotifCount = useRef(0);

  // Poll for updates
  useEffect(() => {
    if (!user) return;

    const checkUpdates = async () => {
      try {
        const oldUnread = prevCount.current;
        const oldNotif = prevNotifCount.current;
        
        await Promise.all([updateUnread(), updateNotifications()]);
        
        // We use fresh values from refs or state might be stale in this closure
        // But since we want to show toast, we'll check them after the await
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial check
    checkUpdates();

    const interval = setInterval(checkUpdates, 15000); // 15s is plenty
    return () => clearInterval(interval);
  }, [user, updateUnread, updateNotifications]);

  // Separate effect for Toasts to prevent interval churn
  useEffect(() => {
    if (!user) return;
    
    const isChatPage = location.pathname.startsWith('/chat');
    if (!isChatPage && unreadCount > prevCount.current) {
      toast.info('You have a new message!');
    }
    prevCount.current = unreadCount;

    const isNotifPage = location.pathname === '/notifications';
    if (!isNotifPage && notificationCount > prevNotifCount.current) {
      toast.info('New activity on your profile!');
    }
    prevNotifCount.current = notificationCount;
  }, [unreadCount, notificationCount, location.pathname, user, toast]);

  const isChatRoom = location.pathname.startsWith('/chat/');
  const hideChrome =
    !user ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/product/') ||
    isChatRoom;

  return (
    <>
      {!hideChrome && <Navbar />}
      <main
        style={{
          flex: 1,
          paddingTop: hideChrome ? 0 : 60,
          paddingBottom: hideChrome ? 0 : 68,
          minHeight: '100dvh',
        }}
      >
        {children}
      </main>
      {!hideChrome && <BottomNav />}
    </>
  );
}

