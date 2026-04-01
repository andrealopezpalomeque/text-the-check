import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneMockup } from './PhoneMockup';
import { WaBubble } from './WaBubble';

const PHONE_LEFT = (brand.videoWidth - brand.phoneW) / 2;
const PHONE_TOP = brand.phonePaddingTop;
const LABEL_TOP = PHONE_TOP + brand.phoneH + 54;

const BalanceCard: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {/* Group title */}
    <div
      style={{
        fontFamily: brand.fontBody,
        fontWeight: 600,
        fontSize: 20,
        color: brand.text,
        marginBottom: 10,
        paddingBottom: 9,
        borderBottom: `1px solid ${brand.border}`,
      }}
    >
      Brasil 2026
    </div>

    {/* Balance rows */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
      {[
        { name: 'Vos', amount: '+$12.400', positive: true },
        { name: 'Gonza', amount: '-$6.200', positive: false },
        { name: 'Mati', amount: '-$4.800', positive: false },
        { name: 'Sofi', amount: '-$1.400', positive: false },
      ].map(({ name, amount, positive }) => (
        <div
          key={name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: brand.text,
              fontFamily: brand.fontBody,
              fontSize: 19,
            }}
          >
            {name}
          </span>
          <span
            style={{
              color: positive ? brand.accentGreen : brand.dangerRed,
              fontFamily: brand.fontMono,
              fontSize: 19,
              fontWeight: 500,
            }}
          >
            {amount}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const Screen3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides in from right
  const slideProgress = spring({ frame, fps, config: { stiffness: 110, damping: 16 } });
  const translateX = interpolate(slideProgress, [0, 1], [900, 0]);

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
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT - 80,
          top: PHONE_TOP - 80,
          width: brand.phoneW + 160,
          height: brand.phoneH + 160,
          background: `radial-gradient(ellipse at center, ${brand.accentGreen}08 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT + translateX,
          top: PHONE_TOP,
        }}
      >
        <PhoneMockup>
          <WaBubble type="sent" time="19:05">
            /balance
          </WaBubble>
          <WaBubble type="received" time="19:05" showTick={false}>
            <BalanceCard />
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
          Balance al instante
        </span>
        <div
          style={{
            width: 52,
            height: 3,
            background: brand.accentGreen,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
