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
    <div style={{ padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto', background: '#F3F8F5', minHeight: '100dvh', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p className="section-label">COMMUNICATION</p>
          <h1 className="serif-heading" style={{ fontSize: '1.6rem', color: '#12332F', margin: 0 }}>Messages</h1>
        </div>
        <div style={{ background: '#E8F1ED', border: '1px solid #D6E3DE', padding: 10, borderRadius: 14 }}>
          <MessageCircle size={20} color="#0D5148" />
        </div>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 20, border: '1px solid #D6E3DE' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#12332F', marginBottom: 6 }}>No messages yet</p>
          <p style={{ fontSize: '0.84rem', color: '#60736F' }}>Click "Enquire" on any pet listing or reel to start chatting with vendors!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conversations.map((c) => (
            <div
              key={c.user._id}
              onClick={() => navigate(`/chat/${c.user._id}`)}
              className="card"
              style={{
                padding: 16,
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #D6E3DE',
                boxShadow: '0 4px 18px rgba(13, 81, 72, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', position: 'relative', background: '#E8F1ED', border: '2px solid #0D5148', flexShrink: 0 }}>
                {c.user.avatar ? (
                  <img src={c.user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.user.role === 'admin' ? '#0D5148' : '#E8F1ED' }}>
                    <User size={24} color={c.user.role === 'admin' ? '#FFFFFF' : '#0D5148'} />
                  </div>
                )}
                {c.unread && <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: '#ef4444', border: '2px solid #FFFFFF', borderRadius: '50%' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#12332F', margin: 0 }}>
                    {c.user.name} {c.user.role === 'admin' && <span style={{ fontSize: '0.65rem', background: '#0D5148', color: '#FFFFFF', padding: '2px 8px', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}>Admin Support</span>}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 500 }}>
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#60736F', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.lastMessage}
                </p>
              </div>
              <ChevronRight size={18} color="#0D5148" opacity={0.6} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
