import { useNavigate } from 'react-router-dom';
import { Play, Clock, XCircle, Heart, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import { useRef, useState, memo } from 'react';
import { openReel } from '../../utils/navigation';

const STATUS_CONFIG = {
  pending: {
    label: 'Under Review',
    icon: Clock,
    bg: '#f97316',
    color: '#fff',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bg: '#ef4444',
    color: '#fff',
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
  const [liked, setLiked] = useState(false);
  const reel = product.primaryReel || product.reels?.[0];

  const status = product.status; // 'pending' | 'approved' | 'rejected'
  const statusCfg = STATUS_CONFIG[status] || null;
  const isClickable = status === 'approved';

  const posterUrl = reel?.thumbnail 
    ? getFullSrc(reel.thumbnail) 
    : (product.images?.[0] ? getFullSrc(product.images[0]) : undefined);

  const videoUrl = reel?.videoUrl ? getFullSrc(reel.videoUrl) : undefined;
  const imageUrl = product.images?.[0] ? getFullSrc(product.images[0]) : undefined;

  const handleMouseEnter = () => {
    if (isClickable && videoRef.current) {
      setHovering(true);
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isClickable) openReel(navigate, product);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid rgba(13, 81, 72, 0.08)',
        boxShadow: '0 4px 18px rgba(13, 81, 72, 0.05)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        transform: hovering ? 'translateY(-2px)' : 'none',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Media Container */}
      <div style={{ width: '100%', height: 180, position: 'relative', background: '#E8F1ED', overflow: 'hidden' }}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoadStart={() => console.log('[CARD PREVIEW] Load start:', videoUrl)}
              onLoadedMetadata={() => console.log('[CARD PREVIEW] Metadata loaded')}
              onCanPlay={() => console.log('[CARD PREVIEW] Can play')}
              onPlay={() => console.log('[CARD PREVIEW] Playing preview')}
              onError={(e) => console.error('[CARD PREVIEW ERROR]', e.currentTarget.error)}
            />
            {!hovering && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}>
                <div style={{ background: 'rgba(13,81,72,0.85)', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <Play size={20} fill="#FFFFFF" color="#FFFFFF" />
                </div>
              </div>
            )}
          </>
        ) : imageUrl ? (
          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8F1ED' }}>
            <Play size={28} color="#0D5148" />
          </div>
        )}

        {/* Favorite Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#0D5148'} />
        </button>

        {/* Availability / Status Badge Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: '#0D5148',
          color: '#FFFFFF',
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: '0.65rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {product.isOnSale ? 'AVAILABLE TODAY' : 'VERIFIED LISTING'}
        </div>

        {statusCfg && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: statusCfg.bg, color: statusCfg.color,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999,
            fontSize: '0.65rem', fontWeight: 800,
          }}>
            <statusCfg.icon size={12} color="#fff" />
            <span>{statusCfg.label}</span>
          </div>
        )}
      </div>

      {/* Product Card Details */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{
          fontSize: '0.98rem',
          fontWeight: 700,
          color: '#12332F',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#12332F' }}>
            ₹{product.price?.toLocaleString('en-IN') || '0'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#60736F', fontWeight: 500 }}>
            / listing
          </span>
        </div>

        {/* Seller Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#60736F', marginTop: 2 }}>
          <span style={{ fontWeight: 600, color: '#0D5148', display: 'flex', alignItems: 'center', gap: 4 }}>
            {product.vendor?.name || 'Kerala Pets Verified'} <CheckCircle size={14} color="#0D5148" />
          </span>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: '#60736F' }}>
          <MapPin size={13} color="#0D5148" />
          <span>{product.location?.city || 'Kochi, Kerala'}</span>
        </div>

        {/* Contact Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isClickable) openReel(navigate, product);
          }}
          style={{
            marginTop: 6,
            width: '100%',
            padding: '9px 0',
            borderRadius: 12,
            background: '#E8F1ED',
            color: '#0D5148',
            border: '1px solid #D6E3DE',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <MessageCircle size={15} /> Contact Seller
        </button>
      </div>
    </div>
  );
});

export default ProductCard;
