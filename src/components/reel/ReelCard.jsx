import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send, Zap, Layers, Volume2, VolumeX } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import ShareModal from '../ui/ShareModal';
import Modal from '../ui/Modal';
import { toggleLike, submitEnquiry, updateProfile, trackInterest, sendMessage } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getSoundPreference, setSoundPreference } from '../../hooks/useSoundPreference';
import { openReel } from '../../utils/navigation';

export default function ReelCard({ product, onLikeUpdate }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  const [liked, setLiked] = useState(product.isLiked || false);
  const [likeCount, setLikeCount] = useState(product.likeCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [sending, setSending] = useState(false);
  // Default to unmuted per user request.
  // Note: mobile browsers may still fallback to muted for autoplay to work.
  const [isMuted, setIsMuted] = useState(!getSoundPreference());
  const [shareAnimating, setShareAnimating] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const videoRef = useRef(null);

  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const reel = product.primaryReel || product.reels?.[0];
  if (!reel) return null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleLike = async (e) => {
    e.stopPropagation();

    // ✅ Guard: must be logged in
    if (!user) {
      toast.error('Please log in to like products');
      return;
    }

    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const { data } = await toggleLike(product._id, 0);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      if (onLikeUpdate) onLikeUpdate(product._id, data);

      if (data.liked) {
        trackInterest(product._id, 'like').catch(() => {});
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('Failed to update like');
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShareAnimating(true);
    
    // Track share interest
    if (user) {
      trackInterest(product._id, 'share').catch(() => {});
    }

    setTimeout(() => {
      setShowShare(true);
      setShareAnimating(false);
    }, 600);
  };

  const handleEnquiry = async () => {
    // ✅ Guard: must be logged in
    if (!user) {
      toast.error('Please log in to register interest');
      return;
    }

    if (!user.contactNumber && tempPhone.length < 10) {
      toast.error('Please enter a valid 10-digit contact number');
      return;
    }

    setSending(true);
    try {
      if (!user.contactNumber) {
        await updateProfile({ contactNumber: tempPhone });
        await refreshUser();
      }

      await submitEnquiry({
        productId: product._id,
        message: 'Interested in this product',
      });

      toast.success('Interest registered! Admin will contact you.');
      setShowEnquiry(false);
      setTempPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register interest');
    } finally {
      setSending(false);
    }
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="reel-item"
      style={{
        position: 'relative',
        height: '100dvh',
        scrollSnapAlign: 'start',
        overflow: 'hidden',
      }}
    >
      <VideoPlayer src={reel.videoUrl} muted={isMuted} externalRef={videoRef} />

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* ── Right action bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 20,
        }}
      >
        {/* Like */}
        <button
          onClick={handleLike}
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
          <div
            style={{ display: 'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            className={likeAnimating ? 'animate-icon-tap' : ''}
          >
            <Heart
              size={26}
              fill={liked ? '#ef4444' : 'none'}
              color={liked ? '#ef4444' : '#fff'}
              strokeWidth={2.2}
            />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {likeCount}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
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
          <div
            style={{ display: 'flex', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            className={shareAnimating ? 'animate-send-fly' : ''}
          >
            <Send size={24} strokeWidth={2.2} />
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              opacity: shareAnimating ? 0 : 1,
            }}
          >
            Share
          </span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            setSoundPreference(!newMuted); // persist: unmuted=true means sound on

            // Imperatively set video.muted — required on iOS where only a direct
            // user gesture can unlock audio. React prop → useEffect is too async.
            if (videoRef.current) {
              videoRef.current.muted = newMuted;
              // If unmuting and video is paused (stalled due to mute), try resume
              if (!newMuted && videoRef.current.paused) {
                videoRef.current.play().catch(() => {
                  videoRef.current.muted = true;
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

        {/* Multiple reels indicator */}
        {product.hasMultipleReels && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product._id}`);
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
              <Layers size={24} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>More</span>
          </button>
        )}

        {/* Buy / Enquiry */}
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
              padding: 0,
            }}
          >
            <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.6))' }}>
              <Zap size={28} fill="#D4AF37" strokeWidth={0} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: '#FFE58F' }}>
              BUY
            </span>
          </button>
        )}
      </div>

      {/* ── Vendor info & product details (bottom-left) ───────────────────────── */}
      <div style={{ position: 'absolute', bottom: 100, left: 16, right: 100, zIndex: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #D4AF37',
              padding: 2,
              background: 'rgba(0,0,0,0.4)',
              boxShadow: '0 0 12px rgba(212, 175, 55, 0.3)',
            }}
          >
            <img
              src={
                product.vendor?.avatar
                  ? getFullSrc(product.vendor.avatar)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor?.name ?? 'V')}&background=D4AF37&color=0f0c08`
              }
              alt={product.vendor?.name ?? 'Vendor'}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              @{product.vendor?.name?.replace(/\s+/g, '').toLowerCase() ?? 'vendor'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#FFE58F', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              ✨ Verified Vendor
            </p>
          </div>
        </div>

        <h1
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#F5F5EC',
            marginBottom: 6,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {product.name}
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'rgba(245,245,236,0.85)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 10,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}
        >
          {product.description}
        </p>

        {product.price > 0 && (
          <span
            style={{
              background: 'linear-gradient(135deg, #FFE58F 0%, #D4AF37 50%, #AA7C11 100%)',
              color: '#0f0c08',
              padding: '5px 14px',
              borderRadius: 12,
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
              display: 'inline-block',
            }}
          >
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/product/${product._id}`}
        title="Share Reel"
      />

      <Modal isOpen={showEnquiry} onClose={() => setShowEnquiry(false)} title="Register Interest">
        <div style={{ padding: 20 }}>
          {!user?.contactNumber ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                To help the admin reach out, please provide your contact number:
              </p>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                className="input-field"
                value={tempPhone}
                maxLength={10}
                onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
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