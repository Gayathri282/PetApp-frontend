import React from 'react';

export default function KeralaPetsLogo({ size = 180, showText = true, layout = 'vertical' }) {
  if (layout === 'horizontal') {
    return (
      <div 
        className="kerala-pets-logo-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          userSelect: 'none',
        }}
      >
        <img 
          src="/logo.png" 
          alt="Kerala Pets Logo" 
          style={{
            height: size,
            width: 'auto',
            maxHeight: 52,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 15px rgba(212, 175, 55, 0.4))',
          }}
        />
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
          filter: 'drop-shadow(0 6px 20px rgba(212, 175, 55, 0.45))',
        }}
      />
    </div>
  );
}
