import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Send, Zap, Layers, ArrowLeft, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import VideoPlayer from '../components/reel/VideoPlayer';
import ShareModal from '../components/ui/ShareModal';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getProduct, toggleLike, submitEnquiry, updateProfile, getAdminUser, sendMessage } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getSoundPreference, setSoundPreference } from '../hooks/useSoundPreference';

export default function ProductReelPage() {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [isMuted, setIsMuted] = useState(!getSoundPreference());

  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const isRestoring = useRef((() => {
    try {
      const raw = sessionStorage.getItem(`reel_pos_${id}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const FIVE_MIN = 5 * 60 * 1000;
      return (Date.now() - parsed.ts <= FIVE_MIN) && parsed.i > 0;
    } catch { return false; }
  })());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        console.log('[PRODUCT/REEL] Route ID:', id);
        console.log('[PRODUCT/REEL] Fetching product details from API...');
        const { data } = await getProduct(id);
        console.log('[PRODUCT/REEL] Response received:', data?.product?._id);

        if (isMounted) {
          if (data?.product) {
            setProduct(data.product);
          } else {
            console.warn('[PRODUCT/REEL] No product record in response payload');
            setError('Product unavailable');
          }
        }
      } catch (err) {
        console.error('[PRODUCT/REEL] Fetch Error:', err?.response?.data || err.message);
        if (isMounted) {
          setError(err?.response?.data?.message || 'Product unavailable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
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
    if (!raw) {
      isRestoring.current = false;
      return;
    }

    let index = 0;
    try {
      const parsed = JSON.parse(raw);
      const FIVE_MIN = 5 * 60 * 1000;
      if (Date.now() - parsed.ts > FIVE_MIN) {
        sessionStorage.removeItem(`reel_pos_${id}`);
        isRestoring.current = false;
        return;
      }
      index = parsed.i;
    } catch {
      // Handle legacy plain index or corrupt data
      index = parseInt(raw);
      if (isNaN(index)) {
        sessionStorage.removeItem(`reel_pos_${id}`);
        isRestoring.current = false;
        return;
      }
    }

    if (index === 0) {
      isRestoring.current = false;
      return;
    }
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
    } catch { }
  };

  const handleShare = () => {
    setShareAnimating(true);
    setTimeout(() => {
      setShowShare(true);
      setShareAnimating(false);
    }, 600);
  };

  const handleBuy = async (e) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error('Please log in to contact vendor');
      navigate('/login');
      return;
    }
    const vendorId = product.vendor?._id || product.vendor;
    if (!vendorId) {
      toast.error('Vendor information unavailable');
      return;
    }
    if (user._id === vendorId) {
      toast.info('This is your own listing');
      return;
    }

    const canonicalUrl = `${window.location.origin}/product/${product._id}`;
    const priceStr = product.price > 0 ? `₹${product.price.toLocaleString('en-IN')}` : 'Price on request';

    const textMsg = `Hi, I'm interested in this pet:

🐾 ${product.name}
💰 ${priceStr}
👤 Seller: ${product.vendor?.name || 'Vendor'}

View Product:
${canonicalUrl}`;

    try {
      await sendMessage({ recipientId: vendorId, text: textMsg });
    } catch (err) {
      console.warn('SendMessage notice:', err);
    }
    navigate(`/chat/${vendorId}`, { state: { from: 'product', productId: product._id } });
  };

  if (loading) {
    return (
      <div style={{
        height: '100dvh',
        background: '#080d09',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}>
        <img src="/logo.png" alt="Kerala Pets" style={{ width: 100, height: 'auto', opacity: 0.8 }} />
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{
        height: '100dvh',
        background: '#080d09',
        color: '#F5F5EC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        gap: 16
      }}>
        <div style={{ fontSize: '3.5rem' }}>🐾</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFE58F', fontFamily: 'Cinzel, serif' }}>
          Product Unavailable
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#A3B8A8', maxWidth: 320, lineHeight: 1.5 }}>
          This listing may have been removed or is no longer available.
        </p>
        <button
          onClick={() => {
            if (location.state?.from === 'chat' || window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/feed');
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
            color: '#0f0c08',
            border: 'none',
            borderRadius: 14,
            padding: '10px 24px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.88rem',
            marginTop: 8
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      {/* Top Left Back Button */}
      <div style={{ position: 'absolute', top: 24, left: 16, zIndex: 100 }}>
        <button
          onClick={() => {
            const fromChat = location.state?.from === 'chat';
            if (fromChat) {
              navigate(-1);
            } else if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/feed');
            }
          }}
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 10, color: '#fff', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      {/* Reels */}
      <div className="reel-container" ref={containerRef} style={{ height: '100dvh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
        {product.reels.map((reel, i) => (
          <div key={`${product._id}-${i}`} className="reel-item" data-index={i} style={{ position: 'relative', height: '100dvh', scrollSnapAlign: 'start', overflow: 'hidden' }}>
            <VideoPlayer 
              key={`${product._id}-reel-${i}`} 
              src={reel.videoUrl} 
              muted={isMuted}
              externalRef={(el) => (videoRefs.current[i] = el)}
            />

            {/* Bottom Gradient Overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none', zIndex: 5 }} />

            {/* Actions (Right Side) */}
            <div style={{ position: 'absolute', right: 16, bottom: 120, display: 'flex', flexDirection: 'column', gap: 24, zIndex: 20, alignItems: 'center' }}>

              <button onClick={() => handleLike(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
                <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} className={likeAnimating === i ? 'animate-icon-tap' : ''}>
                  <Heart size={26} fill={reel.isLiked ? '#ef4444' : 'none'} color={reel.isLiked ? '#ef4444' : '#fff'} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{reel.isLiked ? product.likeCount : (product.likeCount || 0)}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  setSoundPreference(!newMuted);
                  if (videoRefs.current[i]) {
                    videoRefs.current[i].muted = newMuted;
                    videoRefs.current[i].volume = 1.0;
                    if (!newMuted && videoRefs.current[i].paused) {
                      videoRefs.current[i].play().catch(() => {
                        videoRefs.current[i].muted = true;
                        setIsMuted(true);
                      });
                    }
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  padding: 0,
                }}
              >
                <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                  {isMuted ? <VolumeX size={24} strokeWidth={2.2} /> : <Volume2 size={24} strokeWidth={2.2} />}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>

              {/* Buy button */}
              {product.isOnSale && (
                <button
                  onClick={handleBuy}
                  className="animate-zap-pulse"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#FFE58F',
                    padding: 0
                  }}
                >
                  <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.6))' }}>
                    <Zap size={28} fill="#D4AF37" strokeWidth={0} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: '#FFE58F' }}>BUY</span>
                </button>
              )}
            </div>

            {/* Vendor Info & Product Details (Bottom Left) */}
            <div style={{ position: 'absolute', bottom: 100, left: 16, right: 100, zIndex: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #D4AF37', padding: 2, background: 'rgba(0,0,0,0.4)', boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)' }}>
                  <img
                    src={product.vendor?.avatar ? getFullSrc(product.vendor.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor?.name)}&background=D4AF37&color=0f0c08`}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>@{product.vendor?.name?.replace(/\s+/g, '').toLowerCase()}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#FFE58F', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>✨ Verified Vendor</p>
                </div>
              </div>

              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F5F5EC', marginBottom: 6, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{product.name}</h1>
              <p style={{ fontSize: '0.85rem', color: 'rgba(245,245,236,0.85)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{product.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {product.price > 0 && <span style={{ background: 'linear-gradient(135deg, #FFE58F 0%, #D4AF37 50%, #AA7C11 100%)', color: '#0f0c08', padding: '5px 14px', borderRadius: 12, fontSize: '1rem', fontWeight: 800, boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)' }}>₹{product.price.toLocaleString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} />
      <Modal isOpen={showEnquiry} onClose={() => setShowEnquiry(false)} title="Register Interest">
        <div style={{ padding: 20 }}>
          {!user?.contactNumber ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>To help the admin reach out, please provide your contact number:</p>
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
