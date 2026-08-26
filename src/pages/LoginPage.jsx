import KeralaPetsLogo from '../components/ui/KeralaPetsLogo';

export default function LoginPage() {
  return (
    <div 
      style={{ 
        minHeight: '100dvh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20,
        background: 'radial-gradient(ellipse at 50% 20%, #1c150c 0%, #0d0b08 60%, #050403 100%)',
        color: '#e2e8f0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient Gold Orbs */}
      <div style={{ position:'absolute', top:'10%', left:'15%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(212, 175, 55, 0.15), transparent 70%)', pointerEvents:'none' }} className="animate-float" />
      <div style={{ position:'absolute', bottom:'15%', right:'12%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(170, 124, 17, 0.12), transparent 70%)', pointerEvents:'none', animationDelay:'1.5s' }} className="animate-float" />

      <div 
        className="animate-fade-in-up" 
        style={{ 
          textAlign: 'center', 
          maxWidth: 480, 
          width: '100%',
          background: 'rgba(22, 18, 14, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 28,
          padding: '40px 32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ display:'flex', justifyContent:'center', marginBottom: 20 }}>
          <KeralaPetsLogo size={160} showText={true} layout="vertical" />
        </div>

        <p style={{ color:'#d1d5db', fontSize:'0.95rem', lineHeight:1.6, marginBottom: 32, marginTop: 16 }}>
          Explore thousands of pet listings, adoption opportunities, and pet services across Kerala.
        </p>

        <a 
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'linear-gradient(135deg, #FFE58F 0%, #D4AF37 50%, #AA7C11 100%)',
            color: '#0f0c08',
            padding: '14px 28px', 
            fontSize: '1rem', 
            fontWeight: 800,
            borderRadius: 16, 
            width: '100%', 
            textDecoration: 'none',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </a>

        <p style={{ marginTop: 24, fontSize: '0.75rem', color: '#8c8c8c' }}>
          By signing in, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}

