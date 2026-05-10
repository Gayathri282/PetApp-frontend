export default function Logo({ size = 36, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#logoGrad)" strokeWidth="4" />
        <ellipse cx="50" cy="55" rx="14" ry="12" fill="url(#logoGrad)" />
        <ellipse cx="35" cy="38" rx="7" ry="8" fill="url(#logoGrad)" />
        <ellipse cx="50" cy="33" rx="7" ry="8" fill="url(#logoGrad)" />
        <ellipse cx="65" cy="38" rx="7" ry="8" fill="url(#logoGrad)" />
        <polygon points="44,48 44,62 58,55" fill="#0f0d1a" opacity="0.7" />
      </svg>
      {showText && (
        <span
          style={{
            fontSize: size * 0.6,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
          className="gradient-text"
        >
          FurReel
        </span>
      )}
    </div>
  );
}
