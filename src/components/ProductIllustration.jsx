import React from 'react';

const GRADIENTS = {
  sky: { from: '#38bdf8', to: '#0284c7', bg: 'rgba(56, 189, 248, 0.1)' },
  indigo: { from: '#818cf8', to: '#4f46e5', bg: 'rgba(129, 204, 248, 0.1)' },
  amber: { from: '#fbbf24', to: '#d97706', bg: 'rgba(251, 191, 36, 0.1)' },
  rose: { from: '#fb7185', to: '#e11d48', bg: 'rgba(251, 113, 133, 0.1)' },
  emerald: { from: '#34d399', to: '#059669', bg: 'rgba(52, 211, 153, 0.1)' },
  slate: { from: '#94a3b8', to: '#475569', bg: 'rgba(148, 163, 184, 0.1)' },
  violet: { from: '#c084fc', to: '#7c3aed', bg: 'rgba(192, 132, 252, 0.1)' }
};

export const ProductIllustration = ({ type = 'headphones', color = 'indigo', className = '', style = {} }) => {
  const palette = GRADIENTS[color] || GRADIENTS.indigo;
  const gradId = `grad-${type}-${color}`;

  const renderIllustration = () => {
    switch (type) {
      case 'holder':
        return (
          // Soporte Celular
          <g>
            {/* Stand Base */}
            <path d="M40 85 L160 85 L150 95 L50 95 Z" fill={`url(#${gradId})`} opacity="0.9" />
            {/* Stand Neck */}
            <path d="M92 85 L108 85 L108 45 L92 48 Z" fill={`url(#${gradId})`} />
            {/* Mobile Bracket */}
            <rect x="75" y="32" width="50" height="15" rx="3" fill={`url(#${gradId})`} transform="rotate(-15 100 40)" />
            {/* Phone Silhouette */}
            <rect x="65" y="15" width="70" height="40" rx="4" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" transform="rotate(-15 100 35)" />
            {/* Phone Screen Gradient */}
            <rect x="68" y="18" width="64" height="34" rx="2" fill={`url(#${gradId})`} opacity="0.25" transform="rotate(-15 100 35)" />
          </g>
        );
      case 'headphones':
        return (
          // Auriculares Diadema
          <g>
            {/* Headband */}
            <path d="M50 70 A 50 50 0 0 1 150 70" fill="none" stroke={`url(#${gradId})`} strokeWidth="8" strokeLinecap="round" />
            {/* Headband Inner Soft Pad */}
            <path d="M55 70 A 45 45 0 0 1 145 70" fill="none" stroke={`url(#${gradId})`} strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
            {/* Left Ear Cup */}
            <rect x="36" y="60" width="18" height="36" rx="9" fill={`url(#${gradId})`} />
            <rect x="32" y="66" width="4" height="24" rx="2" fill={`url(#${gradId})`} opacity="0.7" />
            {/* Right Ear Cup */}
            <rect x="146" y="60" width="18" height="36" rx="9" fill={`url(#${gradId})`} />
            <rect x="164" y="66" width="4" height="24" rx="2" fill={`url(#${gradId})`} opacity="0.7" />
            {/* Joint details */}
            <circle cx="45" cy="60" r="3" fill="#fff" opacity="0.5" />
            <circle cx="155" cy="60" r="3" fill="#fff" opacity="0.5" />
          </g>
        );
      case 'cleaner':
        return (
          // Robot Aspirador
          <g>
            {/* Outer Ring */}
            <circle cx="100" cy="100" r="48" fill="none" stroke={`url(#${gradId})`} strokeWidth="6" />
            {/* Main Body */}
            <circle cx="100" cy="100" r="44" fill={`url(#${gradId})`} opacity="0.2" />
            {/* Bumper Arc */}
            <path d="M56 100 A 44 44 0 0 1 144 100" fill="none" stroke={`url(#${gradId})`} strokeWidth="4" />
            {/* LiDAR Turret */}
            <circle cx="100" cy="78" r="12" fill={`url(#${gradId})`} />
            <circle cx="100" cy="78" r="7" fill="#fff" opacity="0.3" />
            {/* Status indicators */}
            <circle cx="100" cy="115" r="4" fill={`url(#${gradId})`} />
            <line x1="88" y1="115" x2="94" y2="115" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" />
            <line x1="106" y1="115" x2="112" y2="115" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'camera':
        return (
          // Cámara Inteligente
          <g>
            {/* Base Mount */}
            <path d="M70 120 L130 120 L120 135 L80 135 Z" fill={`url(#${gradId})`} opacity="0.8" />
            {/* Neck Joint */}
            <rect x="94" y="96" width="12" height="24" rx="3" fill={`url(#${gradId})`} />
            {/* Camera Body Sphere */}
            <circle cx="100" cy="65" r="35" fill={`url(#${gradId})`} opacity="0.15" />
            <circle cx="100" cy="65" r="35" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" />
            {/* Lens Gloss Face */}
            <circle cx="100" cy="65" r="22" fill={`url(#${gradId})`} />
            <circle cx="95" cy="60" r="16" fill="#000" />
            {/* Lens Aperture glass */}
            <circle cx="95" cy="60" r="6" fill={`url(#${gradId})`} />
            {/* Infrared sensors */}
            <circle cx="100" cy="42" r="2.5" fill="#ef4444" />
            <circle cx="120" cy="65" r="2.5" fill={`url(#${gradId})`} opacity="0.6" />
          </g>
        );
      case 'speaker':
        return (
          // Cilindro Altavoz
          <g>
            {/* Top glass plate */}
            <ellipse cx="100" cy="35" rx="35" ry="12" fill={`url(#${gradId})`} />
            {/* Cylinder mesh outline */}
            <path d="M65 35 L65 125 A 35 12 0 0 0 135 125 L135 35" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" />
            {/* Speaker body fill */}
            <path d="M65 35 L65 125 A 35 12 0 0 0 135 125 L135 35 Z" fill={`url(#${gradId})`} opacity="0.15" />
            {/* Soundwave wave pattern mesh lines */}
            <path d="M70 50 Q 85 55 100 50 T 130 50" fill="none" stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.4" />
            <path d="M70 70 Q 85 75 100 70 T 130 70" fill="none" stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.4" />
            <path d="M70 90 Q 85 95 100 90 T 130 90" fill="none" stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.4" />
            <path d="M70 110 Q 85 115 100 110 T 130 110" fill="none" stroke={`url(#${gradId})`} strokeWidth="1" opacity="0.4" />
            {/* Voice Ring Control LED on top */}
            <ellipse cx="100" cy="35" rx="20" ry="7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
          </g>
        );
      case 'earbuds':
        return (
          // Estuche Audífonos
          <g>
            {/* Charging Case Body */}
            <rect x="65" y="55" width="70" height="60" rx="20" fill={`url(#${gradId})`} opacity="0.25" />
            <rect x="65" y="55" width="70" height="60" rx="20" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" />
            {/* Case Lid Line */}
            <line x1="65" y1="75" x2="135" y2="75" stroke={`url(#${gradId})`} strokeWidth="2" />
            {/* Charge Indicator LED */}
            <circle cx="100" cy="95" r="3" fill={`url(#${gradId})`} />
            {/* Earbud Left */}
            <path d="M50 35 C 50 25, 62 25, 62 35 C 62 42, 53 45, 50 50 Z" fill={`url(#${gradId})`} />
            {/* Earbud Right */}
            <path d="M150 35 C 150 25, 138 25, 138 35 C 138 42, 147 45, 150 50 Z" fill={`url(#${gradId})`} />
          </g>
        );
      case 'piano':
        return (
          // Piano de Cola
          <g>
            {/* Grand Piano Body Lid */}
            <path d="M45 40 C 65 30, 115 25, 145 45 C 155 55, 155 75, 145 80 C 135 85, 125 75, 115 90 C 105 105, 55 105, 45 90 Z" fill={`url(#${gradId})`} />
            {/* Keyboard Board */}
            <rect x="45" y="85" width="75" height="10" fill="#fff" stroke={`url(#${gradId})`} strokeWidth="2" />
            {/* Keyboard Keys Details */}
            <line x1="55" y1="85" x2="55" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="65" y1="85" x2="65" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="75" y1="85" x2="75" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="85" y1="85" x2="85" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="95" y1="85" x2="95" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="105" y1="85" x2="105" y2="95" stroke="#000" strokeWidth="1.5" />
            <line x1="115" y1="85" x2="115" y2="95" stroke="#000" strokeWidth="1.5" />
            {/* Piano Prop stick lid */}
            <line x1="135" y1="42" x2="155" y2="20" stroke={`url(#${gradId})`} strokeWidth="3" strokeLinecap="round" />
            {/* Stylized base legs */}
            <line x1="55" y1="95" x2="55" y2="120" stroke={`url(#${gradId})`} strokeWidth="3.5" />
            <line x1="110" y1="92" x2="110" y2="118" stroke={`url(#${gradId})`} strokeWidth="3.5" />
            <line x1="140" y1="78" x2="140" y2="112" stroke={`url(#${gradId})`} strokeWidth="3.5" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at center, ${palette.bg} 0%, transparent 80%)`,
        ...style
      }}
    >
      <svg
        viewBox="0 0 200 160"
        width="100%"
        height="100%"
        style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>
        {renderIllustration()}
      </svg>
    </div>
  );
};
