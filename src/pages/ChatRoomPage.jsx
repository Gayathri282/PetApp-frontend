import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatMessages, sendMessage } from '../api';
import { ArrowLeft, Send, Phone, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function ChatRoomPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUnread } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getChatMessages(userId);
        setMessages(data.messages);
        updateUnread();
        
        if (data.messages.length > 0) {
          const firstOther = data.messages.find(m => m.sender._id === userId);
          if (firstOther) setOtherUser(firstOther.sender);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId, updateUnread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tempMsg = {
      _id: Date.now(),
      sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      content,
      createdAt: new Date(),
    };

    setMessages([...messages, tempMsg]);
    setContent('');

    try {
      await sendMessage({ receiverId: userId, content });
    } catch (err) {
      console.error(err);
    }
  };

  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderContent = (text, isMine = false) => {
    if (!text) return null;
    const linkColor = isMine ? '#F3C34E' : '#0D5148';
    
    // First, handle markdown links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let parts = text.split(mdLinkRegex);
    
    let result = [];
    for (let i = 0; i < parts.length; i += 3) {
      const plain = parts[i];
      if (plain) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const subParts = plain.split(boldRegex);
        result.push(...subParts.map((sub, j) => (j % 2 === 1 ? <strong key={`${i}-${j}`}>{sub}</strong> : sub)));
      }
      
      if (i + 1 < parts.length) {
        const linkText = parts[i+1];
        const linkUrl = parts[i+2];
        const isInternal = linkUrl.startsWith(window.location.origin) || 
                          linkUrl.startsWith('/') || 
                          linkUrl.includes('/product/') || 
                          linkUrl.includes('/reel/') || 
                          linkUrl.includes('/reels/') || 
                          linkUrl.includes('/feed');
        
        if (isInternal) {
          let path = linkUrl;
          if (linkUrl.startsWith('http')) {
            try {
              const url = new URL(linkUrl);
              path = url.pathname + url.search;
            } catch {
              path = linkUrl;
            }
          }
          
          result.push(
            <span 
              key={`link-${i}`} 
              onClick={() => navigate(path, { state: { from: 'chat' } })}
              style={{ color: linkColor, textDecoration: 'underline', fontWeight: 700, cursor:'pointer' }}
            >
              {linkText}
            </span>
          );
        } else {
          result.push(
            <a key={`link-${i}`} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline', fontWeight: 700 }}>
              {linkText}
            </a>
          );
        }
      }
    }
    
    if (result.length === 1 && typeof result[0] === 'string') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let urlParts = result[0].split(urlRegex);
      return urlParts.map((part, i) => {
        if (urlRegex.test(part)) {
          let path = part;
          const isInternal = part.includes('/product/') || part.includes('/reel/') || part.includes('/reels/') || part.includes('/feed');
          if (isInternal) {
            try {
              const u = new URL(part);
              path = u.pathname + u.search;
            } catch { /* use raw */ }
            return (
              <span key={i} onClick={() => navigate(path, { state: { from: 'chat' } })} style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-all', fontWeight: 700 }}>
                {part}
              </span>
            );
          }
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 700 }}>
              {part}
            </a>
          );
        }
        return part;
      });
    }

    return result;
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}><Spinner size={48} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F3F8F5', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #D6E3DE', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(13,81,72,0.04)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#0D5148', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #0D5148', background: '#E8F1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {otherUser?.avatar ? (
            <img src={getFullSrc(otherUser.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="#0D5148" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#12332F', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {otherUser?.name || 'Seller'} 
            {otherUser?.role === 'admin' && <span style={{ fontSize: '0.62rem', background: '#0D5148', color: '#FFFFFF', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Admin Support</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>● Active Now</span>
            {otherUser?.contactNumber && (
              <span style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 500 }}>• {otherUser.contactNumber}</span>
            )}
          </div>
        </div>
        {otherUser?.contactNumber && (
          <a href={`tel:${otherUser.contactNumber}`} style={{ background: '#E8F1ED', border: '1px solid #D6E3DE', borderRadius: 10, padding: 8, color: '#0D5148', display: 'flex' }}>
            <Phone size={18} />
          </a>
        )}
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: '#F3F8F5' }}
      >
        {messages.map((m) => {
          const isMine = m.sender._id.toString() === currentUser._id.toString();
          return (
            <div
              key={m._id}
              style={{
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              {m.product && (
                <div 
                  onClick={() => navigate(`/product/${m.product._id || m.product}`)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: isMine ? 'rgba(13, 81, 72, 0.12)' : '#FFFFFF',
                    border: '1px solid #D6E3DE',
                    cursor: 'pointer',
                  }}
                >
                  <ShoppingBag size={14} color="#0D5148" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0D5148' }}>
                    Listing: {m.product.name || 'Pet Item'}
                  </span>
                </div>
              )}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isMine ? '#0D5148' : '#FFFFFF',
                  color: isMine ? '#FFFFFF' : '#111111',
                  border: isMine ? 'none' : '1px solid #D6E3DE',
                  fontSize: '0.9rem',
                  lineHeight: 1.45,
                  boxShadow: '0 2px 10px rgba(13, 81, 72, 0.04)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {renderContent(m.content, isMine)}
                
                {/* Admin Only Content */}
                {m.adminOnlyContent && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: isMine ? '1px solid rgba(255,255,255,0.2)' : '1px solid #D6E3DE', fontSize: '0.8rem' }}>
                    {renderContent(m.adminOnlyContent, isMine)}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#60736F', marginTop: 4, fontWeight: 500 }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Input */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: '#FFFFFF', borderTop: '1px solid #D6E3DE' }}>
        <form
          onSubmit={handleSend}
          style={{ display: 'flex', gap: 10, background: '#F3F8F5', padding: '6px 6px 6px 16px', borderRadius: 24, border: '1px solid #D6E3DE' }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#111111',
              fontSize: '0.9rem',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          <button
            type="submit"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: 'none',
              background: '#0D5148',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <Send size={17} color="#FFFFFF" />
          </button>
        </form>
      </div>
    </div>
  );
}
