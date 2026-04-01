import React from 'react';

interface ReceiptIconProps {
  size?: number;
  bodyColor?: string;
  lineColor?: string;
}

export const ReceiptIcon: React.FC<ReceiptIconProps> = ({
  size = 60,
  bodyColor = '#E8ECF0',
  lineColor = '#3B7DD8',
}) => (
  <svg
    viewBox="0 0 100 140"
    width={size}
    height={size * 1.4}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <path
      d="M 20 20 l 10 -5 l 10 5 l 10 -5 l 10 5 l 10 -5 l 10 5 C 75 55, 85 85, 80 120 l -10 5 l -10 -5 l -10 5 l -10 -5 l -10 5 l -10 -5 C 25 85, 15 55, 20 20 Z"
      fill={bodyColor}
    />
    <line x1="29" y1="50" x2="71" y2="50" stroke={lineColor} strokeWidth="5.5" strokeLinecap="round" />
    <line x1="29" y1="70" x2="71" y2="70" stroke={lineColor} strokeWidth="5.5" strokeLinecap="round" />
    <line x1="29" y1="90" x2="58" y2="90" stroke={lineColor} strokeWidth="5.5" strokeLinecap="round" />
  </svg>
);
