import { useNavigate } from 'react-router-dom';
import { Play, Tag } from 'lucide-react';
import { useRef, useState } from 'react';

export default function ProductCard({ product, style = {} }) {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const reel = product.primaryReel || product.reels?.[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !reel?.videoUrl || !hovering) return;

    const fullSrc = getFullSrc(reel.videoUrl);

    if (fullSrc.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = fullSrc;
      } else if (window.Hls && window.Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new window.Hls();
        hls.loadSource(fullSrc);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else {
        // Fallback for browsers that support neither HLS natively nor Hls.js
        video.src = fullSrc;
      }
    } else {
      video.src = fullSrc;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [hovering, reel]);

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => { setHovering(true); videoRef.current?.play().catch(()=>{}); }}
      onMouseLeave={() => { setHovering(false); if(videoRef.current){videoRef.current.pause();videoRef.current.currentTime=0;} }}
      className="glass animate-fade-in"
      style={{ display:'flex', gap:14, padding:12, borderRadius:16, cursor:'pointer', transition:'all 0.25s', transform: hovering?'translateY(-2px)':'none', boxShadow: hovering?'0 12px 40px rgba(99,102,241,0.15)':'0 2px 8px rgba(0,0,0,0.2)', ...style }}
    >
      <div style={{ width:110, minHeight:140, borderRadius:12, overflow:'hidden', position:'relative', background:'#000', flexShrink:0 }}>
        {reel ? (
          <>
            <video 
              ref={videoRef} 
              poster={reel.thumbnail}
              muted 
              loop 
              playsInline 
              preload="metadata" 
              style={{ width:'100%', height:'100%', objectFit:'cover' }} 
            />
            {!hovering && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)' }}><Play size={28} fill="#fff" color="#fff" /></div>}
          </>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1625,#252136)' }}><Play size={28} color="#64748b" /></div>
        )}
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6, minWidth:0 }}>
        <h3 style={{ fontSize:'0.95rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</h3>
        {product.vendor?.name && <p style={{ fontSize:'0.78rem', color:'#818cf8', fontWeight:500 }}>{product.vendor.name}</p>}
        {product.description && <p style={{ fontSize:'0.8rem', color:'#94a3b8', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.4 }}>{product.description}</p>}
        {product.tags?.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
            {product.tags.slice(0,3).map(t => <span key={t} style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:'rgba(99,102,241,0.12)', color:'#818cf8', fontWeight:500 }}>{t}</span>)}
          </div>
        )}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {product.isOnSale ? (
            <><span style={{ fontSize:'1.05rem', fontWeight:800, color:'#fb923c' }}>₹{product.price?.toLocaleString()||'0'}</span><span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:'rgba(34,197,94,0.12)', color:'#22c55e', fontWeight:600 }}>For Sale</span></>
          ) : <span style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:500 }}>Not for Sale</span>}
        </div>
      </div>
    </div>
  );
}
