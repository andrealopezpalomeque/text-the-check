import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../../brand';

export const OverwhelmMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text: "Otra vez perdiste un ticket?" — frames 250-290
  const textOpacity = interpolate(frame, [250, 265, 285, 295], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [250, 265], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Red X flash — frames 290-310
  const xScale = spring({
    frame: frame - 290,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
  });
  const xOpacity = interpolate(frame, [290, 292, 300, 310], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Frustration text */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: brand.fontHeading,
          fontWeight: 700,
          fontSize: 56,
          color: '#1A2030',
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {'\u00BF'}Otra vez perdiste un ticket?
      </div>

      {/* Red X */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${xScale})`,
          opacity: xOpacity,
          fontSize: 120,
          fontWeight: 900,
          color: brand.dangerRed,
          lineHeight: 1,
          zIndex: 100,
        }}
      >
        {'\u2715'}
      </div>
    </AbsoluteFill>
  );
};
