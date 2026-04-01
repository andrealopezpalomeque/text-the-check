import React from 'react';

type ReceiptSVGProps = {
  width?: number;
  opacity?: number;
  rotation?: number;
  variant?: 0 | 1 | 2 | 3;
  fill?: string;
  stroke?: string;
  lineColor?: string;
};

export const ReceiptSVG: React.FC<ReceiptSVGProps> = ({
  width = 90,
  opacity = 1,
  rotation = 0,
  variant = 0,
  fill = '#FFFFFF',
  stroke = '#94A3B8',
  lineColor = '#94A3B8',
}) => {
  const aspectRatio = 140 / 100;
  const height = width * aspectRatio;

  const renderLines = () => {
    switch (variant) {
      case 1:
        return (
          <>
            <line x1="30" y1="50" x2="55" y2="50" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="65" x2="50" y2="65" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="80" x2="45" y2="80" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <text x="55" y="95" fontFamily="DM Sans, sans-serif" fontSize="14" fill={lineColor} fontWeight="600">$</text>
            <line x1="62" y1="92" x2="75" y2="92" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 2:
        return (
          <>
            <line x1="30" y1="50" x2="70" y2="50" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="67" x2="65" y2="67" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <rect x="40" y="82" width="30" height="16" rx="2" stroke={lineColor} fill="none" strokeWidth="2" />
            <line x1="45" y1="90" x2="65" y2="90" stroke={lineColor} strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 3:
        return (
          <>
            <line x1="30" y1="50" x2="75" y2="50" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="68" x2="58" y2="68" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="86" x2="48" y2="86" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <line x1="30" y1="50" x2="70" y2="50" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="70" x2="70" y2="70" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="90" x2="70" y2="90" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 140"
      style={{ opacity, transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M 20 20 l 10 -5 l 10 5 l 10 -5 l 10 5 l 10 -5 l 10 5 C 75 55, 85 85, 80 120 l -10 5 l -10 -5 l -10 5 l -10 -5 l -10 5 l -10 -5 C 25 85, 15 55, 20 20 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      {renderLines()}
    </svg>
  );
};
