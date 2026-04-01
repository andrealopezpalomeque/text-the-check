import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../../brand';

export const CleanSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entire section fades out at the end
  const sectionOpacity = interpolate(frame, [480, 500], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Label text — frame 340
  const labelOpacity = interpolate(frame, [340, 355], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Sent bubble — frame 370
  const sentScale = spring({
    frame: frame - 370,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.7 },
  });
  const sentOpacity = interpolate(frame, [370, 380], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Received bubble — frame 400
  const receivedX = interpolate(frame, [400, 420], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const receivedOpacity = interpolate(frame, [400, 415], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Badge — frame 430
  const badgeScale = spring({
    frame: frame - 430,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.6 },
  });
  const badgeOpacity = interpolate(frame, [430, 440], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bubbleBase: React.CSSProperties = {
    fontFamily: brand.fontBody,
    fontSize: 28,
    color: brand.text,
    padding: '16px 22px',
    borderRadius: 12,
    maxWidth: 420,
    lineHeight: 1.5,
  };

  return (
    <AbsoluteFill style={{ opacity: sectionOpacity }}>
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: brand.fontBody,
          fontSize: 44,
          color: brand.textMuted,
          opacity: labelOpacity,
        }}
      >
        {'\u00BF'}Y si solo mand{'\u00E1'}s un mensaje?
      </div>

      {/* Sent bubble */}
      <div
        style={{
          position: 'absolute',
          top: 620,
          right: 120,
          transform: `scale(${sentScale})`,
          opacity: sentOpacity,
          transformOrigin: 'bottom right',
        }}
      >
        <div style={{ ...bubbleBase, backgroundColor: brand.waSent, borderBottomRightRadius: 2 }}>
          <div>gast{'\u00E9'} 150 en pizza con Juan</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>18:42</span>
            <span style={{ fontSize: 15, color: '#53BDEB' }}>{'\u2713\u2713'}</span>
          </div>
        </div>
      </div>

      {/* Received bubble */}
      <div
        style={{
          position: 'absolute',
          top: 760,
          left: 120,
          transform: `translateX(${receivedX}px)`,
          opacity: receivedOpacity,
        }}
      >
        <div style={{ ...bubbleBase, backgroundColor: brand.waReceived, borderBottomLeftRadius: 2 }}>
          <div>{'\u2713'} Registrado. Todos saben cu{'\u00E1'}nto deben.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>18:42</span>
          </div>
        </div>
      </div>

      {/* Green badge */}
      <div
        style={{
          position: 'absolute',
          top: 1060,
          left: '50%',
          transform: `translateX(-50%) scale(${badgeScale})`,
          opacity: badgeOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(74, 222, 128, 0.12)',
            border: `2px solid ${brand.accentGreen}`,
            color: brand.accentGreen,
            fontFamily: brand.fontBody,
            fontWeight: 700,
            fontSize: 28,
            padding: '16px 48px',
            borderRadius: 50,
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>{'\u2714'}</span>
          0 tickets perdidos
        </div>
      </div>
    </AbsoluteFill>
  );
};
