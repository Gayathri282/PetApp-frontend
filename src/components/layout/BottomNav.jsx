import { useState, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomNav = memo(function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, isVendor, isAdmin } = useAuth();
  
  // Optimistic active path for zero latency visual feedback
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  const navItems = [
    { path: '/feed', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Browse' },
    { path: '/add', icon: Plus, isAdd: true, label: 'List' },
    { path: '/chat', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleNavClick = (item) => {
    const targetPath = item.isAdd 
      ? (isVendor || isAdmin ? '/profile?action=add' : '/vendor/apply')
      : item.path;

    setActivePath(item.path);

    // Instant non-blocking navigation
    window.requestAnimationFrame(() => {
      navigate(targetPath);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        background: '#FFFFFF',
        borderTop: '1px solid #D6E3DE',
        boxShadow: '0 -4px 18px rgba(13, 81, 72, 0.05)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.path || (item.path === '/feed' && (activePath === '/' || activePath === '/feed'));

        if (item.isAdd) {
          return (
            <div key="add-btn" style={{ position: 'relative', top: -12 }}>
              <button
                onPointerDown={() => handleNavClick(item)}
                onClick={(e) => { e.preventDefault(); handleNavClick(item); }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#0D5148',
                  border: '3px solid #FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(13, 81, 72, 0.25)',
                  transition: 'transform 0.1s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                <Plus size={24} strokeWidth={2.8} />
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.path}
            onPointerDown={() => handleNavClick(item)}
            onClick={(e) => { e.preventDefault(); handleNavClick(item); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '1 1 0px',
              maxWidth: 68,
              minWidth: 0,
              height: 52,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#0D5148' : '#94A3B8',
              transition: 'color 0.1s ease, transform 0.1s ease',
              position: 'relative',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              padding: '0 2px',
              transform: 'translateZ(0)',
            }}
          >
            <div 
              style={{ 
                marginBottom: 2, 
                transition: 'transform 0.1s ease',
                transform: isActive ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                position: 'relative',
                pointerEvents: 'none',
              }}
            >
              <Icon 
                size={21} 
                strokeWidth={isActive ? 2.5 : 1.9} 
              />
              {/* Notification Badge */}
              {item.badge > 0 && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -4, 
                    minWidth: 16, 
                    height: 16, 
                    background: '#ef4444', 
                    borderRadius: 8, 
                    border: '2px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: '#fff',
                    padding: '0 4px'
                  }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.02em',
                opacity: isActive ? 1 : 0.8,
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#0D5148',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

export default BottomNav;
