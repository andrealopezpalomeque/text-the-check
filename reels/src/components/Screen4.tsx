import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneMockup } from './PhoneMockup';
import { WaBubble } from './WaBubble';

const PHONE_LEFT = (brand.videoWidth - brand.phoneW) / 2;
const PHONE_TOP = brand.phonePaddingTop;
const LABEL_TOP = PHONE_TOP + brand.phoneH + 54;

const CameraIcon: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <rect x="2" y="7" width="30" height="22" rx="4" stroke="#4A5A68" strokeWidth="2" />
    <circle cx="17" cy="18" r="6" stroke="#4A5A68" strokeWidth="2" />
    <rect x="12" y="4" width="10" height="5" rx="2" stroke="#4A5A68" strokeWidth="1.5" />
  </svg>
);

const PhotoBubble: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {/* Photo placeholder */}
    <div
      style={{
        width: 300,
        height: 190,
        background: '#1A2835',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${brand.border}`,
      }}
    >
      <CameraIcon />
    </div>
    <span style={{ color: brand.text, fontFamily: brand.fontBody, fontSize: 20 }}>
      acá va el ticket
    </span>
  </div>
);

export const Screen4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone fades in with slight rotation correction
  const progress = spring({ frame, fps, config: { stiffness: 120, damping: 22 } });
  const phoneOpacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotate = interpolate(progress, [0, 1], [-8, 0]);
  const translateY = interpolate(progress, [0, 1], [40, 0]);

  const labelOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const globalOpacity = interpolate(frame, [70, 89], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: globalOpacity }}>
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT - 80,
          top: PHONE_TOP - 80,
          width: brand.phoneW + 160,
          height: brand.phoneH + 160,
          background: `radial-gradient(ellipse at center, ${brand.primaryLight}0D 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT,
          top: PHONE_TOP + translateY,
          opacity: phoneOpacity,
          transform: `rotate(${rotate}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <PhoneMockup>
          <WaBubble type="sent" time="21:15">
            <PhotoBubble />
          </WaBubble>
          <WaBubble type="received" time="21:15" showTick={false}>
            {'Encontré un gasto de $8.000 — Birra.\n¿Correcto?'}
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
          Texto, audio o foto
        </span>
        <div
          style={{
            width: 52,
            height: 3,
            background: brand.primaryLight,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
