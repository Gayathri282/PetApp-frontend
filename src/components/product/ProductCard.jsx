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

import PetVideoCard from '../video/PetVideoCard';

const ProductCard = memo(({ product, activeVideoId, setActiveVideoId, onVideoClick, style = {} }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  const status = product.status; // 'pending' | 'approved' | 'rejected'
  const statusCfg = STATUS_CONFIG[status] || null;
  const isClickable = status === 'approved';

  return (
    <div
      className="card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid rgba(13, 81, 72, 0.08)',
        boxShadow: '0 4px 18px rgba(13, 81, 72, 0.05)',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Media Container using Shared PetVideoCard */}
      <PetVideoCard
        item={product}
        activeVideoId={activeVideoId}
        setActiveVideoId={setActiveVideoId}
        onVideoClick={onVideoClick}
        mediaHeight={180}
        sectionName="On Sale"
      >
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
            pointerEvents: 'auto',
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
          pointerEvents: 'none',
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
            pointerEvents: 'none',
          }}>
            <statusCfg.icon size={12} color="#fff" />
            <span>{statusCfg.label}</span>
          </div>
        )}
      </PetVideoCard>

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
