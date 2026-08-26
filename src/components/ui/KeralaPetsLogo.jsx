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
            height: typeof size === 'number' && size < 100 ? size : 44,
            width: 'auto',
            maxHeight: 44,
            objectFit: 'contain',
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
        }}
      />
    </div>
  );
}
