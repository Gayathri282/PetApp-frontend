import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const hideChrome =
    !user ||
    location.pathname === '/login';

  return (
    <>
      {!hideChrome && <Navbar />}
      <main
        style={{
          flex: 1,
          paddingTop: hideChrome ? 0 : 60,
          paddingBottom: hideChrome ? 0 : 68,
          minHeight: '100dvh',
        }}
      >
        {children}
      </main>
      {!hideChrome && <BottomNav />}
    </>
  );
}
