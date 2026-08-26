import { useNavigate } from 'react-router-dom';
import { Play, Clock, XCircle } from 'lucide-react';
import { useRef, useState, useEffect, memo } from 'react';
import { openReel } from '../../utils/navigation';

const STATUS_CONFIG = {
  pending: {
    label: 'Under Review',
    icon: Clock,
    bg: 'rgba(251,146,60,0.92)',
    color: '#fff',
    pulse: true,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bg: 'rgba(239,68,68,0.92)',
    color: '#fff',
    pulse: false,
  },
};

const ProductCard = memo(({ product, style = {} }) => {
  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const reel = product.primaryReel || product.reels?.[0];

  const status = product.status; // 'pending' | 'approved' | 'rejected'
  const statusCfg = STATUS_CONFIG[status] || null;
  const isClickable = status === 'approved';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !reel?.videoUrl || !hovering) return;

    const fullSrc = getFullSrc(reel.videoUrl);
    video.src = fullSrc;

    return () => {
      video.src = '';
    };
  }, [hovering, reel]);

  return (
    <div
      onClick={() => isClickable && openReel(navigate, product)}
      onMouseEnter={() => { if (isClickable) { setHovering(true); videoRef.current?.play().catch(()=>{}); } }}
      onMouseLeave={() => { setHovering(false); if(videoRef.current){videoRef.current.pause();videoRef.current.currentTime=0;} }}
      className="glass animate-fade-in"
      style={{
        display:'flex', gap:14, padding:12, borderRadius:18,
        background: 'rgba(15, 29, 20, 0.75)',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        backdropFilter: 'blur(20px)',
        cursor: isClickable ? 'pointer' : 'default',
        transition:'all 0.25s ease',
        transform: hovering ? 'translateY(-2px)' : 'none',
        boxShadow: hovering ? '0 12px 40px rgba(212, 175, 55, 0.25)' : '0 4px 15px rgba(0, 0, 0, 0.5)',
        opacity: statusCfg ? 0.85 : 1,
        ...style,
      }}
    >
      <div style={{ width:110, minHeight:130, borderRadius:14, overflow:'hidden', position:'relative', background:'#040704', flexShrink:0, border: '1px solid rgba(212, 175, 55, 0.15)' }}>
        {reel ? (
          <>
            <video
              ref={videoRef}
              poster={reel.thumbnail ? getFullSrc(reel.thumbnail) : undefined}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
            {!hovering && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)' }}><Play size={26} fill="#FFE58F" color="#D4AF37" /></div>}
          </>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0d1a12,#16281c)' }}><Play size={26} color="#A3B8A8" /></div>
        )}

        {/* Status badge overlay on thumbnail */}
        {statusCfg && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: statusCfg.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '4px 6px',
            backdropFilter: 'blur(4px)',
          }}>
            <statusCfg.icon size={11} color={statusCfg.color} />
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, color: statusCfg.color, letterSpacing: 0.3,
              animation: statusCfg.pulse ? 'pulse 2s infinite' : 'none',
            }}>
              {statusCfg.label}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6, minWidth:0, justifyContent: 'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <h3 style={{ fontSize:'0.95rem', fontWeight:700, color: '#F5F5EC', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{product.name}</h3>
        </div>
        {product.vendor?.name && <p style={{ fontSize:'0.78rem', color:'#A3B8A8', fontWeight:500 }}>{product.vendor.name}</p>}
        {product.description && <p style={{ fontSize:'0.8rem', color:'#8c9e90', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.4 }}>{product.description}</p>}
        {product.tags?.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
            {product.tags.slice(0,3).map(t => <span key={t} style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:'rgba(212,175,55,0.12)', color:'#FFE58F', border: '1px solid rgba(212,175,55,0.25)', fontWeight:500 }}>{t}</span>)}
          </div>
        )}
        <div style={{ marginTop: 4, display:'flex', alignItems:'center', gap:8 }}>
          {product.isOnSale ? (
            <><span style={{ fontSize:'1.05rem', fontWeight:800, color:'#FFE58F' }}>₹{product.price?.toLocaleString()||'0'}</span><span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:'rgba(16,185,129,0.2)', color:'#10b981', border: '1px solid rgba(16,185,129,0.4)', fontWeight:700 }}>For Sale</span></>
          ) : <span style={{ fontSize:'0.72rem', color:'#8c9e90', fontWeight:500 }}>Not for Sale</span>}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
