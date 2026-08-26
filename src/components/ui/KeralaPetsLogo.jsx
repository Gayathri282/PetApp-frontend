import React from 'react';

export default function KeralaPetsLogo({ size = 180, showText = true, layout = 'vertical' }) {
  if (layout === 'horizontal') {
    return (
      <div 
        className="kerala-pets-logo-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          userSelect: 'none',
        }}
      >
        <img 
          src="/logo.png" 
          alt="Kerala Pets Logo" 
          style={{
            height: size,
            width: 'auto',
            maxHeight: 44,
            objectFit: 'contain',
          }}
        />
        {showText && (
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#0D5148',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            KERALA<span style={{ color: '#F3C34E' }}>PETS</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className="kerala-pets-logo-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <img 
        src="/logo.png" 
        alt="Kerala Pets Logo" 
        style={{
          width: size,
          maxWidth: '100%',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
      {showText && (
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#0D5148',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginTop: 8,
        }}>
          KERALA<span style={{ color: '#F3C34E' }}>PETS</span>
        </span>
      )}
    </div>
  );
}
