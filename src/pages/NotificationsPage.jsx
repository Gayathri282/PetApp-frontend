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
    <div style={{ padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto', paddingBottom: 100 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F5F5EC', fontFamily: 'Cinzel, serif', marginBottom: 24, letterSpacing: '0.04em' }}>Activity</h1>

      {notifications.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', opacity:0.6, color: '#A3B8A8' }}>
          <Heart size={48} color="#D4AF37" style={{ marginBottom:16, opacity:0.4 }} />
          <p>No activity yet. When people like your reels, you'll see them here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => n.product && navigate(`/product/${n.product._id}`)}
              className="glass"
              style={{
                padding: '14px 18px',
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: n.product ? 'pointer' : 'default',
                border: n.read ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(212,175,55,0.4)',
                background: n.read ? 'rgba(15, 29, 20, 0.6)' : 'rgba(212,175,55,0.08)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '2px solid #D4AF37', flexShrink: 0, padding: 2 }}>
                {n.sender.avatar ? (
                  <img src={getFullSrc(n.sender.avatar)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', background: 'linear-gradient(135deg, #FFE58F, #D4AF37)' }}>
                    <User size={20} color="#0f0c08" />
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.86rem', lineHeight: 1.4, color: '#F5F5EC' }}>
                  <span style={{ fontWeight: 700, color: '#FFE58F' }}>{n.sender.name}</span> {n.message.replace(n.sender.name, '').trim()}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, color: '#A3B8A8', fontSize:'0.72rem' }}>
                  <Clock size={11} color="#D4AF37" />
                  <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              </div>

              {n.product?.reels?.[n.reelIndex] && (
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#040704', border: '1px solid rgba(212,175,55,0.2)' }}>
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
