import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<void>;
}

export function useWakeLock(enabled: boolean = true): UseWakeLockReturn {
  const [isSupported] = useState<boolean>(() => typeof window !== 'undefined' && 'wakeLock' in navigator);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef<boolean>(enabled);

  useEffect(() => {
    shouldBeActiveRef.current = enabled;
  }, [enabled]);

  const releaseWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn('Error releasing wake lock:', err);
      } finally {
        sentinelRef.current = null;
        setIsActive(false);
      }
    }
  }, []);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      // Don't request if already holding an active lock
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsActive(true);
        return true;
      }

      const lock = await navigator.wakeLock.request('screen');
      sentinelRef.current = lock;
      setIsActive(true);
      setError(null);

      lock.addEventListener('release', () => {
        setIsActive(false);
        sentinelRef.current = null;
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wake lock request failed';
      console.warn('Wake Lock request rejected:', message);
      setError(message);
      setIsActive(false);
      return false;
    }
  }, []);

  // Handle visibility change: browsers automatically release screen wake locks when switching tabs
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current && isSupported) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, requestWakeLock]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}
