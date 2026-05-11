import { useRef, useState, useCallback, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js'; // ✅ FIX #1: proper npm import, not window.Hls

export default function VideoPlayer({ src, muted = true, style = {} }) {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const fullSrc = getFullSrc(src);

    // ✅ FIX #2: reset error state on new src
    setHasError(false);

    const onError = () => {
      console.error('[VideoPlayer] Failed to load source:', fullSrc);
      setHasError(true);
    };

    if (fullSrc.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari / iOS)
        video.src = fullSrc;
        video.addEventListener('error', onError, { once: true });
      } else if (Hls.isSupported()) {
        // ✅ FIX #1 continued: use imported Hls class
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls();
        hls.loadSource(fullSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('[VideoPlayer] HLS fatal error:', data);
            setHasError(true);
          }
        });
        hlsRef.current = hls;
      } else {
        console.warn('[VideoPlayer] HLS not supported in this browser.');
        setHasError(true);
      }
    } else {
      video.src = fullSrc;
      video.addEventListener('error', onError, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener('error', onError);
    };
  }, [src]);

  const handleIntersect = useCallback(
    (entry) => {
      const video = videoRef.current;
      if (!video) return;

      if (entry.isIntersecting) {
        if (!isPaused) {
          // ✅ FIX #3: wait for video to be ready before playing
          if (video.readyState >= 2) {
            video.play().catch(() => { });
          } else {
            video.addEventListener(
              'loadeddata',
              () => {
                if (!isPaused) video.play().catch(() => { });
              },
              { once: true }
            );
          }
        }
      } else {
        video.pause();
      }
    },
    [isPaused]
  );

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: 0.6,
  });

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => { });
      setIsPaused(false);
    } else {
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
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
      />

      {/* ✅ FIX #4: removed duplicate mute button — only one kept (bottom-right) */}

      {/* Error state */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontSize: '0.8rem',
            gap: 8,
            zIndex: 40,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span>Video failed to load</span>
        </div>
      )}

      {/* Play / Pause centre overlay */}
      {(showControl || isPaused) && !hasError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            padding: 24,
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            animation: 'fadeInOut 0.5s ease-in-out',
          }}
        >
          {isPaused ? (
            <Play size={40} fill="#fff" color="#fff" />
          ) : (
            <Pause size={40} fill="#fff" color="#fff" />
          )}
        </div>
      )}


    </div>
  );
}