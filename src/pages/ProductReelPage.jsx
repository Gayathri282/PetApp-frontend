import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Send, Zap, Layers, ArrowLeft, ShoppingBag } from 'lucide-react';
import VideoPlayer from '../components/reel/VideoPlayer';
import ShareModal from '../components/ui/ShareModal';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getProduct, toggleLike, submitEnquiry, updateProfile, getAdminUser, sendMessage } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ProductReelPage() {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  const containerRef = useRef(null);
  const isRestoring = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProduct(id);
        setProduct(data.product);
      } catch { toast.error('Product not found'); navigate(-1); }
      finally { setLoading(false); }
    })();

    // Clear saved reel position when leaving so re-entry always starts fresh
    return () => {
      sessionStorage.removeItem(`reel_pos_${id}`);
    };
  }, [id]);

  // ─── Restore scroll AFTER product renders (loading = false + DOM ready) ────
  const hasRestored = useRef(false);
  useEffect(() => {
    if (loading || !product) return;
    if (hasRestored.current) return;
    hasRestored.current = true;

    const raw = sessionStorage.getItem(`reel_pos_${id}`);
    if (!raw) return;

    let index = 0;
    try {
      const parsed = JSON.parse(raw);
      const FIVE_MIN = 5 * 60 * 1000;
      if (Date.now() - parsed.ts > FIVE_MIN) {
        sessionStorage.removeItem(`reel_pos_${id}`);
        return;
      }
      index = parsed.i;
    } catch {
      // Handle legacy plain index or corrupt data
      index = parseInt(raw);
      if (isNaN(index)) {
        sessionStorage.removeItem(`reel_pos_${id}`);
        return;
      }
    }

    if (index === 0) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 60;

    const tryRestore = () => {
      const container = containerRef.current;
      const target = container?.querySelector(`[data-index="${index}"]`);
      if (target) {
        isRestoring.current = true;
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
        setTimeout(() => { isRestoring.current = false; }, 500);
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        requestAnimationFrame(tryRestore);
      }
    };
    requestAnimationFrame(tryRestore);
  }, [loading, product, id]);

  // Track scroll position
  useEffect(() => {
    if (loading || !product) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (isRestoring.current) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute('data-index');
          if (index !== null) {
            sessionStorage.setItem(`reel_pos_${id}`, JSON.stringify({ i: index, ts: Date.now() }));
          }
        }
      });
    }, { threshold: 0.6 });

    const items = container.querySelectorAll('.reel-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [loading, product, id]);

  const handleLike = async (reelIndex) => {
    setLikeAnimating(reelIndex);
    setTimeout(() => setLikeAnimating(null), 400);
    try {
      const { data } = await toggleLike(product._id, reelIndex);
      setProduct(prev => {
        const updated = { ...prev, likeCount: data.likeCount };
        updated.reels = prev.reels.map((r, i) => i === reelIndex ? { ...r, isLiked: data.liked } : r);
        return updated;
      });
    } catch {}
  };

  const handleShare = () => {
    setShareAnimating(true);
    setTimeout(() => {
      setShowShare(true);
      setShareAnimating(false);
    }, 600);
  };

  const handleEnquiry = async () => {
    if (!user.contactNumber && !tempPhone) {
      toast.error('Please enter your contact number');
      return;
    }
    setSending(true);
    try {
      if (!user.contactNumber) {
        await updateProfile({ contactNumber: tempPhone });
        await refreshUser();
      }

      await submitEnquiry({ productId: product._id, message: 'Interested in this product' });
      toast.success('Interest registered! Admin will contact you.');
      setShowEnquiry(false);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to register interest'); 
    } finally { 
      setSending(false); 
    }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}><Spinner size={48} /></div>;
  if (!product) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'#000' }}>
      {/* Top Left Back Button */}
      <div style={{ position:'absolute', top:24, left:16, zIndex:100 }}>
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/feed');
            }
          }} 
          style={{ background:'rgba(0,0,0,0.3)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:10, color:'#fff', cursor:'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      {/* Reels */}
      <div className="reel-container" ref={containerRef} style={{ height:'100dvh', overflowY:'scroll', scrollSnapType:'y mandatory' }}>
        {product.reels.map((reel, i) => (
          <div key={`${product._id}-${i}`} className="reel-item" data-index={i} style={{ position:'relative', height:'100dvh', scrollSnapAlign:'start', overflow:'hidden' }}>
            <VideoPlayer key={`${product._id}-reel-${i}`} src={reel.videoUrl} />
            
            {/* Bottom Gradient Overlay */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents:'none', zIndex:5 }} />

            {/* Actions (Right Side) */}
            <div style={{ position:'absolute', right:16, bottom:120, display:'flex', flexDirection:'column', gap:24, zIndex:20, alignItems:'center' }}>

              <button onClick={() => handleLike(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#fff', padding:0 }}>
                <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={likeAnimating === i ? 'animate-icon-tap' : ''}>
                  <Heart size={26} fill={reel.isLiked?'#ef4444':'none'} color={reel.isLiked?'#ef4444':'#fff'} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>{reel.isLiked ? product.likeCount : (product.likeCount || 0)}</span>
              </button>

              <button onClick={handleShare} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#fff', padding:0 }}>
                <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={shareAnimating ? 'animate-send-fly' : ''}>
                  <Send size={24} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, textShadow:'0 2px 4px rgba(0,0,0,0.5)', opacity: shareAnimating ? 0 : 1 }}>Share</span>
              </button>

              {/* Buy button */}
              {product.isOnSale && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEnquiry(true);
                  }}
                  className="animate-zap-pulse"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a78bfa',
                    padding: 0
                  }}
                >
                  <div style={{ display:'flex', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.5))' }}>
                    <Zap size={28} fill="#8b5cf6" strokeWidth={0} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textShadow:'0 2px 4px rgba(0,0,0,0.5)', color: '#fff' }}>BUY</span>
                </button>
              )}
            </div>

            {/* Vendor Info & Product Details (Bottom Left) */}
            <div style={{ position:'absolute', bottom:100, left:16, right:100, zIndex:15 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #818cf8', padding:2, background:'rgba(0,0,0,0.3)' }}>
                  <img 
                    src={product.vendor?.avatar ? getFullSrc(product.vendor.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor?.name)}&background=6366f1&color=fff`} 
                    alt="" 
                    style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} 
                  />
                </div>
                <div>
                  <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#fff', textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>@{product.vendor?.name?.replace(/\s+/g,'').toLowerCase()}</h3>
                  <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.8)', fontWeight:500 }}>Verified Vendor</p>
                </div>
              </div>

              <h1 style={{ fontSize:'1.1rem', fontWeight:700, color:'#fff', marginBottom:6, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>{product.name}</h1>
              <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.7)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:8 }}>{product.description}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  {product.price > 0 && <span style={{ background:'#8b5cf6', color:'#fff', padding:'4px 12px', borderRadius:10, fontSize:'1rem', fontWeight:800 }}>₹{product.price.toLocaleString()}</span>}
                </div>
            </div>
          </div>
        ))}
      </div>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} />
      <Modal isOpen={showEnquiry} onClose={() => setShowEnquiry(false)} title="Register Interest">
        <div style={{ padding: 20 }}>
          {!user?.contactNumber ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.7)' }}>To help the admin reach out, please provide your contact number:</p>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                className="input-field"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={handleEnquiry}
                disabled={sending || tempPhone.length < 10}
                style={{ width: '100%' }}
              >
                {sending ? 'Saving...' : 'Confirm & Register'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 20, fontSize: '0.95rem' }}>
                Registering interest for <strong>{product.name}</strong>.
                Admin will contact you at <strong>{user.contactNumber}</strong>.
              </p>
              <button
                className="btn-primary"
                onClick={handleEnquiry}
                disabled={sending}
                style={{ width: '100%' }}
              >
                {sending ? 'Processing...' : 'Confirm Interest'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
