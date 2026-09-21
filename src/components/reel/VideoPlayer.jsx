import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Pause, Play, VolumeX } from 'lucide-react';

export default function VideoPlayer({ src, poster = '', muted = false, style = {}, externalRef = null }) {
  const params = useParams();
  const routeId = params?.id || '';

  const getFullSrc = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = url.replace(/\\/g, '/');
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;

  const manuallyPaused = useRef(false);
  const isInView = useRef(true);

  const [isPaused, setIsPaused] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showNoAudioNotice, setShowNoAudioNotice] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const startPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !src) return;

    try {
      video.muted = muted;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('[VIDEO PLAYBACK] Started successfully');
        setAutoplayBlocked(false);
        setIsPaused(false);
      }
    } catch (error) {
      console.warn('[VIDEO PLAYBACK] Autoplay failed with requested mute settings, attempting muted autoplay:', error);
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
        console.log('[VIDEO PLAYBACK] Started successfully (muted fallback)');
        setAutoplayBlocked(false);
        setIsPaused(false);
      } catch (err) {
        console.log('[VIDEO PLAYBACK] Autoplay blocked:', err);
        setAutoplayBlocked(true);
        setIsPaused(true);
      }
    }
  }, [src, muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const fullSrcUrl = getFullSrc(src);
    video.src = fullSrcUrl;
    video.muted = muted;
    video.playsInline = true;

    manuallyPaused.current = false;
    isInView.current = true;
    setHasError(false);
    setAutoplayBlocked(false);
    setShowNoAudioNotice(false);

    const logDiagnostics = (evtName) => {
      console.log(`[VIDEO] ${evtName}`, {
        src: video.currentSrc || video.src,
        readyState: video.readyState,
        paused: video.paused,
        muted: video.muted,
        autoplay: video.autoplay,
        networkState: video.networkState,
        error: video.error
      });
    };

    const onLoadedMetadata = () => logDiagnostics('loadedmetadata');
    const onLoadedData = () => {
      logDiagnostics('loadeddata');
      if (isInView.current && !manuallyPaused.current) {
        startPlayback();
      }
    };
    const onCanPlay = () => logDiagnostics('canplay');
    const onPlaying = () => {
      logDiagnostics('playing');
      setIsPaused(false);
      setAutoplayBlocked(false);
    };
    const onPause = () => {
      logDiagnostics('pause');
      setIsPaused(true);
    };
    const onError = (e) => {
      console.error('[VIDEO] playback error', video.error || e);
      setHasError(true);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    video.load();
    if (video.readyState >= 2) {
      if (isInView.current && !manuallyPaused.current) {
        startPlayback();
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);

      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        // ignore cleanup error
      }
    };
  }, [src, routeId, startPlayback, muted]);

  const handleIntersect = useCallback(
    (entry) => {
      const video = videoRef.current;
      if (!video) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
        isInView.current = true;
        if (!manuallyPaused.current && src && video.paused) {
          startPlayback();
        }
      } else if (entry.intersectionRatio < 0.05 && !entry.isIntersecting) {
        isInView.current = false;
        video.pause();
      }
    },
    [src, startPlayback]
  );

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: [0.05, 0.15, 0.5],
  });

  const togglePlay = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      manuallyPaused.current = false;
      startPlayback();
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
        background: '#040704',
        cursor: 'pointer',
        overflow: 'hidden',
        ...style,
      }}
    >
      <video
        ref={videoRef}
        poster={poster ? getFullSrc(poster) : undefined}
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              background: '#0D5148', color: '#FFFFFF', border: 'none', borderRadius: 12,
              padding: '10px 20px', fontWeight: 700,
              cursor: 'pointer', fontSize: '0.8rem', marginTop: 8
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Play / Pause overlay */}
      {(showControl || isPaused || autoplayBlocked) && !hasError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
          borderRadius: '50%', padding: 24, zIndex: 20,
          pointerEvents: 'none', display: 'flex',
          animation: 'fadeInOut 0.5s ease-in-out',
        }}>
          {isPaused || autoplayBlocked
            ? <Play size={40} fill="#fff" color="#fff" />
            : <Pause size={40} fill="#fff" color="#fff" />
          }
        </div>
      )}
    </div>
  );
}