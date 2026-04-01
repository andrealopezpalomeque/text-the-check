import React from 'react';
import { brand } from '../brand';
import { ReceiptIcon } from './ReceiptIcon';

interface PhoneMockupProps {
  children: React.ReactNode;
}

const BackArrow: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <path d="M14 4L7 11L14 18" stroke={brand.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="6" width="13" height="10" rx="2" stroke={brand.text} strokeWidth="1.5" />
    <path d="M14 9l7-3v10l-7-3V9z" stroke={brand.text} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const PhoneCallIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M3 2h4l2 5-2.5 1.5a11 11 0 005 5L13 11l5 2v4a2 2 0 01-2 2A16 16 0 011 3a2 2 0 012-1z"
      stroke={brand.text}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const EmojiIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={brand.textMuted} strokeWidth="1.5" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={brand.textMuted} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="10" r="1.2" fill={brand.textMuted} />
    <circle cx="15" cy="10" r="1.2" fill={brand.textMuted} />
  </svg>
);

const MicIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="11" rx="3" stroke={brand.textMuted} strokeWidth="1.5" />
    <path d="M5 11a7 7 0 0014 0" stroke={brand.textMuted} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="22" stroke={brand.textMuted} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  const PHONE_W = brand.phoneW;   // 520
  const PHONE_H = brand.phoneH;   // 960
  const FRAME = 10;
  const SCREEN_W = PHONE_W - FRAME * 2;  // 500
  const SCREEN_H = PHONE_H - FRAME * 2;  // 940
  const SCREEN_RADIUS = 43;

  const NOTCH_H = 30;
  const HEADER_H = 92;
  const CHROME_H = HEADER_H - NOTCH_H; // 62
  const INPUT_H = 66;

  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 52,
        background: 'linear-gradient(165deg, #1A2B3C 0%, #0C1017 55%, #0E1520 100%)',
        boxShadow: [
          '0 0 0 1px #253040',
          '0 28px 70px rgba(0,0,0,0.75)',
          '0 0 80px rgba(59,125,216,0.07)',
          'inset 0 1px 0 rgba(255,255,255,0.04)',
        ].join(', '),
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Side buttons */}
      <div style={{ position: 'absolute', right: -2, top: 200, width: 2, height: 66, background: '#182230', borderRadius: '0 2px 2px 0' }} />
      <div style={{ position: 'absolute', left: -2, top: 165, width: 2, height: 44, background: '#182230', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -2, top: 225, width: 2, height: 44, background: '#182230', borderRadius: '2px 0 0 2px' }} />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          top: FRAME,
          left: FRAME,
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: SCREEN_RADIUS,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header zone ── */}
        <div
          style={{
            height: HEADER_H,
            background: brand.waHeader,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 132,
              height: NOTCH_H,
              background: '#080F15',
              borderRadius: '0 0 16px 16px',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#14202C' }} />
            <div style={{ width: 38, height: 5, borderRadius: 3, background: '#14202C' }} />
          </div>

          {/* WA Chrome row */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: CHROME_H,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 14,
              gap: 8,
            }}
          >
            <BackArrow />

            {/* Avatar */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                background: `linear-gradient(135deg, ${brand.primaryBlue} 0%, ${brand.primaryLight} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ReceiptIcon size={22} bodyColor="#FFFFFF" lineColor="#1A4A8A" />
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  color: brand.text,
                  fontFamily: brand.fontBody,
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                Text the Check
              </span>
              <span
                style={{
                  color: '#4FC870',
                  fontFamily: brand.fontBody,
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                en línea
              </span>
            </div>

            <VideoIcon />
            <div style={{ marginLeft: 6 }}>
              <PhoneCallIcon />
            </div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div
          style={{
            flex: 1,
            background: brand.waBg,
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 6,
            padding: '14px 10px',
          }}
        >
          {children}
        </div>

        {/* ── Input bar ── */}
        <div
          style={{
            height: INPUT_H,
            background: brand.waHeader,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 10,
            gap: 8,
          }}
        >
          <EmojiIcon />
          <div
            style={{
              flex: 1,
              height: 42,
              background: '#283A4A',
              borderRadius: 21,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 18,
            }}
          >
            <span
              style={{
                color: '#3D5060',
                fontFamily: brand.fontBody,
                fontSize: 15,
              }}
            >
              Mensaje
            </span>
          </div>
          <MicIcon />
        </div>
      </div>
    </div>
  );
};
