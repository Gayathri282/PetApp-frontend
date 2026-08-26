import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Download, Smartphone, ShoppingBag, Heart, Scissors, Package, Users, MessageCircle, User, Plus } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, notificationCount, unreadCount, canInstall, installApp, isStandalone, wasInstalled } = useAuth();

  if (!user) return null;
  if (location.pathname.startsWith('/login')) return null;

  const desktopMenuItems = [
    { label: 'Buy / Sell', icon: ShoppingBag, path: '/search' },
    { label: 'Adoption', icon: Heart, path: '/search?category=adoption' },
    { label: 'Pet Services', icon: Scissors, path: '/search?category=services' },
    { label: 'Essentials', icon: Package, path: '/search?category=essentials' },
    { label: 'Community', icon: Users, path: '/feed' },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-menu { display: none !important; }
          .desktop-only-action { display: none !important; }
          .main-navbar-container { height: 58px !important; padding: 0 16px !important; }
        }
      `}</style>
      {!isStandalone && wasInstalled && !canInstall && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:99, background:'linear-gradient(to right, #D4AF37, #AA7C11)', padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 15px rgba(0,0,0,0.3)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Smartphone size={18} color="#0f0c08" />
            <span style={{ color:'#0f0c08', fontSize:'0.82rem', fontWeight:700 }}>Better experience in the KeralaPets app</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background:'#0f0c08', color:'#D4AF37', border:'none', padding:'6px 14px', borderRadius:8, fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}
          >
            Open App
          </button>
        </div>
      )}
      <nav
        className="main-navbar-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(10, 18, 13, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Left: KeralaPets Gold Logo */}
        <div
          onClick={() => navigate('/feed')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <Logo size={38} showText={true} layout="horizontal" />
        </div>

        {/* Center: Desktop Navigation Quick Links (Hidden on Mobile) */}
        <div className="desktop-nav-menu" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {desktopMenuItems.map((item, idx) => {
            const IconComp = item.icon;
            const isActive = location.pathname + location.search === item.path;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid transparent',
                  color: isActive ? '#FFE58F' : '#d1d5db',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <IconComp size={16} color="#D4AF37" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canInstall && (
            <button 
              className="desktop-only-action"
              onClick={installApp}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                background: 'linear-gradient(135deg, #FFE58F, #D4AF37, #AA7C11)',
                padding: '8px 14px',
                borderRadius: 12,
                border: 'none',
                color: '#0f0c08',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)'
              }}
            >
              <Download size={15} /> Install App
            </button>
          )}

          {/* Search Icon */}
          <div 
            onClick={() => navigate('/search')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              background: 'rgba(255,255,255,0.05)',
              padding: 9,
              borderRadius: 12,
              border: '1px solid rgba(212,175,55,0.2)'
            }}
          >
            <Search size={20} color="#D4AF37" />
          </div>

          {/* Messages */}
          <div 
            onClick={() => navigate('/chat')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              position: 'relative',
              background: 'rgba(255,255,255,0.05)',
              padding: 9,
              borderRadius: 12,
              border: '1px solid rgba(212,175,55,0.2)'
            }}
          >
            <MessageCircle size={20} color="#D4AF37" />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -2, right: -2, width: 16, height: 16,
                background: '#ef4444', borderRadius: '50%',
                fontSize: '0.65rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid #090807'
              }}>
                {unreadCount}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div 
            onClick={() => navigate('/notifications')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              position: 'relative',
              background: 'rgba(255,255,255,0.05)',
              padding: 9,
              borderRadius: 12,
              border: '1px solid rgba(212,175,55,0.2)'
            }}
          >
            <Bell size={20} color="#D4AF37" />
            {notificationCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -2, right: -2, width: 16, height: 16,
                background: '#ef4444', borderRadius: '50%',
                fontSize: '0.65rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid #090807'
              }}>
                {notificationCount}
              </div>
            )}
          </div>

          {/* Profile */}
          <div 
            onClick={() => navigate('/profile')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              background: 'rgba(255,255,255,0.05)',
              padding: 9,
              borderRadius: 12,
              border: '1px solid rgba(212,175,55,0.2)'
            }}
          >
            <User size={20} color="#D4AF37" />
          </div>
        </div>
      </nav>
    </>
  );
}

