import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, isVendor, isAdmin } = useAuth();

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/add', icon: Plus, isAdd: true, label: 'Post' },
    { path: '/chat', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleNavClick = (item) => {
    if (item.isAdd) {
      if (isVendor || isAdmin) {
        navigate('/profile?action=add');
      } else {
        navigate('/vendor/apply');
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div
      className="glass-strong"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        background: 'rgba(10, 18, 13, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.6)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/feed' && location.pathname === '/');

        if (item.isAdd) {
          return (
            <div key="add-btn" style={{ position: 'relative', top: -14 }}>
              <button
                onClick={() => handleNavClick(item)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFE58F 0%, #D4AF37 50%, #AA7C11 100%)',
                  border: '3px solid #080d09',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f0c08',
                  boxShadow: '0 6px 20px rgba(212, 175, 55, 0.5), 0 0 12px rgba(212, 175, 55, 0.3)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
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
            onClick={() => handleNavClick(item)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 58,
              height: 52,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#FFE58F' : '#A3B8A8',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div 
              style={{ 
                marginBottom: 2, 
                transition: 'transform 0.25s ease',
                transform: isActive ? 'translateY(-2px)' : 'none',
                position: 'relative',
                pointerEvents: 'none'
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 1.9} 
                style={{
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))' : 'none'
                }}
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
                    border: '2px solid #080d09',
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
                fontSize: '0.6rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.02em',
                opacity: isActive ? 1 : 0.75,
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#D4AF37',
                  boxShadow: '0 0 10px #D4AF37',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

