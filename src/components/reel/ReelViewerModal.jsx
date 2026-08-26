import { useEffect, useRef, useState } from 'react';
import { X, Play, RefreshCw, Volume2, VolumeX, ShieldCheck, MapPin } from 'lucide-react';

import { getPlayableVideoUrl, getPosterUrl, logVideoDiagnostics } from '../../utils/media';

export default function ReelViewerModal({ isOpen, onClose, reel, product }) {
  const videoRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const itemData = product || reel;
  const videoUrl = getPlayableVideoUrl(itemData);
  const posterUrl = getPosterUrl(itemData);

  if (isOpen && itemData) {
    logVideoDiagnostics('ReelViewerModal', itemData);
  }

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);

    if (isOpen && videoRef.current && videoUrl) {
      console.log('[REEL VIEWER] Modal Opened with Video URL:', videoUrl);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('[REEL VIEWER] Autoplay rejected, user tap required:', err);
            setIsPlaying(false);
          });
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        try { videoRef.current.currentTime = 0; } catch {}
      }
    };
  }, [isOpen, videoUrl]);

  if (!isOpen || !itemData) return null;

  const title = itemData.name || reel?.caption || 'Kerala Pets Reel';
  const price = itemData.price !== undefined ? `₹${itemData.price.toLocaleString('en-IN')}` : '';
  const vendorName = itemData.vendor?.name || 'Kerala Pets Verified';
  const city = itemData.location?.city || 'Kochi, Kerala';

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          height: 680,
          background: '#040806',
          borderRadius: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 30,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)'
          }}
        >
          <X size={20} />
        </button>

        {/* Mute/Unmute Button */}
        {videoUrl && !hasError && (
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 30,
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)'
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Video / Media Player Container */}
        <div style={{ position: 'relative', flex: 1, background: '#000', overflow: 'hidden' }}>
          {videoUrl && !hasError ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              controls
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              preload="metadata"
              muted={isMuted}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onLoadStart={() => console.log('[VIDEO DIAGNOSTICS] Load Start:', videoUrl)}
              onLoadedMetadata={() => console.log('[VIDEO DIAGNOSTICS] Metadata Loaded:', videoUrl)}
              onCanPlay={() => console.log('[VIDEO DIAGNOSTICS] Can Play:', videoUrl)}
              onPlay={() => {
                console.log('[VIDEO DIAGNOSTICS] Playing:', videoUrl);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('[VIDEO DIAGNOSTICS] Video Error:', {
                  url: videoUrl,
                  error: e.currentTarget.error,
                  networkState: e.currentTarget.networkState,
                  readyState: e.currentTarget.readyState
                });
                setHasError(true);
              }}
            />
          ) : posterUrl ? (
            <img src={posterUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', gap: 12, padding: 24, textAlign: 'center' }}>
              <Play size={40} color="#0D5148" />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Media Preview Available</p>
            </div>
          )}

          {/* Error Overlay Fallback */}
          {hasError && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4, 8, 6, 0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: '#FFFFFF', gap: 12, zIndex: 20 }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800 }}>Unable to load this video</p>
              <p style={{ fontSize: '0.78rem', opacity: 0.7, maxWidth: 280 }}>The video stream might be buffering or unavailable.</p>
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
                  marginTop: 6
                }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
            </div>
          )}

          {/* Bottom Gradient Overlay for Typography Visibility */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(4,8,6,0.95) 0%, rgba(4,8,6,0.6) 60%, transparent 100%)', pointerEvents: 'none' }} />

          {/* Listing Metadata Banner over Video */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: '#FFFFFF', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'Playfair Display, serif' }}>{title}</h3>
            {price && <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F3C34E', margin: 0 }}>{price}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', opacity: 0.9, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><ShieldCheck size={14} color="#F3C34E" /> {vendorName}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {city}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
