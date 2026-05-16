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
  const [isPaused, setIsPaused] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showNoAudioNotice, setShowNoAudioNotice] = useState(false);

  // Auto-play attempt logic
  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Try playing unmuted first if muted prop is false
      video.muted = muted;
      await video.play();
    } catch (error) {
      // If blocked, try playing muted
      console.log("Autoplay unmuted blocked, trying muted...");
      video.muted = true;
      try {
        await video.play();
      } catch (mutedError) {
        console.error("Autoplay failed even when muted:", mutedError);
      }
    }
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const fullSrc = getFullSrc(src);
    setHasError(false);
    setShowNoAudioNotice(false);

    const onError = () => {
      console.error('[VideoPlayer] Failed to load source:', fullSrc);
      setHasError(true);
    };

    const onDataLoaded = () => {
      // Check for audio tracks
      // Note: audioTracks is standard but only Safari supports it currently
      // mozHasAudio is for Firefox
      // webkitAudioDecodedByteCount for Chrome
      const hasAudio = (video.audioTracks && video.audioTracks.length > 0) || 
                       video.mozHasAudio || 
                       Boolean(video.webkitAudioDecodedByteCount) ||
                       (video.audioTracks && video.audioTracks.length !== 0);

      // If we are reasonably sure there's no audio, show notice
      // We check after a small delay to allow metadata to be fully processed
      setTimeout(() => {
        if (video.readyState >= 1) {
          const stillNoAudio = (video.audioTracks && video.audioTracks.length === 0) || 
                               (video.mozHasAudio === false) || 
                               (video.webkitAudioDecodedByteCount === 0);
          
          if (stillNoAudio) {
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
        playVideo();
      } else {
        video.pause();
      }
    },
    [isPaused, playVideo]
  );

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: 0.5,
  });

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
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
        autoPlay
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
      />

      {/* No audio notification */}
      {showNoAudioNotice && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          <VolumeX size={16} color="#fff" />
          <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>No audio in this video</span>
        </div>
      )}

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