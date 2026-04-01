import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { ReceiptIcon } from './ReceiptIcon';

const Wordmark: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      fontFamily: brand.fontLogo,
      fontWeight: 600,
      fontSize: 88,
      letterSpacing: 3,
      lineHeight: 1,
    }}
  >
    <span style={{ color: brand.text }}>text&nbsp;</span>
    <span style={{ color: brand.primaryBlue }}>the</span>
    <span style={{ color: brand.text }}>&nbsp;check</span>
  </div>
);

export const OutroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { stiffness: 220, damping: 18 } });

  const wordmarkOpacity = interpolate(frame, [16, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkY = interpolate(frame, [16, 36], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Three dots staggered
  const dot1Scale = spring({ frame: Math.max(0, frame - 34), fps, config: { stiffness: 400, damping: 24 } });
  const dot2Scale = spring({ frame: Math.max(0, frame - 40), fps, config: { stiffness: 400, damping: 24 } });
  const dot3Scale = spring({ frame: Math.max(0, frame - 46), fps, config: { stiffness: 400, damping: 24 } });

  const disponibleOpacity = interpolate(frame, [44, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const handleOpacity = interpolate(frame, [54, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse 960px 700px at 50% 52%, ${brand.primaryBlue}14 0%, transparent 68%)`,
      }}
    >
      {/* Icon */}
      <div
        style={{
          transform: `scale(${iconScale})`,
          transformOrigin: 'center center',
          filter: `drop-shadow(0 0 36px ${brand.primaryBlue}60)`,
        }}
      >
        <ReceiptIcon size={118} bodyColor={brand.text} lineColor={brand.primaryBlue} />
      </div>

      <div style={{ height: 32 }} />

      {/* Wordmark */}
      <div
        style={{
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <Wordmark />
      </div>

      <div style={{ height: 26 }} />

      {/* Three green dots */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {[dot1Scale, dot2Scale, dot3Scale].map((dotScale, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: brand.accentGreen,
              transform: `scale(${dotScale})`,
              transformOrigin: 'center center',
            }}
          />
        ))}
      </div>

      <div style={{ height: 28 }} />

      {/* Disponible ahora */}
      <div style={{ opacity: disponibleOpacity }}>
        <span
          style={{
            fontFamily: brand.fontBody,
            fontWeight: 500,
            fontSize: 30,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: brand.textMuted,
          }}
        >
          Disponible ahora
        </span>
      </div>

      <div style={{ height: 16 }} />

      {/* Handle */}
      <div style={{ opacity: handleOpacity }}>
        <span
          style={{
            fontFamily: brand.fontBody,
            fontWeight: 400,
            fontSize: 24,
            color: '#3A4A58',
            letterSpacing: 1,
          }}
        >
          @textthecheck
        </span>
      </div>
    </AbsoluteFill>
  );
};
