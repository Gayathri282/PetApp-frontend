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

  const renderContent = (text) => {
    if (!text) return null;
    
    // First, handle markdown links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let parts = text.split(mdLinkRegex);
    
    // This will give us: [plain, text, url, plain, text, url, ...]
    let result = [];
    for (let i = 0; i < parts.length; i += 3) {
      // Plain text part
      const plain = parts[i];
      if (plain) {
        // Handle bold in plain text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const subParts = plain.split(boldRegex);
        result.push(...subParts.map((sub, j) => (j % 2 === 1 ? <strong key={`${i}-${j}`}>{sub}</strong> : sub)));
      }
      
      // Link part (text and url)
      if (i + 1 < parts.length) {
        const linkText = parts[i+1];
        const linkUrl = parts[i+2];
        const isInternal = linkUrl.startsWith(window.location.origin) || linkUrl.startsWith('/');
        
        if (isInternal) {
          const path = linkUrl.replace(window.location.origin, '');
          result.push(
            <span 
              key={`link-${i}`} 
              onClick={() => navigate(path)}
              style={{ color: '#818cf8', textDecoration: 'underline', fontWeight: 600, cursor:'pointer' }}
            >
              {linkText}
            </span>
          );
        } else {
          result.push(
            <a key={`link-${i}`} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline', fontWeight: 600 }}>
              {linkText}
            </a>
          );
        }
      }
    }
    
    // Fallback for raw URLs not in markdown format
    if (result.length === 1 && typeof result[0] === 'string') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let urlParts = result[0].split(urlRegex);
      return urlParts.map((part, i) => {
        if (urlRegex.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline', wordBreak: 'break-all' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', background: '#0f0d1a', position:'fixed', top:0, left:0, right:0, bottom:68, zIndex:200 }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,13,26,0.8)', backdropFilter:'blur(20px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: otherUser?.role === 'admin' ? '#fb923c' : '#6366f1' }}>
          {otherUser?.avatar ? (
            <img src={getFullSrc(otherUser.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={20} color="#fff" />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            {otherUser?.name || 'Admin'} 
            {otherUser?.role === 'admin' && <span style={{ fontSize:'0.6rem', color:'#fb923c', marginLeft:6, fontWeight:800, textTransform:'uppercase' }}>Support</span>}
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>Active Now</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6 }}>
          <Phone size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
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
                  className="glass-light" 
                  style={{ padding: 10, borderRadius: 12, marginBottom: 4, display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(251,146,60,0.2)' }}
                >
                  <ShoppingBag size={14} color="#fb923c" />
                  <span style={{ fontSize:'0.75rem', fontWeight:600 }}>Enquiry: {m.product.name}</span>
                </div>
              )}
              <div
                className={isMine ? 'gradient-primary' : 'glass-light'}
                style={{
                  padding: '12px 16px',
                  borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  boxShadow: isMine ? '0 4px 15px rgba(99,102,241,0.2)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {renderContent(m.content)}
                
                {/* Admin Only Content */}
                {m.adminOnlyContent && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>
                    {renderContent(m.adminOnlyContent)}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: 4 }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <form
          onSubmit={handleSend}
          style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <input
            type="text"
            placeholder="Describe your issue..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', padding: '8px 16px', outline: 'none', fontSize: '0.9rem' }}
          />
          <button
            type="submit"
            className="gradient-primary"
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', display: 'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer', color: '#fff' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
