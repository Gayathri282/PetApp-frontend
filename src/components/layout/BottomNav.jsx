import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, MessageCircle } from 'lucide-react';

const tabs = [
  { path: '/feed', icon: Home, label: 'Feed' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/chat', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
                transform: isActive ? 'translateY(-2px)' : 'none'
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                style={{
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' : 'none'
                }}
              />
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
