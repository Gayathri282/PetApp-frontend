import { useRef, useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { normalizeMediaItem, logVideoDiagnostics } from '../../utils/media';

/**
 * PetVideoCard - Unified Reusable Video Player Component
 * Used across "Available near Kochi", "Watch Pet Reels", and search/profile video cards.
 * Enforces single active playing video, inline click play/pause, desktop hover preview,
 * mobile tap, poster image baseline, and 60% IntersectionObserver viewport auto-pause.
 */
export default function PetVideoCard({
  item,
  activeVideoId,
  setActiveVideoId,
  style = {},
  mediaHeight = 180,
  children,
  sectionName = 'PetVideoCard',
}) {
  const normalized = normalizeMediaItem(item);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isSelfActive = Boolean(activeVideoId && activeVideoId === normalized.id);

  // Diagnostic logger (Step 10 requirement)
  useEffect(() => {
    if (normalized.url) {
      console.log("VIDEO:", {
        id: normalized.id,
        url: normalized.url,
        thumbnail: normalized.thumbnail,
      });
      logVideoDiagnostics(sectionName, normalized.raw);
    }
  }, [normalized.id, normalized.url, sectionName]);

  // Synchronize playback state with activeVideoId (Step 5 requirement)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !normalized.url) return;

    if (isSelfActive) {
      video.muted = true; // Muted for browser autoplay compliance
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('[PetVideoCard] Autoplay blocked:', err);
          // Keep poster/play button visible if blocked
        });
      }
    } else {
      video.pause();
    }
  }, [isSelfActive, normalized.url]);

  // IntersectionObserver for scroll behavior (Step 7 requirement)
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !normalized.url) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If this video is active but drops below 60% visibility, pause it
        if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
          if (activeVideoId === normalized.id && setActiveVideoId) {
            setActiveVideoId(null);
          }
        }
      },
      { threshold: [0.6] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeVideoId, normalized.id, normalized.url, setActiveVideoId]);

  // Clean up video refs on unmount (Step 12 requirement)
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        try {
          video.removeAttribute('src');
          video.load();
        } catch {}
      }
    };
  }, []);

  // Click handler (Step 2, Step 11 requirement)
  const handleVideoClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!normalized.url || hasError) return;

    if (setActiveVideoId) {
      if (isSelfActive) {
        // Click again -> pause
        setActiveVideoId(null);
      } else {
        // Click -> set active & play
        setActiveVideoId(normalized.id);
      }
    }
  };

  // Hover handlers (Step 3, Step 8 requirement)
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!activeVideoId && normalized.url && videoRef.current && !hasError) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isSelfActive && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const isVideoVisible = (isSelfActive || isHovered) && isLoaded && !hasError;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: mediaHeight,
        background: '#E8F1ED',
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* 1. Base Thumbnail Layer (ALWAYS RENDERED - Never a blank/black screen) */}
      {normalized.thumbnail ? (
        <img
          src={normalized.thumbnail}
          alt={normalized.name || 'Pet Video'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#E8F1ED',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <Play size={28} color="#0D5148" />
        </div>
      )}

      {/* 2. HTML5 Video Layer */}
      {normalized.url && !hasError && (
        <video
          ref={videoRef}
          src={normalized.url}
          poster={normalized.thumbnail}
          playsInline
          preload="metadata"
          muted
          loop
          controls={false}
          onClick={handleVideoClick}
          onError={(e) => {
            console.error('[PET VIDEO ERROR]', normalized.url, e.currentTarget.error);
            setHasError(true);
          }}
          onLoadedData={() => setIsLoaded(true)}
          onCanPlay={() => setIsLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            opacity: isVideoVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* 3. Play Button Overlay (Visible when not actively playing) */}
      {(!isSelfActive || hasError) && (
        <div
          onClick={handleVideoClick}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.18)',
            transition: 'background 0.2s ease',
          }}
        >
          <div
            style={{
              background: 'rgba(13,81,72,0.85)',
              padding: 10,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            <Play size={20} fill="#FFFFFF" color="#FFFFFF" />
          </div>
        </div>
      )}

      {/* Custom children/overlays inside media container */}
      {children && (
        <div style={{ position: 'relative', zIndex: 4, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {children}
        </div>
      )}
    </div>
  );
}
