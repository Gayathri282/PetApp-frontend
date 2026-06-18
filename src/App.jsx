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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}><Spinner size={48} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('app_loaded'));

  useEffect(() => {
    // Ensure the flag is set even if we skipped the timer
    if (!localStorage.getItem('app_loaded')) {
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('app_loaded', 'true');
      }, 1200);
    }

    // Wake up the Render backend
    import('./api').then(({ default: api }) => {
      api.get('/api/health').catch(() => {});
    });
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100dvh', 
        background: '#0b0914',
        gap: 24 
      }}>
        <div style={{ 
          width: 80, height: 80, background: 'linear-gradient(135deg, #00d2ff, #a855f7)', 
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(0, 210, 255, 0.4)',
          animation: 'pulse 2s infinite ease-in-out',
          padding: 2
        }}>
          <img src="/logo.png" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} alt="KerelaPets Logo" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-tall)', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>KerelaPets</h1>
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductReelPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/vendor/apply" element={<ProtectedRoute><VendorApplyPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Layout>
  );
}
