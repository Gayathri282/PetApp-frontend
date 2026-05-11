import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Download } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, notificationCount } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  if (!user) return null;
  if (location.pathname.startsWith('/login')) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={() => navigate('/feed')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}
      >
        {/* Logo Removed */}
      </div>

      <div style={{ display:'flex', gap:10, pointerEvents:'auto' }}>
        {deferredPrompt && (
          <button 
            onClick={handleInstall}
            className="animate-pulse-glow"
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              padding: '8px 14px',
              borderRadius: 12,
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
            }}
          >
            <Download size={18} /> Install App
          </button>
        )}

        <div 
          onClick={() => navigate('/notifications')}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative',
            background: 'rgba(255,255,255,0.05)',
            padding: 8,
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Bell size={22} color="#fff" />
          {notificationCount > 0 && (
            <div style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              background: '#ef4444',
              borderRadius: '50%',
              fontSize: '0.65rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              border: '2px solid #0f0d1a'
            }}>
              {notificationCount}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
