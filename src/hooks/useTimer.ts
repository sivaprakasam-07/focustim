import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerMode, TimerState, UserPreferences } from '../types/timer';
import {
  getTimerCalculations,
  calculateElapsedMs,
} from '../utils/timerCalculations';
import {
  loadAndRecoverSession,
  saveSession,
  createInitialTimerState,
} from '../utils/storage';
import {
  playCompletionChime,
  triggerCompletionVibration,
} from '../utils/sound';
import { useWakeLock } from './useWakeLock';

export function useTimer() {
  // Load restored or default session
  const [session] = useState(() => loadAndRecoverSession());
  const [state, setState] = useState<TimerState>(session.state);
  const [preferences, setPreferences] = useState<UserPreferences>(session.preferences);
  const [now, setNow] = useState<number>(() => Date.now());

  // Wake lock integration
  const { isSupported: isWakeLockSupported, isActive: isWakeLockActive, requestWakeLock, releaseWakeLock } =
    useWakeLock(preferences.wakeLockPreferred && state.status === 'running');

  // Guard to ensure completion triggers exactly once per session
  const completedSessionsRef = useRef<Set<string>>(new Set());

  // Check if session expired while backgrounded before initial load
  useEffect(() => {
    if (session.wasExpiredInBackground && session.state.sessionId) {
      completedSessionsRef.current.add(session.state.sessionId);
    }
  }, [session.wasExpiredInBackground, session.state.sessionId]);

  // Request/release wake lock based on timer state and user preference
  useEffect(() => {
    if (state.status === 'running' && preferences.wakeLockPreferred) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [state.status, preferences.wakeLockPreferred, requestWakeLock, releaseWakeLock]);

  // Save session when state or preferences change
  useEffect(() => {
    saveSession(state, preferences);
  }, [state, preferences]);

  // Handle completion trigger
  const handleCompletion = useCallback((finishedState: TimerState) => {
    const sessionId = finishedState.sessionId;
    if (completedSessionsRef.current.has(sessionId)) {
      return;
    }
    completedSessionsRef.current.add(sessionId);

    setState((prev) => ({
      ...prev,
      status: 'completed',
      startTimestamp: null,
      pauseTimestamp: null,
      accumulatedElapsedMs: prev.targetDurationMs,
      completedAt: Date.now(),
    }));

    if (preferences.soundEnabled) {
      playCompletionChime();
    }
    if (preferences.vibrateEnabled) {
      triggerCompletionVibration();
    }
  }, [preferences.soundEnabled, preferences.vibrateEnabled]);

  // Main high-precision update loop via requestAnimationFrame when running
  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    let animationFrameId: number;
    let lastRenderTime = performance.now();

    const tick = (currentTime: number) => {
      // Throttle slightly to ~30-60fps for performance and battery conservation
      if (currentTime - lastRenderTime >= 30) {
        lastRenderTime = currentTime;
        const currentNow = Date.now();
        setNow(currentNow);

        // Check countdown completion
        if (state.mode === 'countdown') {
          const elapsed = calculateElapsedMs(state, currentNow);
          if (elapsed >= state.targetDurationMs) {
            handleCompletion(state);
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, handleCompletion]);

  // Handle tab visibility changes (app switching, screen locking, background throttling)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentNow = Date.now();
      setNow(currentNow);

      if (state.status === 'running' && state.mode === 'countdown') {
        const elapsed = calculateElapsedMs(state, currentNow);
        if (elapsed >= state.targetDurationMs) {
          handleCompletion(state);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [state, handleCompletion]);

  // Action: Start
  const start = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);

    setState((prev) => {
      // If completed or idle, reset accumulated elapsed
      const shouldReset = prev.status === 'completed' || prev.status === 'idle';
      const newSessionId = shouldReset
        ? `session_${currentNow}_${Math.random().toString(36).substring(2, 7)}`
        : prev.sessionId;

      return {
        ...prev,
        status: 'running',
        startTimestamp: currentNow,
        accumulatedElapsedMs: shouldReset ? 0 : prev.accumulatedElapsedMs,
        pauseTimestamp: null,
        completedAt: null,
        sessionId: newSessionId,
      };
    });
  }, []);

  // Action: Pause
  const pause = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);

    setState((prev) => {
      if (prev.status !== 'running') return prev;

      const runningSlice = currentNow - (prev.startTimestamp ?? currentNow);
      const totalElapsed = prev.accumulatedElapsedMs + Math.max(0, runningSlice);

      return {
        ...prev,
        status: 'paused',
        startTimestamp: null,
        pauseTimestamp: currentNow,
        accumulatedElapsedMs:
          prev.mode === 'countdown'
            ? Math.min(prev.targetDurationMs, totalElapsed)
            : totalElapsed,
      };
    });
  }, []);

  // Action: Resume
  const resume = useCallback(() => {
    start();
  }, [start]);

  // Action: Reset
  const reset = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);

    setState((prev) => ({
      ...prev,
      status: 'idle',
      startTimestamp: null,
      pauseTimestamp: null,
      accumulatedElapsedMs: 0,
      completedAt: null,
      sessionId: `session_${currentNow}_${Math.random().toString(36).substring(2, 7)}`,
    }));
  }, []);

  // Action: Set Countdown Preset Duration
  const setCountdownDuration = useCallback((minutes: number) => {
    const durationMs = minutes * 60 * 1000;
    const currentNow = Date.now();
    setNow(currentNow);

    setState((prev) => ({
      ...prev,
      mode: 'countdown',
      targetDurationMs: durationMs,
      status: 'idle',
      startTimestamp: null,
      pauseTimestamp: null,
      accumulatedElapsedMs: 0,
      completedAt: null,
      sessionId: `session_${currentNow}_${Math.random().toString(36).substring(2, 7)}`,
    }));

    setPreferences((prev) => ({
      ...prev,
      selectedPresetMinutes: minutes,
    }));
  }, []);

  // Action: Switch Mode
  const switchMode = useCallback((mode: TimerMode) => {
    const currentNow = Date.now();
    setNow(currentNow);

    setState((prev) => {
      if (prev.mode === mode) return prev;

      return {
        ...createInitialTimerState(preferences.selectedPresetMinutes),
        mode,
        sessionId: `session_${currentNow}_${Math.random().toString(36).substring(2, 7)}`,
      };
    });
  }, [preferences.selectedPresetMinutes]);

  // Action: Toggle Sound
  const toggleSound = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, []);

  // Action: Toggle Vibrate
  const toggleVibrate = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      vibrateEnabled: !prev.vibrateEnabled,
    }));
  }, []);

  // Action: Toggle Wake Lock Preference
  const toggleWakeLockPreference = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      wakeLockPreferred: !prev.wakeLockPreferred,
    }));
  }, []);

  // Compute current derived calculation metrics
  const calculations = getTimerCalculations(state, now);

  return {
    state,
    preferences,
    calculations,
    isWakeLockSupported,
    isWakeLockActive,
    start,
    pause,
    resume,
    reset,
    setCountdownDuration,
    switchMode,
    toggleSound,
    toggleVibrate,
    toggleWakeLockPreference,
  };
}
