import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Download, Smartphone } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, notificationCount, canInstall, installApp, isStandalone, wasInstalled } = useAuth();

  if (!user) return null;
  if (location.pathname.startsWith('/login')) return null;

  return (
    <>
    {!isStandalone && wasInstalled && !canInstall && (
      <div style={{ position:'fixed', top:60, left:0, right:0, zIndex:99, background:'linear-gradient(to right, #0082ff, #a855f7)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 15px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Smartphone size={20} color="#fff" />
          <span style={{ color:'#fff', fontSize:'0.85rem', fontWeight:600 }}>Better experience in the KerelaPets app</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ background:'#fff', color:'#0082ff', border:'none', padding:'6px 14px', borderRadius:8, fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}
        >
          Open App
        </button>
      </div>
    )}
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
        {canInstall && (
          <button 
            onClick={installApp}
            className="animate-pulse-glow"
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: 'linear-gradient(135deg, #0082ff, #a855f7)',
              padding: '8px 14px',
              borderRadius: 12,
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 130, 255, 0.4)'
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
              border: '2px solid #0b0914'
            }}>
              {notificationCount}
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
