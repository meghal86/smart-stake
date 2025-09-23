import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export function useIsMobile() {
  const { width } = useWindowSize();
  return width < 640;
}

export function useIsTablet() {
  const { width } = useWindowSize();
  return width >= 640 && width < 1024;
}

export function useIsDesktop() {
  const { width } = useWindowSize();
  return width >= 1024;
}