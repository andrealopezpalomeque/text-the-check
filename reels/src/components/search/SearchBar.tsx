import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { brand } from '../../brand';

export const SearchBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const url = 'textthecheck.app';

  // === SEARCH BAR ENTRANCE — dramatic spring from below + scale ===
  const entranceY = spring({
    frame,
    fps,
    from: 80,
    to: 0,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });
  const entranceScale = spring({
    frame,
    fps,
    from: 0.7,
    to: 1,
    config: { damping: 14, stiffness: 110, mass: 0.8 },
  });
  const entranceOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // === TYPING — 1 char every 2.5 frames, starts at frame 15 ===
  const typingStart = 15;
  const charsPerFrame = 1 / 2.5;
  const charsTyped = Math.min(
    Math.floor((frame - typingStart) * charsPerFrame),
    url.length
  );
  const displayedText =
    frame < typingStart ? '' : url.slice(0, Math.max(0, charsTyped));

  // Blinking cursor (toggle every 15 frames = 500ms)
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;
  const showCursor = frame < 135;

  // === SUBTLE SHADOW PULSE while typing — shadow grows with each keystroke ===
  const typingProgress = interpolate(
    charsTyped,
    [0, url.length],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const shadowSpread = interpolate(typingProgress, [0, 1], [20, 40]);
  const shadowOpacity = interpolate(typingProgress, [0, 1], [0.08, 0.18]);

  // === BACKGROUND GLOW — soft radial gradient that grows while typing ===
  const glowSize = interpolate(typingProgress, [0, 1], [200, 600]);
  const glowOpacity = interpolate(typingProgress, [0, 1], [0, 0.12]);

  // === "CLICK" PRESS at frame ~112 — more pronounced ===
  const pressScale = interpolate(frame, [110, 117, 126], [1, 0.94, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === EXIT — zoom out + fade (frames 130-149) ===
  const exitOpacity = interpolate(frame, [130, 148], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [130, 148], [1.02, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const combinedScale = entranceScale * pressScale * exitScale;
  const combinedOpacity = entranceOpacity * exitOpacity;

  if (frame > 149) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFB',
      }}
    >
      {/* Background glow that grows with typing */}
      <div
        style={{
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.primaryBlue}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          opacity: exitOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Search bar pill */}
      <div
        style={{
          transform: `translateY(${entranceY}px) scale(${combinedScale})`,
          opacity: combinedOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 50,
          padding: '24px 36px',
          boxShadow: `0 4px ${shadowSpread}px rgba(59, 125, 216, ${shadowOpacity})`,
          width: 820,
          height: 80,
        }}
      >
        {/* Lock icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>

        {/* URL text */}
        <div
          style={{
            flex: 1,
            fontFamily: brand.fontBody,
            fontSize: 30,
            fontWeight: 500,
            color: '#1A2030',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            letterSpacing: 0.3,
          }}
        >
          <span>{displayedText}</span>
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 2.5,
                height: 32,
                backgroundColor: brand.primaryBlue,
                marginLeft: 2,
                opacity: cursorVisible ? 1 : 0,
                borderRadius: 1,
              }}
            />
          )}
        </div>

        {/* Search icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Small hint text that fades in after typing completes */}
      {frame > 62 && frame < 135 && (
        <div
          style={{
            position: 'absolute',
            bottom: '38%',
            fontFamily: brand.fontBody,
            fontSize: 20,
            color: '#9CA3AF',
            opacity: interpolate(frame, [62, 75, 125, 135], [0, 0.6, 0.6, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            letterSpacing: 1,
          }}
        >
          enter ↵
        </div>
      )}
    </AbsoluteFill>
  );
};
