import { useRef, useState, useCallback, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Pause, Play, VolumeX } from 'lucide-react';

export default function VideoPlayer({ src, muted = false, style = {} }) {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const videoRef = useRef(null);
  // ✅ Tracks whether the USER manually paused while in viewport
  // Reset to false when video leaves viewport — so coming back always auto-plays
  const manuallyPaused = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showNoAudioNotice, setShowNoAudioNotice] = useState(false);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
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
    if (!video || !src) return;

    const fullSrc = getFullSrc(src);
    setHasError(false);
    setShowNoAudioNotice(false);
    manuallyPaused.current = false; // ✅ reset on src change

    const onError = () => {
      console.error('[VideoPlayer] Failed to load source:', fullSrc);
      setHasError(true);
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
            setTimeout(() => setShowNoAudioNotice(false), 10000);
          }
        }
      }, 1000);
    };

    video.src = fullSrc;
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadeddata', onDataLoaded);

    return () => {
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onDataLoaded);
    };
  }, [src]);

  const handleIntersect = useCallback(
    (entry) => {
      const video = videoRef.current;
      if (!video) return;

      if (entry.isIntersecting) {
        // ✅ Only auto-play if user hasn't manually paused in this viewport session
        if (!manuallyPaused.current) {
          playVideo();
        }
      } else {
        // ✅ Leaving viewport: pause + RESET manual pause flag
        // So next scroll-back always auto-plays regardless of previous manual pause
        video.pause();
        video.currentTime = 0;
        manuallyPaused.current = false;
      }
    },
    [playVideo]
  );

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: 0.6,
  });

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // ✅ User manually resumed — clear the flag
      manuallyPaused.current = false;
      video.play().catch(() => { });
      setIsPaused(false);
    } else {
      // ✅ User manually paused — set flag so intersection doesn't override it
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
        ref={videoRef}
        muted={muted}
        loop
        playsInline
        autoPlay
        preload="auto"
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
          background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.8rem',
          gap: 8, zIndex: 40,
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span>Video failed to load</span>
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