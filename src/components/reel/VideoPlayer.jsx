import { useRef, useState, useCallback, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

export default function VideoPlayer({ src, style = {} }) {
  const getFullSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControl, setShowControl] = useState(false);

  const handleIntersect = useCallback((entry) => {
    const video = videoRef.current;
    if (!video) return;

    if (entry.isIntersecting) {
      if (!isPaused) {
        video.play().catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isPaused]);

  const containerRef = useIntersectionObserver(handleIntersect, {
    threshold: 0.6,
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

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((m) => !m);
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
        src={getFullSrc(src)}
        muted={isMuted}
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

      {/* Control overlay */}
      {(showControl || isPaused) && (
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

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: 10,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          zIndex: 25,
          transition: 'all 0.2s',
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}
