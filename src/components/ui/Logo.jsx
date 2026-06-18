export default function Logo({ size = 36, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img
        src="/logo.png"
        alt="KerelaPets Logo"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: '50%',
        }}
      />
      {showText && (
        <span
          style={{
            fontSize: size * 0.75,
            fontFamily: 'var(--font-tall)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
          className="gradient-text"
        >
          KerelaPets
        </span>
      )}
    </div>
  );
}
