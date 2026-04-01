import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../../brand';

export const ChaosOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Receipt icon — frame 480
  const iconScale = spring({
    frame: frame - 480,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.7 },
  });

  // Wordmark — frame 500
  const wordmarkOpacity = interpolate(frame, [500, 520], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dots — frame 515
  const dot1 = spring({ frame: frame - 515, fps, config: { damping: 10, stiffness: 150 } });
  const dot2 = spring({ frame: frame - 519, fps, config: { damping: 10, stiffness: 150 } });
  const dot3 = spring({ frame: frame - 523, fps, config: { damping: 10, stiffness: 150 } });

  // Tagline — frame 525
  const taglineOpacity = interpolate(frame, [525, 545], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Brand receipt icon */}
      <div style={{ transform: `scale(${iconScale})`, marginBottom: 48 }}>
        <svg width={140} height={196} viewBox="0 0 100 140">
          <path
            d="M 20 20 l 10 -5 l 10 5 l 10 -5 l 10 5 l 10 -5 l 10 5 C 75 55, 85 85, 80 120 l -10 5 l -10 -5 l -10 5 l -10 -5 l -10 5 l -10 -5 C 25 85, 15 55, 20 20 Z"
            fill={brand.primaryBlue}
            fillOpacity={0.1}
            stroke={brand.text}
            strokeWidth="2"
          />
          <line x1="30" y1="50" x2="70" y2="50" stroke={brand.primaryBlue} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="70" x2="70" y2="70" stroke={brand.primaryBlue} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="90" x2="70" y2="90" stroke={brand.primaryBlue} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div
        style={{
          opacity: wordmarkOpacity,
          fontFamily: brand.fontLogo,
          fontWeight: 600,
          fontSize: 88,
          letterSpacing: 3,
          color: brand.text,
          marginBottom: 30,
        }}
      >
        text <span style={{ color: brand.primaryBlue }}>the</span> check
      </div>

      {/* Three dots divider */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
        {[dot1, dot2, dot3].map((s, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: brand.accentGreen,
              transform: `scale(${s})`,
            }}
          />
        ))}
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          fontFamily: brand.fontBody,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: 3,
          color: '#5A6B80',
          textTransform: 'uppercase' as const,
        }}
      >
        TU PLATA, A UN MENSAJE
      </div>
    </AbsoluteFill>
  );
};
