import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../api';
import { MessageCircle, Search, ChevronRight, User } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

export default function ChatListPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { updateUnread } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getConversations();
        setConversations(data.conversations);
        updateUnread();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [updateUnread]);

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><Spinner size={48} /></div>;

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F5F5EC', fontFamily: 'Cinzel, serif', letterSpacing: '0.04em' }}>Messages</h1>
        <div style={{ background:'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: 10, borderRadius: 14 }}>
          <MessageCircle size={20} color="#D4AF37" />
        </div>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', opacity:0.7, color: '#A3B8A8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <p>No messages yet. Submit an enquiry to start chatting with vendors!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {conversations.map((c) => (
            <div
              key={c.user._id}
              onClick={() => navigate(`/chat/${c.user._id}`)}
              className="glass"
              style={{
                padding: 16,
                borderRadius: 20,
                background: 'rgba(15, 29, 20, 0.75)',
                border: '1px solid rgba(212, 175, 55, 0.22)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', position:'relative', background: 'rgba(255,255,255,0.05)', border: '2px solid #D4AF37', padding: 2, flexShrink: 0 }}>
                {c.user.avatar ? (
                  <img src={c.user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', background: c.user.role === 'admin' ? 'linear-gradient(135deg, #FFE58F, #D4AF37)' : '#1e3827' }}>
                    <User size={24} color={c.user.role === 'admin' ? '#0f0c08' : '#FFE58F'} />
                  </div>
                )}
                {c.unread && <div style={{ position:'absolute', top:0, right:0, width:14, height:14, background:'#ef4444', border:'2px solid #080d09', borderRadius:'50%' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F5EC' }}>
                    {c.user.name} {c.user.role === 'admin' && <span style={{ fontSize:'0.65rem', background:'rgba(212, 175, 55, 0.2)', color:'#FFE58F', border: '1px solid rgba(212, 175, 55, 0.4)', padding:'2px 8px', borderRadius:8, marginLeft:4, fontWeight: 700 }}>Admin</span>}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#A3B8A8', fontWeight: 500 }}>
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#8c9e90', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.lastMessage}
                </p>
              </div>
              <ChevronRight size={18} color="#D4AF37" opacity={0.6} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
