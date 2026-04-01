import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ReceiptSVG } from './ReceiptSVG';

// Pyramid layout — wide at the bottom, narrowing toward the top.
// Sits in the lower 60% of the 1920px viewport (y range ~770–1550).
//
// Row 0 (bottom): 7 receipts, ~500px spread, scale 1.0–1.1, rotation ±8°
// Row 1:          5 receipts, ~350px spread, scale 0.9–0.95, rotation ±12°
// Row 2:          4 receipts, ~220px spread, scale 0.85–0.9, rotation ±15°
// Row 3 (top):    3 receipts, ~120px spread, scale 0.7–0.8, rotation ±20°

const ROWS: { count: number; centerY: number; spreadX: number; scaleMin: number; scaleMax: number; maxRot: number }[] = [
  { count: 7, centerY: 1500, spreadX: 500, scaleMin: 1.0, scaleMax: 1.1, maxRot: 8 },
  { count: 5, centerY: 1300, spreadX: 350, scaleMin: 0.9, scaleMax: 0.95, maxRot: 12 },
  { count: 4, centerY: 1100, spreadX: 220, scaleMin: 0.85, scaleMax: 0.9, maxRot: 15 },
  { count: 3, centerY: 920,  spreadX: 120, scaleMin: 0.7, scaleMax: 0.8, maxRot: 20 },
];

type ReceiptData = {
  index: number;
  rotation: number;
  xOffset: number;
  scale: number;
  variant: 0 | 1 | 2 | 3;
  opacity: number;
  startFrame: number;
  targetY: number;
};

const generateReceipts = (): ReceiptData[] => {
  const receipts: ReceiptData[] = [];
  let globalIndex = 0;

  for (let row = 0; row < ROWS.length; row++) {
    const { count, centerY, spreadX, scaleMin, scaleMax, maxRot } = ROWS[row];

    for (let col = 0; col < count; col++) {
      const i = globalIndex;

      // Distribute evenly across the row's spread
      const baseX = count === 1
        ? 0
        : ((col / (count - 1)) - 0.5) * spreadX;

      // Deterministic jitter
      const jitterX = Math.sin(i * 7.3) * 20;
      const jitterY = Math.cos(i * 4.1) * 15;
      const rotation = Math.sin(i * 4.7) * maxRot;

      // Scale varies within the row's range
      const scaleFrac = count === 1 ? 0.5 : col / (count - 1);
      const scale = scaleMin + (Math.sin(i * 3.7) + 1) * 0.5 * (scaleMax - scaleMin);

      const variant = (i % 4) as 0 | 1 | 2 | 3;

      // Bottom rows slightly more transparent (further away), top rows opaque
      const depthFactor = row / (ROWS.length - 1);
      const opacity = 0.55 + depthFactor * 0.45;

      // Stagger: 7 frames apart, bottom row lands first
      const startFrame = i * 7;

      receipts.push({
        index: i,
        rotation,
        xOffset: baseX + jitterX,
        scale,
        variant,
        opacity,
        startFrame,
        targetY: centerY + jitterY,
      });

      globalIndex++;
    }
  }

  // Extra chaotic receipts during the accelerated phase (frame 180+).
  // These fill gaps and heighten the overwhelm feeling.
  const extras: { xOffset: number; targetY: number; rotation: number; scale: number }[] = [
    { xOffset: -220, targetY: 1550, rotation: -14, scale: 1.05 },
    { xOffset: 230,  targetY: 1420, rotation: 18,  scale: 0.95 },
    { xOffset: -40,  targetY: 980,  rotation: -22, scale: 0.75 },
    { xOffset: 100,  targetY: 1200, rotation: 12,  scale: 0.88 },
  ];

  for (let e = 0; e < extras.length; e++) {
    const i = globalIndex;
    receipts.push({
      index: i,
      rotation: extras[e].rotation,
      xOffset: extras[e].xOffset,
      scale: extras[e].scale,
      variant: (i % 4) as 0 | 1 | 2 | 3,
      opacity: 0.7,
      startFrame: 140 + e * 6,
      targetY: extras[e].targetY,
    });
    globalIndex++;
  }

  return receipts;
};

const receipts = generateReceipts();

export const ReceiptPile: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shake animation during overwhelm (frames 240-310)
  const shakeX = frame >= 240 && frame <= 310
    ? Math.sin(frame * 1.8) * interpolate(frame, [240, 250, 300, 310], [0, 8, 8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  // Exit: all receipts scatter at frame 300
  const exitProgress = interpolate(frame, [300, 330], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(frame, [300, 325], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeX}px)` }}>
      {receipts.map((r) => {
        const dropSpring = spring({
          frame: frame - r.startFrame,
          fps,
          config: { damping: 12, stiffness: 80, mass: 0.8 },
        });

        const y = interpolate(dropSpring, [0, 1], [-300, r.targetY]);
        const currentRotation = r.rotation + exitProgress * (Math.sin(r.index * 5.1) * 45);

        // Exit scatter directions
        const exitX = Math.cos(r.index * 2.3) * 1200 * exitProgress;
        const exitY = Math.sin(r.index * 1.7) * -800 * exitProgress;

        const currentOpacity = frame < r.startFrame ? 0 : r.opacity * exitOpacity;

        if (currentOpacity <= 0) return null;

        return (
          <div
            key={r.index}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: `translate(${-60 + r.xOffset + exitX}px, ${y + exitY}px) rotate(${currentRotation}deg) scale(${r.scale})`,
              opacity: currentOpacity,
              zIndex: r.index,
            }}
          >
            <ReceiptSVG width={120} variant={r.variant} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
