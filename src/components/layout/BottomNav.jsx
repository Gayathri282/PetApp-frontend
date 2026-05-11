import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { path: '/feed', icon: Home, label: 'Feed' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/chat', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useAuth();

  return (
    <div
      className="glass-strong"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive =
          location.pathname === path ||
          (path === '/feed' && location.pathname === '/');

        const isMessages = path === '/chat';

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 48,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#fff' : '#64748b',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
            }}
          >
            <div 
              style={{ 
                marginBottom: 2, 
                transition: 'transform 0.3s ease',
                transform: isActive ? 'translateY(-2px)' : 'none',
                position: 'relative'
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                style={{
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' : 'none'
                }}
              />
              {/* Notification Badge */}
              {isMessages && unreadCount > 0 && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -4, 
                    minWidth: 16, 
                    height: 16, 
                    background: '#ef4444', 
                    borderRadius: 8, 
                    border: '2px solid #0f0d1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: '#fff',
                    padding: '0 4px'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.02em',
                opacity: isActive ? 1 : 0.7,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#818cf8',
                  boxShadow: '0 0 10px #818cf8',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

