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
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Messages</h1>
        <div style={{ background:'rgba(255,255,255,0.1)', padding:8, borderRadius:12 }}>
          <MessageCircle size={20} />
        </div>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', opacity:0.6 }}>
          <p>No messages yet. Submit an enquiry to start chatting with the admin!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conversations.map((c) => (
            <div
              key={c.user._id}
              onClick={() => navigate(`/chat/${c.user._id}`)}
              className="glass-light"
              style={{
                padding: 16,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', position:'relative', background: 'rgba(255,255,255,0.05)' }}>
                {c.user.avatar ? (
                  <img src={c.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background: c.user.role === 'admin' ? '#fb923c' : '#6366f1' }}>
                    <User size={24} color="#fff" />
                  </div>
                )}
                {c.unread && <div style={{ position:'absolute', top:0, right:0, width:12, height:12, background:'#ef4444', border:'2px solid #0f0d1a', borderRadius:'50%' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    {c.user.name} {c.user.role === 'admin' && <span style={{ fontSize:'0.65rem', background:'rgba(251,146,60,0.1)', color:'#fb923c', padding:'2px 6px', borderRadius:6, marginLeft:4 }}>Admin</span>}
                  </h3>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.lastMessage}
                </p>
              </div>
              <ChevronRight size={18} opacity={0.3} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
