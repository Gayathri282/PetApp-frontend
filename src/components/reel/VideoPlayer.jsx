import { useRef, useState, useCallback, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Pause, Play, VolumeX } from 'lucide-react';

export default function VideoPlayer({ src, muted = false, style = {}, externalRef = null }) {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const internalRef = useRef(null);
  // Use the external ref if provided (e.g. from ReelCard for imperative iOS audio unlock)
  const videoRef = externalRef || internalRef;
  // Tracks whether the USER manually paused while in viewport
  const manuallyPaused = useRef(false);
  // Tracks whether this player is currently visible
  const isInView = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showNoAudioNotice, setShowNoAudioNotice] = useState(false);
  const [isNearView, setIsNearView] = useState(false);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.src) return; // Guard: don't play if no src yet
    try {
      video.muted = muted;
      await video.play();
    } catch {
      video.muted = true;
      try { await video.play(); } catch { /* autoplay fully blocked */ }
    }
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || !isNearView) return;

    let retryCount = 0;
    const maxRetries = 3;

    setHasError(false);
    setShowNoAudioNotice(false);
    manuallyPaused.current = false;

    const onError = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = retryCount * 1000;
        console.warn(`[VideoPlayer] Load failed, retrying in ${delay}ms...`, src);
        setTimeout(() => {
          if (video) {
            setHasError(false);
            video.load();
          }
        }, delay);
      } else {
        console.error('[VideoPlayer] Permanent load failure after retries:', src);
        setHasError(true);
      }
    };

    const onCanPlay = () => {
      setHasError(false); // Clear any previous errors if we can now play
      if (isInView.current && !manuallyPaused.current) {
        playVideo();
      }
    };

    const onDataLoaded = () => {
      setTimeout(() => {
        if (video.readyState >= 1) {
          const noAudio =
            (video.audioTracks && video.audioTracks.length === 0) ||
            video.mozHasAudio === false ||
            video.webkitAudioDecodedByteCount === 0;
          if (noAudio) {
            setShowNoAudioNotice(true);
            setTimeout(() => setShowNoAudioNotice(false), 2000);
          }
        }
      }, 1000);
    };

    video.addEventListener('error', onError);
    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onDataLoaded);

    // Initial check: if already in view, try playing
    if (isInView.current && !manuallyPaused.current && video.readyState >= 2) {
      playVideo();
    }

    return () => {
      video.removeEventListener('error', onError);
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('loadeddata', onDataLoaded);
      video.pause();
    };
  }, [src, playVideo, isNearView]);

  const handleIntersect = useCallback(
    (entry) => {
      const video = videoRef.current;
      if (!video) return;

      // Play when at least 60% visible
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        isInView.current = true;
        if (!manuallyPaused.current && video.src) {
          playVideo();
        }
      } 
      // Pause only when visibility drops below 10% (Hysteresis)
      else if (entry.intersectionRatio < 0.1) {
        isInView.current = false;
        video.pause();
        video.currentTime = 0;
        manuallyPaused.current = false;
      }
    },
    [playVideo]
  );

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: [0.1, 0.6],
  });

  // Near-view observer to trigger preloading and resource cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      // We use isIntersecting with a large margin to know if it's "near"
      setIsNearView(entries[0].isIntersecting);
    }, { rootMargin: '100% 0px' }); // 1 viewport ahead/behind

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      manuallyPaused.current = false;
      video.play().catch(() => { });
      setIsPaused(false);
    } else {
      manuallyPaused.current = true;
      video.pause();
      setIsPaused(true);
    }

    setShowControl(true);
    setTimeout(() => setShowControl(false), 1200);
  };

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        cursor: 'pointer',
        overflow: 'hidden',
        ...style,
      }}
    >
      <video
        key={src}
        ref={videoRef}
        src={isNearView ? getFullSrc(src) : ''}
        muted={muted}
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        crossOrigin="anonymous"
        preload={isNearView ? "auto" : "none"}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
      />

      {/* No audio notice */}
      {showNoAudioNotice && (
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          padding: '8px 16px', borderRadius: 20, display: 'flex',
          alignItems: 'center', gap: 8, zIndex: 100, pointerEvents: 'none',
        }}>
          <VolumeX size={16} color="#fff" />
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
            No audio in this video
          </span>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.85rem',
          gap: 12, zIndex: 40, padding: 20, textAlign: 'center'
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <span style={{ fontWeight: 600 }}>Video failed to load</span>
          <div style={{ fontSize: '0.65rem', opacity: 0.5, wordBreak: 'break-all', maxWidth: '100%' }}>
            {getFullSrc(src)}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRef.current;
              if (video) {
                setHasError(false);
                video.load();
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #FFE58F, #D4AF37)', color: '#0f0c08', border: 'none', borderRadius: 12,
              padding: '10px 20px', fontWeight: 700,
              cursor: 'pointer', fontSize: '0.8rem', marginTop: 8
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Play / Pause overlay */}
      {(showControl || isPaused) && !hasError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
          borderRadius: '50%', padding: 24, zIndex: 20,
          pointerEvents: 'none', display: 'flex',
          animation: 'fadeInOut 0.5s ease-in-out',
        }}>
          {isPaused
            ? <Play size={40} fill="#fff" color="#fff" />
            : <Pause size={40} fill="#fff" color="#fff" />
          }
        </div>
      )}
    </div>
  );
}