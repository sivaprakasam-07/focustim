export type TimerMode = 'countdown' | 'stopwatch';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export const PRESET_MINUTES = [5, 15, 25, 30, 45, 60, 90, 120] as const;

export interface TimerState {
  mode: TimerMode;
  targetDurationMs: number; // in milliseconds
  status: TimerStatus;
  sessionStartedAt: number | null; // epoch ms when the overall session initially started
  startTimestamp: number | null; // epoch ms when the current running segment started
  accumulatedElapsedMs: number; // elapsed ms before the current running segment
  pauseTimestamp: number | null; // epoch ms when paused
  sessionId: string; // unique ID for the current session to guard completion
  completedAt: number | null; // epoch ms when completed
}

export interface UserPreferences {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  wakeLockPreferred: boolean;
  selectedPresetMinutes: number;
  customMinutes: number;
}

export interface PersistedData {
  version: number;
  state: TimerState;
  preferences: UserPreferences;
}

export interface TimerCalculations {
  elapsedMs: number;
  remainingMs: number;
  progressPercent: number; // 0 to 100
  formattedTime: string; // e.g. "24:59" or "01:23:45"
  statusLabel: 'READY' | 'FOCUSING' | 'PAUSED' | 'COMPLETED';
}
