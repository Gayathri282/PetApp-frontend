import React from 'react';
import Modal from './Modal';
import { Heart, Scissors, Package, Sparkles } from 'lucide-react';

const COMING_SOON_CONFIG = {
  adoption: {
    title: 'Adoption',
    icon: Heart,
    description: "We're building a trusted adoption experience for pet lovers across Kerala.",
  },
  services: {
    title: 'Pet Services',
    icon: Scissors,
    description: 'Trusted grooming, health care, and pet services are coming soon to Kerala Pets.',
  },
  essentials: {
    title: 'Pet Essentials',
    icon: Package,
    description: 'Quality pet food, accessories, and everyday essentials are coming soon.',
  },
  default: {
    title: 'Coming Soon',
    icon: Sparkles,
    description: "We're working hard to bring this feature to Kerala's #1 pet marketplace.",
  },
};

export default function ComingSoonModal({ isOpen, onClose, feature = 'default' }) {
  const config = COMING_SOON_CONFIG[feature] || COMING_SOON_CONFIG.default;
  const IconComponent = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div
        style={{
          padding: '24px 16px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Gold Icon Badge */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
          }}
        >
          <IconComponent size={32} color="#FFE58F" />
        </div>

        {/* Feature Title */}
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#F5F5EC',
              fontFamily: 'Cinzel, serif',
              marginBottom: 4,
              letterSpacing: '0.03em',
            }}
          >
            {config.title}
          </h2>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#FFE58F',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            ✨ Coming Soon
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '0.88rem',
            color: '#A3B8A8',
            lineHeight: 1.5,
            maxWidth: 320,
            margin: 0,
          }}
        >
          {config.description}
        </p>

        {/* Action Button */}
        <button
          className="btn-primary"
          onClick={onClose}
          style={{
            width: '100%',
            maxWidth: 260,
            padding: '12px 0',
            marginTop: 8,
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
