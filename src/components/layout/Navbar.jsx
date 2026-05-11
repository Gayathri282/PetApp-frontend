import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, notificationCount } = useAuth();

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

      <div 
        onClick={() => navigate('/notifications')}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          pointerEvents: 'auto',
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
    </nav>
  );
}
