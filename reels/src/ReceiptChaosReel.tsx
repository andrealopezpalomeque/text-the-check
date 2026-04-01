import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { brand } from './brand';
import { ReceiptPile } from './components/chaos/ReceiptPile';
import { OverwhelmMoment } from './components/chaos/OverwhelmMoment';
import { CleanSolution } from './components/chaos/CleanSolution';
import { ChaosOutro } from './components/chaos/ChaosOutro';

export const ReceiptChaosReel: React.FC = () => {
  const frame = useCurrentFrame();

  // Background transition: light → dark (frames 300-360)
  const darkOverlayOpacity = interpolate(frame, [300, 360], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Google Fonts */}
      <link rel="stylesheet" href={brand.googleFontsUrl} />

      {/* === AUDIO LAYERS === */}

      {/* Background music — full duration, low volume with fade in/out */}
      <Audio
        src={staticFile('audio/bgmusic.mp3')}
        volume={(f: number) => {
          const fadeIn = interpolate(f, [0, 30], [0, 0.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fadeOut = interpolate(f, [570, 599], [0.2, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return Math.min(fadeIn, fadeOut);
        }}
      />

      {/* Receipt drop sounds — keyclick on each receipt landing (first 10 receipts, then skip) */}
      {Array.from({ length: 10 }, (_, i) => {
        const landFrame = i * 12 + 8;
        return (
          <Sequence key={`drop-${i}`} from={landFrame} durationInFrames={8}>
            <Audio src={staticFile('audio/keyclick.mp3')} volume={0.3} />
          </Sequence>
        );
      })}

      {/* Accelerated drops — a few more clicks during the fast phase */}
      {Array.from({ length: 4 }, (_, i) => {
        const landFrame = 188 + i * 8;
        return (
          <Sequence key={`fast-drop-${i}`} from={landFrame} durationInFrames={8}>
            <Audio src={staticFile('audio/keyclick.mp3')} volume={0.4} />
          </Sequence>
        );
      })}

      {/* Whoosh on receipt scatter (Phase 3) */}
      <Sequence from={300} durationInFrames={45}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.5} />
      </Sequence>

      {/* Whoosh on WhatsApp bubbles entrance (Phase 4) */}
      <Sequence from={365} durationInFrames={45}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.35} />
      </Sequence>

      {/* Keyclick on sent bubble appear */}
      <Sequence from={375} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Keyclick on received bubble appear */}
      <Sequence from={405} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Chime on outro logo reveal */}
      <Sequence from={480} durationInFrames={30}>
        <Audio src={staticFile('audio/chime.mp3')} volume={0.5} />
      </Sequence>

      {/* === VISUAL LAYERS === */}

      {/* Light background (Phase 1-3) */}
      <AbsoluteFill style={{ backgroundColor: '#F8FAFB' }} />

      {/* Dark background overlay (fades in during Phase 3) */}
      <AbsoluteFill style={{ backgroundColor: brand.bgDark, opacity: darkOverlayOpacity }} />

      {/* Phase 1: Receipt pile (0-250) + Phase 2: Shake (240-310) + Phase 3: Scatter (300-360) */}
      {frame < 360 && <ReceiptPile />}

      {/* Phase 2: Overwhelm text + red X (240-310) */}
      {frame >= 240 && frame < 320 && <OverwhelmMoment />}

      {/* Phase 4: WhatsApp solution (340-500) */}
      {frame >= 340 && frame < 510 && <CleanSolution />}

      {/* Phase 5: Outro (470-599) */}
      {frame >= 470 && <ChaosOutro />}
    </AbsoluteFill>
  );
};
