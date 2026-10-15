import type { PersistedData, TimerState, UserPreferences } from '../types/timer';

const STORAGE_KEY = 'focusflow_timer_session_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  vibrateEnabled: true,
  wakeLockPreferred: true,
  selectedPresetMinutes: 25,
  customMinutes: 25,
};

export function createInitialTimerState(presetMinutes: number = 25): TimerState {
  return {
    mode: 'countdown',
    targetDurationMs: presetMinutes * 60 * 1000,
    status: 'idle',
    startTimestamp: null,
    accumulatedElapsedMs: 0,
    pauseTimestamp: null,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    completedAt: null,
  };
}

/**
 * Safely saves the current timer session and preferences to localStorage.
 */
export function saveSession(state: TimerState, preferences: UserPreferences): void {
  try {
    const data: PersistedData = {
      version: 1,
      state,
      preferences,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Non-blocking warning for quota errors or private mode restrictions
    console.warn('Failed to save session to localStorage:', error);
  }
}

/**
 * Safely loads and recovers the timer session and preferences from localStorage.
 */
export function loadAndRecoverSession(): { state: TimerState; preferences: UserPreferences; wasExpiredInBackground: boolean } {
  let wasExpiredInBackground = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        state: createInitialTimerState(DEFAULT_PREFERENCES.selectedPresetMinutes),
        preferences: DEFAULT_PREFERENCES,
        wasExpiredInBackground: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    if (!parsed || parsed.version !== 1 || !parsed.state) {
      throw new Error('Invalid schema version');
    }

    const state = parsed.state as TimerState;
    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(parsed.preferences || {}),
    };

    // Sanitize state fields
    if (typeof state.targetDurationMs !== 'number' || state.targetDurationMs <= 0) {
      state.targetDurationMs = preferences.selectedPresetMinutes * 60 * 1000;
    }
    if (typeof state.accumulatedElapsedMs !== 'number' || state.accumulatedElapsedMs < 0) {
      state.accumulatedElapsedMs = 0;
    }
    if (state.mode !== 'countdown' && state.mode !== 'stopwatch') {
      state.mode = 'countdown';
    }
    if (!state.sessionId) {
      state.sessionId = `session_${Date.now()}`;
    }

    const now = Date.now();

    // Check if it was saved in 'running' state and recalculate
    if (state.status === 'running' && state.startTimestamp !== null) {
      const elapsedSinceStart = Math.max(0, now - state.startTimestamp);
      const totalElapsed = state.accumulatedElapsedMs + elapsedSinceStart;

      if (state.mode === 'countdown') {
        if (totalElapsed >= state.targetDurationMs) {
          // Completed while app was closed or unloaded!
          state.status = 'completed';
          state.accumulatedElapsedMs = state.targetDurationMs;
          state.completedAt = state.startTimestamp + (state.targetDurationMs - state.accumulatedElapsedMs);
          state.startTimestamp = null;
          wasExpiredInBackground = true;
        } else {
          // Still running, restore running state accurately
          // Keep startTimestamp and accumulatedElapsedMs intact
        }
      } else {
        // Stopwatch running, keep running
      }
    }

    return { state, preferences, wasExpiredInBackground };
  } catch (error) {
    console.warn('Failed to recover session from localStorage, resetting to defaults:', error);
    return {
      state: createInitialTimerState(DEFAULT_PREFERENCES.selectedPresetMinutes),
      preferences: DEFAULT_PREFERENCES,
      wasExpiredInBackground: false,
    };
  }
}

/**
 * Clears stored session state (used on clean reset if needed).
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error);
  }
}
