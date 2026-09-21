import { useEffect } from 'react';
import { Heart, Send, Volume2, VolumeX, ShoppingBag, Zap } from 'lucide-react';
import { isProductItem, logItemTypeDebug } from '../../utils/productUtils';

export default function ProductActionButtons({
  item,
  onEnquire,
  onBuy,
  likeCount = 0,
  isLiked = false,
  onLikeToggle,
  isMuted = true,
  onMuteToggle,
  onShare,
  likeAnimating = false,
  shareAnimating = false,
}) {
  useEffect(() => {
    if (item) {
      logItemTypeDebug(item);
    }
  }, [item]);

  if (!item) return null;

  const showBuy = isProductItem(item);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
      }}
    >
      {/* Like Button */}
      {onLikeToggle && (
        <button
          onClick={onLikeToggle}
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
              fill={isLiked ? '#ef4444' : 'none'}
              color={isLiked ? '#ef4444' : '#fff'}
              strokeWidth={2.2}
            />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {likeCount}
          </span>
        </button>
      )}

      {/* Mute/Unmute Button (if handler provided) */}
      {onMuteToggle && (
        <button
          onClick={onMuteToggle}
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
      )}

      {/* Share Button (if handler provided) */}
      {onShare && (
        <button
          onClick={onShare}
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
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Share
          </span>
        </button>
      )}

      {/* Enquire button (ALWAYS shown for both Products and Reels) */}
      <button
        onClick={onEnquire}
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
          <ShoppingBag size={24} strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Enquire
        </span>
      </button>

      {/* Buy button (SHOWN ONLY IF item is a PRODUCT) */}
      {showBuy && (
        <button
          onClick={onBuy}
          className="animate-zap-pulse"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#A7F3D0',
            padding: 0,
          }}
        >
          <div style={{ display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.6))' }}>
            <Zap size={28} fill="#10B981" strokeWidth={0} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: '#A7F3D0' }}>
            BUY
          </span>
        </button>
      )}
    </div>
  );
}
