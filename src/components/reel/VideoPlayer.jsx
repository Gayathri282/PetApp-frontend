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
    if (!video || !src) return;

    const fullSrc = getFullSrc(src);
    setHasError(false);
    setShowNoAudioNotice(false);
    manuallyPaused.current = false;

    const onError = () => {
      console.error('[VideoPlayer] Failed to load source:', fullSrc);
      setHasError(true);
    };

    const onCanPlay = () => {
      // If the element is already in view when the video becomes ready, play it.
      // This handles the race where the IntersectionObserver already fired
      // before video.src was set — so play never happened.
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

    video.src = fullSrc;
    video.load(); // Force browser to re-fetch
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onDataLoaded);

    return () => {
      video.removeEventListener('error', onError);
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('loadeddata', onDataLoaded);
      // Fully release the video resource when the component unmounts
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, playVideo]);

  const handleIntersect = useCallback(
    (entry) => {
      const video = videoRef.current;
      if (!video) return;

      if (entry.isIntersecting) {
        isInView.current = true;
        // Only auto-play if user hasn't manually paused AND video has a src
        if (!manuallyPaused.current && video.src) {
          playVideo();
        }
      } else {
        isInView.current = false;
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
        muted={muted}
        loop
        playsInline
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
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.85rem',
          gap: 12, zIndex: 40, padding: 20, textAlign: 'center'
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <span style={{ fontWeight: 600 }}>Video failed to load</span>
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
              background: '#818cf8', border: 'none', borderRadius: 12,
              padding: '10px 20px', color: '#fff', fontWeight: 700,
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