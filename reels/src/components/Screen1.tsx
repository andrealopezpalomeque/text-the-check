import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneMockup } from './PhoneMockup';
import { WaBubble } from './WaBubble';

const PHONE_LEFT = (brand.videoWidth - brand.phoneW) / 2;
const PHONE_TOP = brand.phonePaddingTop;
const LABEL_TOP = PHONE_TOP + brand.phoneH + 54;

export const Screen1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides up from below
  const slideProgress = spring({ frame, fps, config: { stiffness: 110, damping: 16 } });
  const translateY = interpolate(slideProgress, [0, 1], [880, 0]);

  // Label fades in once phone is settling
  const labelOpacity = interpolate(frame, [28, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(frame, [28, 48], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const globalOpacity = interpolate(frame, [70, 89], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: globalOpacity }}>
      {/* Subtle glow behind phone */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT - 80,
          top: PHONE_TOP + translateY - 80,
          width: brand.phoneW + 160,
          height: brand.phoneH + 160,
          background: `radial-gradient(ellipse at center, ${brand.primaryBlue}10 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT,
          top: PHONE_TOP + translateY,
        }}
      >
        <PhoneMockup>
          <WaBubble type="sent" time="18:42">
            gasté 150 en pizza con Juan
          </WaBubble>
        </PhoneMockup>
      </div>

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: LABEL_TOP,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: brand.fontHeading,
            fontWeight: 700,
            fontSize: 58,
            color: brand.text,
            letterSpacing: 0.5,
          }}
        >
          Mandá un mensaje
        </span>
        <div
          style={{
            width: 52,
            height: 3,
            background: brand.primaryBlue,
            borderRadius: 2,
            opacity: 0.6,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
