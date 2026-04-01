import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneMockup } from './PhoneMockup';
import { WaBubble } from './WaBubble';

const PHONE_LEFT = (brand.videoWidth - brand.phoneW) / 2;
const PHONE_TOP = brand.phonePaddingTop;
const LABEL_TOP = PHONE_TOP + brand.phoneH + 54;

const ConfirmCard: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    <span
      style={{
        color: brand.textMuted,
        fontFamily: brand.fontBody,
        fontSize: 18,
        marginBottom: 10,
      }}
    >
      Entendido. Registré esto:
    </span>

    {/* Data card */}
    <div
      style={{
        background: 'rgba(11,20,26,0.7)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        borderLeft: `4px solid ${brand.primaryBlue}`,
      }}
    >
      {[
        { label: 'Monto', value: '$150' },
        { label: 'Descripción', value: 'Pizza' },
        { label: 'Pagó', value: 'Vos' },
        { label: 'Dividido con', value: 'Juan' },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span
            style={{
              color: brand.textMuted,
              fontFamily: brand.fontMono,
              fontSize: 17,
            }}
          >
            {label}
          </span>
          <span
            style={{
              color: brand.text,
              fontFamily: brand.fontMono,
              fontSize: 17,
              fontWeight: 500,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>

    {/* Confirm row */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
      }}
    >
      <span
        style={{
          color: brand.text,
          fontFamily: brand.fontBody,
          fontSize: 18,
          flex: 1,
        }}
      >
        ¿Confirmo?
      </span>
      <button
        style={{
          background: brand.primaryBlue,
          border: 'none',
          borderRadius: 18,
          padding: '7px 20px',
          color: '#fff',
          fontFamily: brand.fontBody,
          fontSize: 17,
          fontWeight: 600,
          cursor: 'default',
        }}
      >
        Sí
      </button>
      <button
        style={{
          background: 'transparent',
          border: `1px solid ${brand.border}`,
          borderRadius: 18,
          padding: '7px 20px',
          color: brand.textMuted,
          fontFamily: brand.fontBody,
          fontSize: 17,
          cursor: 'default',
        }}
      >
        No
      </button>
    </div>
  </div>
);

export const Screen2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone scales up from center
  const scaleProgress = spring({ frame, fps, config: { stiffness: 160, damping: 20 } });
  const scale = interpolate(scaleProgress, [0, 1], [0.08, 1]);
  const scaleOpacity = interpolate(scaleProgress, [0, 0.15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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

  const phoneCenterX = PHONE_LEFT + brand.phoneW / 2;
  const phoneCenterY = PHONE_TOP + brand.phoneH / 2;

  return (
    <AbsoluteFill style={{ opacity: globalOpacity }}>
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT - 100,
          top: PHONE_TOP - 100,
          width: brand.phoneW + 200,
          height: brand.phoneH + 200,
          background: `radial-gradient(ellipse at center, ${brand.primaryBlue}12 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Phone — scale from its own center */}
      <div
        style={{
          position: 'absolute',
          left: PHONE_LEFT,
          top: PHONE_TOP,
          transform: `scale(${scale})`,
          transformOrigin: `${phoneCenterX - PHONE_LEFT}px ${phoneCenterY - PHONE_TOP}px`,
          opacity: scaleOpacity,
        }}
      >
        <PhoneMockup>
          <WaBubble type="sent" time="18:42">
            gasté 150 en pizza con Juan
          </WaBubble>
          <WaBubble type="received" time="18:42" showTick={false}>
            <ConfirmCard />
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
          La IA lo entiende
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
