import React from 'react';

export default function KeralaPetsLogo({ size = 180, showText = true, layout = 'horizontal' }) {
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
          src="/logo-icon.png" 
          alt="Kerala Pets Icon" 
          style={{
            height: typeof size === 'number' && size < 100 ? size : 38,
            width: typeof size === 'number' && size < 100 ? size : 38,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
        {showText && (
          <span style={{
            fontFamily: 'Playfair Display, serif',
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
        src="/logo-icon.png" 
        alt="Kerala Pets Logo" 
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          maxWidth: '100%',
          objectFit: 'cover',
        }}
      />
      {showText && (
        <span style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: '#0D5148',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginTop: 10,
        }}>
          KERALA<span style={{ color: '#F3C34E' }}>PETS</span>
        </span>
      )}
    </div>
  );
}
