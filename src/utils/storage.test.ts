import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSession,
  loadAndRecoverSession,
  createInitialTimerState,
  DEFAULT_PREFERENCES,
  clearSession,
} from './storage';
import type { TimerState, UserPreferences } from '../types/timer';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('storage & session recovery', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns default initial state when storage is empty', () => {
    const { state, preferences, wasExpiredInBackground } = loadAndRecoverSession();
    expect(state.mode).toBe('countdown');
    expect(state.status).toBe('idle');
    expect(state.targetDurationMs).toBe(25 * 60 * 1000);
    expect(preferences.selectedPresetMinutes).toBe(25);
    expect(wasExpiredInBackground).toBe(false);
  });

  it('saves and restores state accurately', () => {
    const testState: TimerState = {
      mode: 'stopwatch',
      targetDurationMs: 0,
      status: 'paused',
      sessionStartedAt: 1234000,
      startTimestamp: null,
      accumulatedElapsedMs: 42000,
      pauseTimestamp: 1234567,
      sessionId: 'session_test_1',
      completedAt: null,
    };
    const testPrefs: UserPreferences = {
      soundEnabled: false,
      vibrateEnabled: true,
      wakeLockPreferred: false,
      selectedPresetMinutes: 45,
      customMinutes: 45,
    };

    saveSession(testState, testPrefs);
    const { state, preferences } = loadAndRecoverSession();

    expect(state.mode).toBe('stopwatch');
    expect(state.status).toBe('paused');
    expect(state.accumulatedElapsedMs).toBe(42000);
    expect(preferences.soundEnabled).toBe(false);
    expect(preferences.selectedPresetMinutes).toBe(45);
  });

  it('recovers gracefully from corrupted JSON in localStorage', () => {
    localStorage.setItem('focusflow_timer_session_v1', '{corrupt json...');
    const { state, preferences, wasExpiredInBackground } = loadAndRecoverSession();
    expect(state.status).toBe('idle');
    expect(preferences).toEqual(DEFAULT_PREFERENCES);
    expect(wasExpiredInBackground).toBe(false);
  });

  it('detects and recovers a countdown that expired while app was closed', () => {
    const pastTime = Date.now() - 30 * 60 * 1000; // started 30 mins ago
    const target25min = 25 * 60 * 1000; // target 25 mins

    const expiredState: TimerState = {
      mode: 'countdown',
      targetDurationMs: target25min,
      status: 'running',
      sessionStartedAt: pastTime,
      startTimestamp: pastTime,
      accumulatedElapsedMs: 0,
      pauseTimestamp: null,
      sessionId: 'session_expired',
      completedAt: null,
    };

    saveSession(expiredState, DEFAULT_PREFERENCES);
    const { state, wasExpiredInBackground } = loadAndRecoverSession();

    expect(wasExpiredInBackground).toBe(true);
    expect(state.status).toBe('completed');
    expect(state.accumulatedElapsedMs).toBe(target25min);
    expect(state.startTimestamp).toBeNull();
  });

  it('clears session properly', () => {
    saveSession(createInitialTimerState(), DEFAULT_PREFERENCES);
    expect(localStorage.getItem('focusflow_timer_session_v1')).not.toBeNull();
    clearSession();
    expect(localStorage.getItem('focusflow_timer_session_v1')).toBeNull();
  });
});
