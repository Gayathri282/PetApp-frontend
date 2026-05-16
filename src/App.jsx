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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip splash if already loaded in this session
    const loaded = sessionStorage.getItem('app_loaded');
    if (loaded) {
      setIsLoading(false);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('app_loaded', 'true');
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
        background: '#0f0d1a',
        gap: 24 
      }}>
        <div style={{ 
          width: 80, height: 80, background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
          borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(99,102,241,0.3)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🐾</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>PetPlace</h1>
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
