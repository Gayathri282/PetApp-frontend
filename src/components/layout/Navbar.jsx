import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ShoppingBag, MessageCircle, Menu, X, Plus } from 'lucide-react';
import KeralaPetsLogo from '../ui/KeralaPetsLogo';
import { useAuth } from '../../context/AuthContext';

const getFullSrc = (url) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.replace(/\\/g, '/');
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, notificationCount, unreadCount, isVendor, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;
  if (location.pathname.startsWith('/login')) return null;

  const desktopMenuItems = [
    { label: 'Buy / Sell', path: '/search' },
    { label: 'Adoption', path: '/search?category=adoption' },
    { label: 'Pet Services', path: '/search?category=services' },
    { label: 'Essentials', path: '/search?category=essentials' },
    { label: 'Community', path: '/feed' },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-menu { display: none !important; }
          .main-navbar-container { height: 60px !important; padding: 0 16px !important; }
        }
      `}</style>

      <nav
        className="main-navbar-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#FFFFFF',
          borderBottom: '1px solid #D6E3DE',
          boxShadow: '0 2px 12px rgba(13, 81, 72, 0.04)',
        }}
      >
        {/* Left: Mobile Hamburger + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0D5148',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div
            onClick={() => navigate('/feed')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <KeralaPetsLogo size={36} showText={true} layout="horizontal" />
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <div className="desktop-nav-menu" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {desktopMenuItems.map((item, idx) => {
            const isActive = location.pathname + location.search === item.path;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  background: isActive ? '#E8F1ED' : 'transparent',
                  border: 'none',
                  color: isActive ? '#0D5148' : '#60736F',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search Icon */}
          <button 
            onClick={() => navigate('/search')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              background: '#F3F8F5',
              padding: 8,
              borderRadius: 12,
              border: '1px solid #D6E3DE',
              color: '#0D5148'
            }}
          >
            <Search size={18} />
          </button>

          {/* Messages */}
          <button 
            onClick={() => navigate('/chat')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              position: 'relative',
              background: '#F3F8F5',
              padding: 8,
              borderRadius: 12,
              border: '1px solid #D6E3DE',
              color: '#0D5148'
            }}
          >
            <MessageCircle size={18} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -3, right: -3, width: 16, height: 16,
                background: '#ef4444', borderRadius: '50%',
                fontSize: '0.62rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid #FFFFFF'
              }}>
                {unreadCount}
              </div>
            )}
          </button>

          {/* Notifications */}
          <button 
            onClick={() => navigate('/notifications')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              position: 'relative',
              background: '#F3F8F5',
              padding: 8,
              borderRadius: 12,
              border: '1px solid #D6E3DE',
              color: '#0D5148'
            }}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -3, right: -3, width: 16, height: 16,
                background: '#ef4444', borderRadius: '50%',
                fontSize: '0.62rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid #FFFFFF'
              }}>
                {notificationCount}
              </div>
            )}
          </button>

          {/* Profile Photo */}
          <div 
            onClick={() => navigate('/profile')}
            style={{ 
              cursor: 'pointer', 
              width: 36,
              height: 36,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #0D5148',
              background: '#E8F1ED',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {user?.avatar ? (
              <img src={getFullSrc(user.avatar)} alt={user?.name || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0D5148' }}>{user?.name?.[0] || 'K'}</span>
            )}
          </div>
        </div>
      </nav>

      {/* Slide-out Hamburger Menu for Mobile */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 47, 43, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
        }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            background: '#FFFFFF',
            padding: 20,
            borderBottom: '1px solid #D6E3DE',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 10px 25px rgba(13,81,72,0.1)',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0D5148', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              MARKETPLACE NAVIGATION
            </p>
            {desktopMenuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.path);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: location.pathname + location.search === item.path ? '#E8F1ED' : '#F3F8F5',
                  border: '1px solid #D6E3DE',
                  color: '#12332F',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: '#0D5148', fontWeight: 700 }}>→</span>
              </button>
            ))}

            {(isVendor || isAdmin) && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile?action=add');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  background: '#0D5148',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                <Plus size={18} /> List Your Pet / Product
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
