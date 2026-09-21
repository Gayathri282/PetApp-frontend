import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const { showPromptModal, handleInstallClick, handleDismiss } = usePWAInstall();

  if (!showPromptModal) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'pwaFadeIn 0.25s ease-out forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(13, 81, 72, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          animation: 'pwaSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Close Button top right */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6B7280',
            transition: 'background-color 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* App Logo Badge */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-[#0D5148], #0B433C',
            backgroundColor: '#0D5148',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(13, 81, 72, 0.25)',
            padding: '4px',
          }}
        >
          <img 
            src="/logo.png" 
            alt="KeralaPets Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }} 
          />
        </div>

        {/* Title */}
        <h2
          id="pwa-install-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 8px 0',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Install App
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.925rem',
            color: '#4B5563',
            lineHeight: '1.45',
            margin: '0 0 24px 0',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Install our app on your device for a faster and more convenient experience.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <button
            onClick={handleInstallClick}
            style={{
              width: '100%',
              minHeight: '48px',
              backgroundColor: '#0D5148',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 81, 72, 0.25)',
              transition: 'background-color 0.2s, transform 0.1s',
            }}
          >
            <Download size={18} />
            Install
          </button>

          <button
            onClick={handleDismiss}
            style={{
              width: '100%',
              minHeight: '44px',
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: 'none',
              borderRadius: '14px',
              fontSize: '0.925rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.2s, background-color 0.2s',
            }}
          >
            Not now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pwaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
