import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import { SearchBar } from './components/search/SearchBar';
import { FeatureCards } from './components/search/FeatureCards';
import { SearchOutro } from './components/search/SearchOutro';

export const SearchReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === GLOBAL CAMERA ZOOM ===
  // Section 1 (0-149): slow zoom in 1.0 → 1.06 while typing, then quick zoom out on exit
  const sec1Zoom = interpolate(frame, [0, 110, 135, 149], [1.0, 1.06, 1.12, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Section 2 (120-370): zoom in on each card, subtle breathe
  const sec2Zoom = interpolate(
    frame,
    [120, 140, 190, 210, 240, 260, 340, 370],
    [1.0, 1.04, 1.0, 1.04, 1.0, 1.03, 1.0, 0.96],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Section 3 (360-449): punch zoom in then settle
  const sec3Zoom = frame >= 360
    ? spring({
        frame: frame - 360,
        fps,
        from: 0.85,
        to: 1.0,
        config: { damping: 10, stiffness: 80, mass: 1.0 },
      })
    : 1.0;

  // Pick the active zoom based on which section we're in
  let globalZoom = 1.0;
  if (frame < 150) {
    globalZoom = sec1Zoom;
  } else if (frame < 360) {
    globalZoom = sec2Zoom;
  } else {
    globalZoom = sec3Zoom;
  }

  // === BACKGROUND COLOR TRANSITION ===
  const bgTransition = interpolate(frame, [345, 370], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const r = Math.round(interpolate(bgTransition, [0, 1], [248, 12]));
  const g = Math.round(interpolate(bgTransition, [0, 1], [250, 16]));
  const b = Math.round(interpolate(bgTransition, [0, 1], [251, 23]));
  const bgColor = `rgb(${r},${g},${b})`;

  // === BACKGROUND MUSIC VOLUME ===
  const bgMusicVolume = (f: number) => {
    // Fade in over first 30 frames, fade out over last 30 frames
    const fadeIn = interpolate(f, [0, 30], [0, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(f, [420, 449], [0.25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  };

  // === TYPING SOUND VOLUME — louder during active typing (frames 15-95) ===
  const typingVolume = (f: number) => {
    if (f < 5) return 0;
    const fadeIn = interpolate(f, [5, 15], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(f, [50, 65], [0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, overflow: 'hidden' }}>
      {/* === AUDIO LAYERS === */}

      {/* Background music — full duration, low volume */}
      <Audio src={staticFile('audio/bgmusic.mp3')} volume={bgMusicVolume} startFrom={0} />

      {/* Typing sound — one click per character (17 chars, 1 every 2.5 frames, starting frame 15) */}
      {Array.from({ length: 17 }, (_, i) => {
        const charFrame = 15 + Math.round(i * 2.5);
        return (
          <Sequence key={i} from={charFrame} durationInFrames={8}>
            <Audio src={staticFile('audio/keyclick.mp3')} volume={0.6} />
          </Sequence>
        );
      })}

      {/* Whoosh on search bar exit / cards entrance */}
      <Sequence from={130} durationInFrames={45}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.5} />
      </Sequence>

      {/* Whoosh on cards exit / outro entrance */}
      <Sequence from={348} durationInFrames={45}>
        <Audio src={staticFile('audio/whoosh.mp3')} volume={0.4} />
      </Sequence>

      {/* Chime on outro */}
      <Sequence from={370} durationInFrames={79}>
        <Audio src={staticFile('audio/chime.mp3')} volume={0.6} />
      </Sequence>

      {/* === VISUAL LAYERS with global zoom === */}
      <AbsoluteFill
        style={{
          transform: `scale(${globalZoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Section 1: Search Bar (frames 0-149) */}
        <Sequence from={0} durationInFrames={150}>
          <SearchBar />
        </Sequence>

        {/* Section 2: Feature Cards (frames 120-370) */}
        <Sequence from={120} durationInFrames={250}>
          <FeatureCards />
        </Sequence>

        {/* Section 3: Outro (frames 360-449) */}
        <Sequence from={360} durationInFrames={90}>
          <SearchOutro />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
