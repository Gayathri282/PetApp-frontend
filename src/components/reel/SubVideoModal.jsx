import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Film } from 'lucide-react';
import { getPlayableVideoUrl, getPosterUrl } from '../../utils/media';

export default function SubVideoModal({ item, isOpen, onClose }) {
  const [subIndex, setSubIndex] = useState(0);

  if (!isOpen || !item) return null;

  const reels = Array.isArray(item.reels) && item.reels.length > 0 ? item.reels : [];
  if (reels.length === 0) return null;

  const currentReel = reels[subIndex] || reels[0];
  const videoUrl = getPlayableVideoUrl(currentReel) || getPlayableVideoUrl(item);
  const posterUrl = getPosterUrl(currentReel) || getPosterUrl(item);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '12px 16px',
          background: 'rgba(13, 81, 72, 0.95)',
          color: '#FFFFFF',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ArrowLeft size={20} /> Back to Reel
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
          Video {subIndex + 1} of {reels.length}
        </span>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Video Content */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          background: '#000000',
        }}
      >
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            poster={posterUrl}
            controls
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '100dvh',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{ color: '#FFFFFF', textAlign: 'center', padding: 20 }}>
            <Film size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700 }}>No playable video found</p>
          </div>
        )}

        {/* Previous Video Button */}
        {subIndex > 0 && (
          <button
            onClick={() => setSubIndex(prev => prev - 1)}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(13, 81, 72, 0.75)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 20,
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Next Video Button */}
        {subIndex < reels.length - 1 && (
          <button
            onClick={() => setSubIndex(prev => prev + 1)}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(13, 81, 72, 0.75)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 20,
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      {reels.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(12, 18, 16, 0.95)',
            overflowX: 'auto',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {reels.map((r, i) => (
            <button
              key={i}
              onClick={() => setSubIndex(i)}
              style={{
                width: 54,
                height: 54,
                borderRadius: 10,
                overflow: 'hidden',
                border: subIndex === i ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.2)',
                opacity: subIndex === i ? 1 : 0.6,
                cursor: 'pointer',
                padding: 0,
                background: '#000',
                position: 'relative',
              }}
            >
              {getPosterUrl(r) ? (
                <img src={getPosterUrl(r)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                  #{i + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
