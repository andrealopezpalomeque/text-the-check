import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, interpolate } from 'remotion';
import { brand } from './brand';
import { IntroSlide } from './components/IntroSlide';
import { OutroSlide } from './components/OutroSlide';
import { Screen1 } from './components/Screen1';
import { Screen2 } from './components/Screen2';
import { Screen3 } from './components/Screen3';
import { Screen4 } from './components/Screen4';

// ============================================================
// SHOWREEL TIMELINE — 18 seconds at 30fps = 540 frames
//   0–89    Intro       — receipt icon + wordmark + tagline
//  90–179   Screen 1    — "Mandá un mensaje"  (slide up)
// 180–269   Screen 2    — "La IA lo entiende" (scale up)
// 270–359   Screen 3    — "Balance al instante" (slide right)
// 360–449   Screen 4    — "Texto, audio o foto" (fade + rotate)
// 450–539   Outro       — CTA + handle
// ============================================================

const SECTION = 90;

const useFonts = (): boolean => {
  const [loaded, setLoaded] = useState(false);
  const [handle] = useState(() => delayRender('Loading Google Fonts'));

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = brand.googleFontsUrl;
    document.head.appendChild(link);

    document.fonts.ready.then(() => {
      setLoaded(true);
      continueRender(handle);
    });
  }, [handle]);

  return loaded;
};

export const Showreel: React.FC = () => {
  useFonts();

  return (
    <AbsoluteFill
      style={{
        background: brand.bgDark,
      }}
    >
      {/* === AUDIO LAYERS === */}

      {/* Background music — full duration, low volume with fade in/out */}
      <Audio
        src={staticFile('audio/bgmusic.mp3')}
        volume={(f: number) => {
          const fadeIn = interpolate(f, [0, 30], [0, 0.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fadeOut = interpolate(f, [510, 539], [0.2, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return Math.min(fadeIn, fadeOut);
        }}
      />

      {/* Intro — chime on receipt icon bounce */}
      <Sequence from={2} durationInFrames={30}>
        <Audio src={staticFile('audio/chime.mp3')} volume={0.45} />
      </Sequence>

      {/* Screen 1 (frame 90) — whoosh on phone slide up */}
      <Sequence from={90} durationInFrames={30}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>
      {/* Screen 1 label click (frame ~118) */}
      <Sequence from={118} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Screen 2 (frame 180) — whoosh on phone scale up */}
      <Sequence from={180} durationInFrames={30}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>
      {/* Screen 2 label click (frame ~208) */}
      <Sequence from={208} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Screen 3 (frame 270) — whoosh on phone slide from right */}
      <Sequence from={270} durationInFrames={30}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>
      {/* Screen 3 label click (frame ~298) */}
      <Sequence from={298} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Screen 4 (frame 360) — softer whoosh on phone rotate in */}
      <Sequence from={360} durationInFrames={30}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.3} />
      </Sequence>
      {/* Screen 4 label click (frame ~390) */}
      <Sequence from={390} durationInFrames={8}>
        <Audio src={staticFile('audio/keyclick.mp3')} volume={0.5} />
      </Sequence>

      {/* Outro (frame 450) — chime on logo reveal */}
      <Sequence from={452} durationInFrames={30}>
        <Audio src={staticFile('audio/chime.mp3')} volume={0.5} />
      </Sequence>

      {/* === VISUAL LAYERS === */}

      <Sequence from={0} durationInFrames={SECTION}>
        <IntroSlide />
      </Sequence>

      <Sequence from={SECTION * 1} durationInFrames={SECTION}>
        <Screen1 />
      </Sequence>

      <Sequence from={SECTION * 2} durationInFrames={SECTION}>
        <Screen2 />
      </Sequence>

      <Sequence from={SECTION * 3} durationInFrames={SECTION}>
        <Screen3 />
      </Sequence>

      <Sequence from={SECTION * 4} durationInFrames={SECTION}>
        <Screen4 />
      </Sequence>

      <Sequence from={SECTION * 5} durationInFrames={SECTION}>
        <OutroSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
