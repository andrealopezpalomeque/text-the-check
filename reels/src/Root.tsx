import React from 'react';
import { Composition } from 'remotion';
import { Showreel } from './Showreel';
import { SearchReel } from './SearchReel';
import { ReceiptChaosReel } from './ReceiptChaosReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Showreel"
        component={Showreel}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SearchReel"
        component={SearchReel}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReceiptChaosReel"
        component={ReceiptChaosReel}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
