import { useState } from 'react';
import { Link2, Check, X as XIcon } from 'lucide-react';
import Modal from './Modal';

export default function ShareModal({ isOpen, onClose, url, title = 'Share' }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 16 }}>
        Copy the link below to share
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 4,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <input
          readOnly
          value={shareUrl}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            fontSize: '0.85rem',
            padding: '10px 12px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleCopy}
          className={copied ? 'btn-primary' : 'btn-ghost'}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            minWidth: 80,
          }}
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </Modal>
  );
}
