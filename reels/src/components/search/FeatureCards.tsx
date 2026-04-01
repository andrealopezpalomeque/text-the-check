import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { brand } from '../../brand';

interface CardData {
  number: string;
  title: string;
  description: string;
  accentColor: string;
  icon: React.ReactNode;
}

const ChatIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BrainIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 0-4 4c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2 4 4 0 0 0-4-4z" />
    <path d="M8.5 8A6.5 6.5 0 0 0 2 14.5 6.5 6.5 0 0 0 8.5 21h7a6.5 6.5 0 0 0 6.5-6.5A6.5 6.5 0 0 0 15.5 8h-7z" />
    <path d="M12 12v4" />
    <path d="M9 16h6" />
  </svg>
);

const DollarIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const cards: CardData[] = [
  {
    number: '01',
    title: 'Mand\u00e1 un mensaje',
    description: 'Escribile al bot por WhatsApp lo que gastaste. Texto, audio o foto.',
    accentColor: '#3B7DD8',
    icon: <ChatIcon color="#3B7DD8" />,
  },
  {
    number: '02',
    title: 'La IA lo entiende',
    description: 'Entiende lunfardo, montos en lucas, y fotos de tickets.',
    accentColor: '#A78BFA',
    icon: <BrainIcon color="#A78BFA" />,
  },
  {
    number: '03',
    title: 'Todos saben cu\u00e1nto deben',
    description: 'Balances autom\u00e1ticos. Chau discusiones.',
    accentColor: '#4ADE80',
    icon: <DollarIcon color="#4ADE80" />,
  },
];

const FeatureCard: React.FC<{
  card: CardData;
  index: number;
  frame: number;
  fps: number;
  totalCards: number;
}> = ({ card, index, frame, fps, totalCards }) => {
  const enterDelay = index * 20; // 20 frames stagger
  const localFrame = frame - enterDelay;

  // === ENTRANCE: fan in from side with rotation, then settle ===
  // Cards come from alternating sides
  const side = index % 2 === 0 ? -1 : 1;

  const slideX = spring({
    frame: Math.max(0, localFrame),
    fps,
    from: side * 300,
    to: 0,
    config: { damping: 13, stiffness: 90, mass: 0.9 },
  });

  const slideY = spring({
    frame: Math.max(0, localFrame),
    fps,
    from: 150,
    to: 0,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  const rotation = spring({
    frame: Math.max(0, localFrame),
    fps,
    from: side * 12,
    to: 0,
    config: { damping: 12, stiffness: 80, mass: 1.0 },
  });

  const scaleIn = spring({
    frame: Math.max(0, localFrame),
    fps,
    from: 0.6,
    to: 1,
    config: { damping: 11, stiffness: 100, mass: 0.8 },
  });

  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === SUBTLE HOVER/BREATHE after settling — each card pulses slightly ===
  const settledFrame = Math.max(0, localFrame - 30);
  const breathe = Math.sin(settledFrame * 0.08) * 0.012;
  const breatheScale = localFrame > 30 ? 1 + breathe : 1;

  // === ACCENT BAR glow that fades in after card settles ===
  const glowOpacity = interpolate(localFrame, [25, 45], [0, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === EXIT: all cards zoom out + rotate slightly + fade ===
  const exitOpacity = interpolate(frame, [225, 248], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [225, 248], [1, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitRotation = interpolate(frame, [225, 248], [0, side * -8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitY = interpolate(frame, [225, 248], [0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        transform: `translateX(${slideX}px) translateY(${slideY + exitY}px) rotate(${rotation + exitRotation}deg) scale(${scaleIn * breatheScale * exitScale})`,
        opacity: opacity * exitOpacity,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: '32px 36px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.07), 0 0 20px ${card.accentColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`,
        width: '85%',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar on left edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: card.accentColor,
          borderRadius: '20px 0 0 20px',
          opacity: interpolate(localFrame, [10, 25], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />

      {/* Icon + Number */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          minWidth: 60,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            backgroundColor: `${card.accentColor}18`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {card.icon}
        </div>
        <span
          style={{
            fontFamily: brand.fontHeading,
            fontWeight: 800,
            fontSize: 22,
            color: card.accentColor,
          }}
        >
          {card.number}
        </span>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: brand.fontHeading,
            fontWeight: 700,
            fontSize: 32,
            color: '#1A2030',
            marginBottom: 8,
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            fontFamily: brand.fontBody,
            fontWeight: 400,
            fontSize: 24,
            color: '#5A6B80',
            lineHeight: 1.4,
          }}
        >
          {card.description}
        </div>
      </div>
    </div>
  );
};

export const FeatureCards: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === SECTION TITLE that appears before cards ===
  const titleOpacity = interpolate(frame, [0, 12, 35, 50], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleScale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 14, stiffness: 120, mass: 0.7 },
  });
  const titleY = interpolate(frame, [35, 50], [0, -40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Cards start appearing at frame 30 (relative to this section)
  const cardsFrame = Math.max(0, frame - 30);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFB',
      }}
    >
      {/* Section title: "Cómo funciona" */}
      {frame < 55 && (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            fontFamily: brand.fontHeading,
            fontWeight: 800,
            fontSize: 52,
            color: '#1A2030',
            opacity: titleOpacity,
            transform: `scale(${titleScale}) translateY(${titleY}px)`,
            letterSpacing: -0.5,
          }}
        >
          {'\u00bfC\u00f3mo funciona?'}
        </div>
      )}

      {/* Cards container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          alignItems: 'center',
          width: '100%',
          paddingTop: 200,
          paddingBottom: 160,
        }}
      >
        {cards.map((card, i) => (
          <FeatureCard
            key={card.number}
            card={card}
            index={i}
            frame={cardsFrame}
            fps={fps}
            totalCards={cards.length}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
