import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

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
        justifyContent: 'flex-start',
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={() => navigate('/feed')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}
      >
        <Logo size={42} showText={false} />
      </div>
    </nav>
  );
}
