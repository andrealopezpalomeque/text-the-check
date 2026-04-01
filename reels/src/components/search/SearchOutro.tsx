import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { brand } from '../../brand';

export const SearchOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === RECEIPT ICON — dramatic spring with overshoot ===
  const iconScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 8, stiffness: 120, mass: 0.7 },
  });
  const iconRotation = spring({
    frame,
    fps,
    from: -15,
    to: 0,
    config: { damping: 10, stiffness: 80, mass: 0.8 },
  });

  // === GLOW PULSE behind icon ===
  const glowPulse = Math.sin(frame * 0.12) * 0.15 + 0.35;
  const glowScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 15, stiffness: 60, mass: 1.0 },
  });

  // === WORDMARK — slide up + fade ===
  const wordmarkProgress = spring({
    frame: Math.max(0, frame - 12),
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 100, mass: 0.7 },
  });
  const wordmarkOpacity = interpolate(frame, [12, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkY = interpolate(wordmarkProgress, [0, 1], [30, 0]);

  // === GREEN DOTS — staggered pop in ===
  const dotScales = [0, 1, 2].map((i) =>
    spring({
      frame: Math.max(0, frame - 28 - i * 5),
      fps,
      from: 0,
      to: 1,
      config: { damping: 8, stiffness: 150, mass: 0.5 },
    })
  );

  // === TAGLINE — fade up ===
  const taglineOpacity = interpolate(frame, [38, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = spring({
    frame: Math.max(0, frame - 38),
    fps,
    from: 20,
    to: 0,
    config: { damping: 14, stiffness: 100, mass: 0.7 },
  });

  // === SUBTLE FLOATING PARTICLES (decorative) ===
  const particles = [
    { x: -320, y: -400, size: 4, speed: 0.04, delay: 0 },
    { x: 280, y: -300, size: 3, speed: 0.05, delay: 5 },
    { x: -200, y: 350, size: 5, speed: 0.03, delay: 10 },
    { x: 350, y: 280, size: 3, speed: 0.06, delay: 3 },
    { x: -380, y: 100, size: 4, speed: 0.04, delay: 8 },
    { x: 150, y: -450, size: 3, speed: 0.05, delay: 12 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: brand.bgDark,
        overflow: 'hidden',
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => {
        const pFrame = Math.max(0, frame - p.delay);
        const pOpacity = interpolate(pFrame, [0, 15, 70, 89], [0, 0.3, 0.3, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const pY = p.y - pFrame * 0.8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${pY}px)`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: brand.primaryBlue,
              opacity: pOpacity,
            }}
          />
        );
      })}

      {/* Glow behind icon */}
      <div
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.primaryBlue}40 0%, transparent 70%)`,
          opacity: glowPulse,
          transform: `scale(${glowScale})`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Receipt Icon */}
        <div
          style={{
            transform: `scale(${iconScale}) rotate(${iconRotation}deg)`,
          }}
        >
          <svg width="120" height="140" viewBox="0 0 100 140">
            <path
              d="M 20 20 l 10 -5 l 10 5 l 10 -5 l 10 5 l 10 -5 l 10 5 C 75 55, 85 85, 80 120 l -10 5 l -10 -5 l -10 5 l -10 -5 l -10 5 l -10 -5 C 25 85, 15 55, 20 20 Z"
              fill={brand.bgDark}
              stroke={brand.primaryBlue}
              strokeWidth="2.5"
            />
            <line x1="32" y1="50" x2="68" y2="50" stroke={brand.primaryBlue} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <line x1="32" y1="70" x2="52" y2="70" stroke={brand.primaryBlue} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <line x1="32" y1="90" x2="60" y2="90" stroke={brand.primaryBlue} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            opacity: wordmarkOpacity,
            transform: `translateY(${wordmarkY}px)`,
            fontFamily: brand.fontLogo,
            fontWeight: 600,
            fontSize: 52,
            letterSpacing: 3,
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <span>text </span>
          <span style={{ color: brand.primaryBlue }}>the</span>
          <span> check</span>
        </div>

        {/* Green dots divider — staggered pop */}
        <div style={{ display: 'flex', gap: 14 }}>
          {dotScales.map((scale, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: brand.accentGreen,
                transform: `scale(${scale})`,
              }}
            />
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontFamily: brand.fontBody,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: 4,
            color: brand.textMuted,
            textTransform: 'uppercase' as const,
          }}
        >
          TU PLATA, A UN MENSAJE
        </div>
      </div>
    </AbsoluteFill>
  );
};
