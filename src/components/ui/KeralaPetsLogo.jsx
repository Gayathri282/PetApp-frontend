import React from 'react';

export default function KeralaPetsLogo({ size = 180, showText = true, layout = 'vertical' }) {
  const gradientId = "goldGradient-" + Math.random().toString(36).substring(2, 9);
  
  return (
    <div 
      className="kerala-pets-logo-container"
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: layout === 'vertical' ? 12 : 16,
        userSelect: 'none',
      }}
    >
      {/* Golden Emblem SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 15px rgba(212, 175, 55, 0.35))' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="30%" stopColor="#E6CA65" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA7C11" />
          </linearGradient>
          <linearGradient id={`${gradientId}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6410" />
          </linearGradient>
        </defs>

        {/* Outer Golden Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="86" 
          stroke={`url(#${gradientId}-stroke)`} 
          strokeWidth="3.5" 
          strokeDasharray="520"
          strokeDashoffset="0"
        />

        {/* Palm Tree on Right */}
        <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Trunk */}
          <path d="M142 135 C 145 110, 150 90, 152 75" />
          {/* Fronds */}
          <path d="M152 75 C 140 65, 125 70, 120 72" />
          <path d="M152 75 C 142 55, 130 52, 125 55" />
          <path d="M152 75 C 160 58, 172 60, 176 65" />
          <path d="M152 75 C 165 72, 175 78, 178 85" />
          <path d="M152 75 C 158 85, 162 95, 160 102" />
        </g>

        {/* Dog Profile Outline */}
        <path 
          d="M 60 142 
             C 55 125, 52 110, 52 95 
             C 52 75, 62 58, 80 48 
             C 95 40, 115 42, 125 52 
             C 130 57, 132 64, 128 70 
             C 124 76, 115 76, 108 72 
             C 100 68, 92 68, 85 75 
             C 78 82, 75 92, 78 105 
             C 80 115, 88 125, 95 135" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="3.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none" 
        />

        {/* Dog Snout & Ear Details */}
        <path 
          d="M 80 48 C 72 40, 60 42, 55 52 C 52 58, 56 65, 62 65 M 125 52 C 135 52, 142 58, 140 64 C 138 70, 128 72, 122 70" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none" 
        />

        {/* Cat Silhouette nested below Dog */}
        <path 
          d="M 85 142 
             C 88 128, 95 118, 105 112 
             C 112 108, 120 110, 125 118 
             C 128 124, 126 132, 120 136 
             C 115 140, 108 138, 105 132 
             C 102 128, 98 126, 95 130 
             C 92 134, 92 138, 95 142" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none" 
        />
        {/* Cat Pointed Ears */}
        <path 
          d="M 105 112 L 102 102 L 110 106 M 120 110 L 124 100 L 126 108" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Ocean Waves at Bottom */}
        <path 
          d="M 45 148 Q 70 140, 95 148 T 145 148 T 165 148 M 55 156 Q 80 150, 105 156 T 155 156" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          fill="none"
        />

        {/* Decorative Gold Accent Dots */}
        <circle cx="162" cy="78" r="3" fill={`url(#${gradientId})`} />
        <circle cx="168" cy="92" r="2" fill={`url(#${gradientId})`} />
        <circle cx="38" cy="110" r="2.5" fill={`url(#${gradientId})`} />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 
            style={{ 
              fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif", 
              fontSize: layout === 'vertical' ? '2.4rem' : '1.8rem', 
              fontWeight: 700, 
              letterSpacing: '0.22em', 
              margin: 0,
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #FFF5C0 0%, #E6CA65 35%, #D4AF37 70%, #AA7C11 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 20px rgba(212, 175, 55, 0.3)',
              textTransform: 'uppercase'
            }}
          >
            KERALA <span style={{ fontWeight: 400, opacity: 0.95 }}>PETS</span>
          </h1>

          <div 
            style={{ 
              fontSize: '0.78rem', 
              letterSpacing: '0.35em', 
              color: '#D4AF37', 
              marginTop: 6,
              fontWeight: 500,
              opacity: 0.9,
              textTransform: 'uppercase'
            }}
          >
            LOVE . CARE . CONNECT .
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
            <span style={{ fontSize: '0.8rem' }}>🐾</span>
            <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          </div>

          <div 
            style={{ 
              fontSize: '0.72rem', 
              letterSpacing: '0.28em', 
              color: '#C5A059', 
              marginTop: 6,
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            KERALA'S #1 PET MARKETPLACE
          </div>
        </div>
      )}
    </div>
  );
}
