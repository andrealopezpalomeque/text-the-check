import { continueRender, delayRender } from 'remotion';
import { useEffect, useState } from 'react';
import { brand } from './brand';

export const useFonts = (): boolean => {
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
