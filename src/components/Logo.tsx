import React from 'react';

// This is an SVG representation of the LyVenTum logo, redesigned based on user feedback.
const LyVentumLogo = ({ className = '', variant = 'gradient' }: { className?: string, variant?: 'gradient' | 'light' }) => {
  const isLight = variant === 'light';
  
  return (
    <svg
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LyVenTum Logo"
    >
      <defs>
        <linearGradient id="lyventumTextGradient" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#004aad" />
          <stop offset="50%" stopColor="#0076ce" />
          <stop offset="100%" stopColor="#00b9d8" />
        </linearGradient>
        <linearGradient id="lyventumBarsGradient" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#00b9d8" />
          <stop offset="100%" stopColor="#26d5c6" />
        </linearGradient>
      </defs>
      
      {/* LVT Path Data */}
      <path
        d="M0 0 H12 V40 H32 V50 H0 Z M40 0 L60 50 L80 0 H67 L60 21 L53 0 Z M88 0 H140 V12 H108 V50 H96 V12 H88 Z"
        fill={isLight ? 'white' : 'url(#lyventumTextGradient)'}
      />
      
      {/* Momentum Bars */}
      <g fill={isLight ? 'white' : 'url(#lyventumBarsGradient)'}>
        <rect x="145" y="28" width="12" height="22" rx="2" />
        <rect x="162" y="16" width="12" height="34" rx="2" />
        <rect x="179" y="4" width="12" height="46" rx="2" />
      </g>
    </svg>
  );
};

export default LyVentumLogo;