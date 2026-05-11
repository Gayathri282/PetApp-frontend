import { useState, useEffect } from 'react';
import { getNotifications, markNotificationsRead } from '../api';
import { Heart, User, Clock, ChevronRight } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { updateNotifications } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getNotifications();
        setNotifications(data.notifications);
        await markNotificationsRead();
        updateNotifications();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [updateNotifications]);

  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><Spinner size={48} /></div>;

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Activity</h1>

      {notifications.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', opacity:0.5 }}>
          <Heart size={48} style={{ marginBottom:16, opacity:0.2 }} />
          <p>No activity yet. When people like your reels, you'll see them here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => n.product && navigate(`/product/${n.product._id}`)}
              className="glass-light"
              style={{
                padding: '12px 16px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: n.product ? 'pointer' : 'default',
                border: n.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(139,92,246,0.3)',
                background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.05)'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                {n.sender.avatar ? (
                  <img src={getFullSrc(n.sender.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#6366f1' }}>
                    <User size={20} color="#fff" />
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700 }}>{n.sender.name}</span> {n.message.replace(n.sender.name, '').trim()}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, opacity:0.5, fontSize:'0.7rem' }}>
                  <Clock size={10} />
                  <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              </div>

              {n.product?.reels?.[n.reelIndex] && (
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                  <video src={getFullSrc(n.product.reels[n.reelIndex].videoUrl)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
