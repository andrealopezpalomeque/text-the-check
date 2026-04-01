import React from 'react';
import { brand } from '../brand';

interface WaBubbleProps {
  type: 'sent' | 'received';
  time: string;
  children: React.ReactNode;
  showTick?: boolean;
}

const DoubleCheck: React.FC = () => (
  <svg width="22" height="14" viewBox="0 0 18 11" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 5.5L4 8.5L9 2.5" stroke={brand.primaryLight} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 5.5L8.5 8.5L13.5 2.5" stroke={brand.primaryLight} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WaBubble: React.FC<WaBubbleProps> = ({
  type,
  time,
  children,
  showTick = true,
}) => {
  const isSent = type === 'sent';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isSent ? 'flex-end' : 'flex-start',
        width: '100%',
        paddingLeft: isSent ? 60 : 0,
        paddingRight: isSent ? 0 : 60,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: isSent ? brand.waSent : brand.waReceived,
          borderRadius: isSent ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          padding: '12px 14px 8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            color: brand.text,
            fontSize: 22,
            fontFamily: brand.fontBody,
            fontWeight: 400,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
          }}
        >
          {children}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginTop: 5,
          }}
        >
          <span
            style={{
              color: brand.textMuted,
              fontSize: 15,
              fontFamily: brand.fontBody,
              lineHeight: 1,
            }}
          >
            {time}
          </span>
          {isSent && showTick && <DoubleCheck />}
        </div>
      </div>
    </div>
  );
};
