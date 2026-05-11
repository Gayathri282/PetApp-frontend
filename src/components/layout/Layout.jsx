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
      await Promise.all([updateUnread(), updateNotifications()]);
      
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
    };

    const interval = setInterval(checkUpdates, 10000);
    return () => clearInterval(interval);
  }, [user, location.pathname, unreadCount, notificationCount, updateUnread, updateNotifications, toast]);

  const hideChrome =
    !user ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/product/');

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

