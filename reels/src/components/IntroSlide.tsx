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
      fontSize: 90,
      letterSpacing: 3,
      lineHeight: 1,
    }}
  >
    <span style={{ color: brand.text }}>text&nbsp;</span>
    <span style={{ color: brand.primaryBlue }}>the</span>
    <span style={{ color: brand.text }}>&nbsp;check</span>
  </div>
);

export const IntroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { stiffness: 210, damping: 18 } });

  const wordmarkOpacity = interpolate(frame, [18, 38], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkY = interpolate(frame, [18, 38], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taglineOpacity = interpolate(frame, [32, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const globalOpacity = interpolate(frame, [70, 89], [1, 0], {
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
        opacity: globalOpacity,
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

      <div style={{ height: 34 }} />

      {/* Wordmark */}
      <div
        style={{
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <Wordmark />
      </div>

      <div style={{ height: 18 }} />

      {/* Tagline */}
      <div style={{ opacity: taglineOpacity }}>
        <span
          style={{
            fontFamily: brand.fontBody,
            fontWeight: 500,
            fontSize: 33,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: brand.textMuted,
          }}
        >
          Tu plata, a un mensaje
        </span>
      </div>
    </AbsoluteFill>
  );
};
