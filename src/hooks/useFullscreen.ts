import { useState, useEffect, useCallback } from 'react';

interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
}

interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  toggleFullscreen: () => Promise<void>;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(document.fullscreenElement || (document as WebkitDocument).webkitFullscreenElement);
  });
  const [isSupported] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as WebkitDocument;
    const docEl = document.documentElement as WebkitHTMLElement;
    return Boolean(
      doc.fullscreenEnabled ||
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen
    );
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateState = () => {
      const active = Boolean(document.fullscreenElement || (document as WebkitDocument).webkitFullscreenElement);
      setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', updateState);
    document.addEventListener('webkitfullscreenchange', updateState);

    return () => {
      document.removeEventListener('fullscreenchange', updateState);
      document.removeEventListener('webkitfullscreenchange', updateState);
    };
  }, []);

  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const docEl = document.documentElement as WebkitHTMLElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        return true;
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to enter fullscreen mode:', err);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const doc = document as WebkitDocument;
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to exit fullscreen mode:', err);
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
