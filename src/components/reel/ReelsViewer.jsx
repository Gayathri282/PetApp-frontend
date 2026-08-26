import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2, VolumeX, Heart, Send, MessageCircle, Play, Pause, RefreshCw, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import { getPlayableVideoUrl, getPosterUrl, normalizeMediaItem, logVideoDiagnostics } from '../../utils/media';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toggleLike, sendMessage, trackInterest } from '../../api';

/**
 * SingleReelItem Component
 * Renders individual full-screen vertical reel item with autoplay, mute state sync,
 * play/pause tap indicator, error handling, metadata overlays, and right action column.
 */
function SingleReelItem({
  item,
  index,
  isActive,
  isMuted,
  onToggleMute,
  onClose,
  user,
}) {
  const videoRef = useRef(null);
  const toast = useToast();
  const normalized = normalizeMediaItem(item);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [indicator, setIndicator] = useState(null); // 'play' | 'pause' | null
  const [liked, setLiked] = useState(item?.isLiked || false);
  const [likeCount, setLikeCount] = useState(item?.likeCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const videoUrl = normalized.url;
  const posterUrl = normalized.thumbnail;

  // Diagnostic logging
  useEffect(() => {
    if (item) {
      logVideoDiagnostics(`ReelItem-${index}`, item);
    }
  }, [item, index]);

  // Synchronize play / pause with isActive state (Requirement 4 & 10)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || hasError) return;

    if (isActive) {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = 1;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn(`[REEL ${index}] Audio autoplay blocked by browser, attempting muted fallback:`, err);
            video.muted = true;
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      try {
        video.currentTime = 0;
      } catch {}
    }
  }, [isActive, videoUrl, isMuted, hasError, index]);

  // Synchronize mute setting across reels (Requirement 7)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  // Tap video to toggle play/pause (Requirement 6)
  const handleTogglePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !videoUrl || hasError) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setIndicator('pause');
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      setIndicator('play');
    }

    setTimeout(() => {
      setIndicator(null);
    }, 850);
  };

  // Like action handler
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please log in to like listing');
      return;
    }

    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const targetId = item._id || item.id;
      const { data } = await toggleLike(targetId, 0);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      if (data.liked) {
        trackInterest(targetId, 'like').catch(() => {});
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('Failed to update like');
    }
  };

  const navigate = useNavigate();
  const [enquiring, setEnquiring] = useState(false);

  // Contact / Message Seller handler (Enquire)
  const handleEnquiry = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!user) {
      toast.error('Please log in to enquire about this pet');
      navigate('/login');
      return;
    }

    const vendorId = item.vendor?._id || (typeof item.vendor === 'string' ? item.vendor : null) || item.sellerId || item.vendorId;
    if (!vendorId) {
      toast.error('Unable to contact this seller right now.');
      return;
    }
    if (user._id === vendorId) {
      toast.info('This is your listing');
      return;
    }

    if (enquiring) return;
    setEnquiring(true);

    const exactMsg = 'Hey, I would like to know more about this';
    const targetProductId = item._id || item.id;

    try {
      await sendMessage({ receiverId: vendorId, content: exactMsg, productId: targetProductId });
      toast.success('Enquiry sent to seller!');
      if (onClose) onClose();
      navigate(`/chat/${vendorId}`);
    } catch (err) {
      console.error('[ENQUIRE ERROR]', err);
      toast.error(err?.response?.data?.message || 'Failed to send enquiry. Please try again.');
    } finally {
      setEnquiring(false);
    }
  };

  const handleContactSeller = handleEnquiry;

  // Share handler
  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: item.name || 'Kerala Pets Reel',
        text: `Check out ${item.name || 'this pet listing'} on Kerala Pets!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const title = item.name || item.title || item.caption || 'Kerala Pet';
  const price = item.price !== undefined && item.price !== null ? `₹${Number(item.price).toLocaleString('en-IN')}` : '';
  const vendorName = item.vendor?.name || 'Kerala Pets Verified';
  const city = item.location?.city || item.city || 'Kochi, Kerala';

  return (
    <div
      className="reel-card"
      data-index={index}
      data-id={item._id || item.id}
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        background: '#000000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 1. Base Poster Thumbnail (Never blank black) */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            filter: isPlaying ? 'none' : 'brightness(0.95)',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #0d2c27 0%, #040806 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Play size={48} color="#0D5148" opacity={0.6} />
        </div>
      )}

      {/* 2. HTML5 Video Layer */}
      {videoUrl && !hasError && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="metadata"
          loop
          muted={isMuted}
          onClick={handleTogglePlayPause}
          onError={(e) => {
            console.error(`[REEL DIAGNOSTICS Error] Reel ${index}:`, videoUrl, e.currentTarget.error);
            setHasError(true);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 2,
            opacity: isPlaying ? 1 : (posterUrl ? 0.85 : 1),
            transition: 'opacity 0.25s ease',
            cursor: 'pointer',
          }}
        />
      )}

      {/* 3. Tap Play/Pause Feedback Indicator (Requirement 6) */}
      {indicator && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              animation: 'reelIndicatorPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {indicator === 'play' ? <Play size={34} fill="#FFFFFF" /> : <Pause size={34} fill="#FFFFFF" />}
          </div>
        </div>
      )}

      {/* 4. Error Fallback Overlay (Requirement 10) */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            background: 'rgba(4, 8, 6, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            color: '#FFFFFF',
            gap: 12,
          }}
        >
          <p style={{ fontSize: '1.05rem', fontWeight: 800 }}>Video Unavailable</p>
          <p style={{ fontSize: '0.78rem', opacity: 0.7, maxWidth: 260 }}>
            Unable to stream this video clip.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            style={{
              background: '#0D5148',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <RefreshCw size={15} /> Retry Playback
          </button>
        </div>
      )}

      {/* 5. Top Control Bar (Close button top-left, Mute button top-right - Requirements 7 & 8) */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}
      >
        {/* Close Button (top-left) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close Reels Viewer"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <X size={22} />
        </button>

        {/* Mute/Unmute Button (top-right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* 6. Bottom Gradient Overlay for typography legibility */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* 7. Right Action Column (Like, Enquiry, Share - Requirement 2 & 13) */}
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 40,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Like Button */}
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            <Heart
              size={22}
              fill={liked ? '#ef4444' : 'none'}
              color={liked ? '#ef4444' : '#FFFFFF'}
              style={{ transition: 'transform 0.2s ease' }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {likeCount}
          </span>
        </button>

        {/* Contact / Enquiry Button */}
        <button
          onClick={handleEnquiry}
          disabled={enquiring}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: enquiring ? 'not-allowed' : 'pointer',
            padding: 0,
            opacity: enquiring ? 0.7 : 1,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(13, 81, 72, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            <MessageCircle size={22} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {enquiring ? 'Enquiring...' : 'Enquire'}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            <Send size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            Share
          </span>
        </button>
      </div>

      {/* 8. Bottom-Left Information Overlay (Requirement 2 & 13) */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 16,
          right: 76,
          zIndex: 20,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        {/* Vendor Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 5, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            <ShieldCheck size={16} color="#F3C34E" /> {vendorName}
          </span>
          <span style={{ fontSize: '0.7rem', background: '#0D5148', color: '#FFFFFF', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
            Verified
          </span>
        </div>

        {/* Title & Price */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.9)', fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h2>

        {price && (
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F3C34E', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
            {price}
          </p>
        )}

        {/* Description */}
        {item.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.88)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              lineHeight: 1.35,
            }}
          >
            {item.description}
          </p>
        )}

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          <MapPin size={13} color="#F3C34E" />
          <span>{city}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ReelsViewer Component (Requirement 12)
 * One reusable Instagram/TikTok style full-screen vertical feed modal component.
 */
export default function ReelsViewer({
  isOpen = true,
  videos = [],
  initialVideoId = null,
  onClose,
  product = null,
  reel = null,
}) {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // Reset audio to sound ON whenever ReelsViewer opens via user click
  useEffect(() => {
    if (isOpen) {
      setIsMuted(false);
    }
  }, [isOpen]);

  // Normalize input videos list (supports single product/reel fallback for backward compatibility)
  const rawList = Array.isArray(videos) && videos.length > 0
    ? videos
    : (product || reel ? [product || reel] : []);

  // Filter valid list items
  const validVideos = rawList.filter(Boolean);

  // Calculate starting index (Requirement 5)
  const initialIndex = Math.max(
    0,
    validVideos.findIndex((v) => {
      const id = v._id || v.id;
      return String(id) === String(initialVideoId);
    })
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Update active index when initialVideoId or validVideos changes
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialVideoId, validVideos.length]);

  // Lock body scroll while modal is open (Requirement 8 & 9)
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Align scroll container to initialIndex on open (Requirement 5 & 13)
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const reelCards = container.querySelectorAll('.reel-card');

    if (reelCards[initialIndex]) {
      reelCards[initialIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      container.scrollTop = initialIndex * container.clientHeight;
    }
  }, [isOpen, initialIndex]);

  // IntersectionObserver to detect strictly visible Reel (Requirement 4)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            const idx = Number(entry.target.dataset.index);
            if (!isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.65],
      }
    );

    const reelCards = container.querySelectorAll('.reel-card');
    reelCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [isOpen, validVideos.length]);

  // Keyboard navigation for Desktop (Requirement 3 & 14)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (containerRef.current) {
          containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (containerRef.current) {
          containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || validVideos.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Keyframe Animation Injection */}
      <style>{`
        @keyframes reelIndicatorPop {
          0% { transform: scale(0.6); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .reels-feed {
          height: 100dvh;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          overscroll-behavior-y: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .reels-feed::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Main Reels Vertical Feed Scroll Container (Requirement 2, 3 & 13) */}
      <div ref={containerRef} className="reels-feed">
        {validVideos.map((item, idx) => (
          <SingleReelItem
            key={item._id || item.id || `reel-${idx}`}
            item={item}
            index={idx}
            isActive={idx === activeIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onClose={onClose}
            user={user}
          />
        ))}
      </div>
    </div>
  );
}
