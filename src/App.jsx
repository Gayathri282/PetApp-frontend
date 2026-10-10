import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import ProductReelPage from './pages/ProductReelPage';
import ProfilePage from './pages/ProfilePage';
import VendorApplyPage from './pages/VendorApplyPage';
import AdminPanel from './pages/admin/AdminPanel';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationsPage from './pages/NotificationsPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}><Spinner size={48} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('app_loaded'));

  useEffect(() => {
    if (!localStorage.getItem('app_loaded')) {
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('app_loaded', 'true');
      }, 1200);
    }

    import('./api').then(({ default: api }) => {
      api.get('/api/health').catch(() => {});
    });

    // Global Console Action & Button Click Logger
    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], .card, .tag-pill');
      if (target) {
        const text = (target.innerText || target.getAttribute('aria-label') || target.getAttribute('placeholder') || target.tagName).trim().replace(/\s+/g, ' ');
        console.log(
          `%c[USER ACTION] 🖱️ Clicked: "${text.slice(0, 60)}"`,
          'color: #0D5148; font-weight: bold; background: #E8F1ED; padding: 3px 8px; border-radius: 4px; border: 1px solid #B8D5CB;',
          {
            label: text,
            element: target,
            tagName: target.tagName,
            id: target.id || undefined,
            className: target.className || undefined,
            timestamp: new Date().toLocaleTimeString(),
          }
        );
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100dvh', 
        background: '#090807',
        gap: 24 
      }}>
        <div style={{ 
          width: 90, height: 90, 
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)',
          animation: 'pulse 2s infinite ease-in-out',
          padding: 2
        }}>
          <img src="/logo.png" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} alt="KeralaPets Logo" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Cinzel, serif', color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase' }}>KeralaPets</h1>
          <Spinner size={24} />
        </div>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout>
      <PWAInstallPrompt />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductReelPage />} />
          <Route path="/reel/:id" element={<ProductReelPage />} />
          <Route path="/reels/:id" element={<ProductReelPage />} />
          <Route path="/reels" element={<Navigate to="/feed" replace />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/vendor/apply" element={<ProtectedRoute><VendorApplyPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}


