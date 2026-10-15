import type { TimerState, TimerCalculations, TimerStatus } from '../types/timer';

/**
 * Calculates current elapsed time in milliseconds based on high-precision timestamps.
 */
export function calculateElapsedMs(state: TimerState, now: number = Date.now()): number {
  if (state.status === 'running') {
    const start = state.startTimestamp ?? now;
    const additional = Math.max(0, now - start);
    const total = state.accumulatedElapsedMs + additional;
    if (state.mode === 'countdown') {
      return Math.min(state.targetDurationMs, total);
    }
    return total;
  }

  if (state.status === 'completed') {
    return state.mode === 'countdown' ? state.targetDurationMs : state.accumulatedElapsedMs;
  }

  // 'paused' or 'idle'
  return state.accumulatedElapsedMs;
}

/**
 * Calculates remaining time in milliseconds for countdown mode.
 */
export function calculateRemainingMs(targetDurationMs: number, elapsedMs: number): number {
  return Math.max(0, targetDurationMs - elapsedMs);
}

/**
 * Calculates progress percentage (0 - 100), strictly clamped.
 */
export function calculateProgressPercent(elapsedMs: number, targetDurationMs: number): number {
  if (targetDurationMs <= 0) return 0;
  const progress = (elapsedMs / targetDurationMs) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Format milliseconds into standard timer format:
 * "MM:SS" or "HH:MM:SS" when hours are present or forced.
 */
export function formatDuration(
  ms: number,
  isCountdown: boolean = false,
  forceHours: boolean = false
): string {
  const safeMs = Math.max(0, ms);
  // Countdown uses ceil so 00:00 displays only upon completion, stopwatch uses floor
  const totalSeconds = isCountdown ? Math.ceil(safeMs / 1000) : Math.floor(safeMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format milliseconds into a human readable summary (e.g. "25 min", "1 hr 30 min")
 */
export function formatReadableDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes} min`;
}

/**
 * Map status to display badge label
 */
export function getStatusLabel(status: TimerStatus): TimerCalculations['statusLabel'] {
  switch (status) {
    case 'idle':
      return 'READY';
    case 'running':
      return 'FOCUSING';
    case 'paused':
      return 'PAUSED';
    case 'completed':
      return 'COMPLETED';
  }
}

/**
 * Computes all derived values for the active timer state.
 */
export function getTimerCalculations(state: TimerState, now: number = Date.now()): TimerCalculations {
  const elapsedMs = calculateElapsedMs(state, now);
  const remainingMs = calculateRemainingMs(state.targetDurationMs, elapsedMs);
  const progressPercent =
    state.mode === 'countdown'
      ? calculateProgressPercent(elapsedMs, state.targetDurationMs)
      : 0;

  const displayMs = state.mode === 'countdown' ? remainingMs : elapsedMs;
  const isCountdown = state.mode === 'countdown';
  const hasHours = displayMs >= 3600000 || state.targetDurationMs >= 3600000;
  const formattedTime = formatDuration(displayMs, isCountdown, hasHours);

  return {
    elapsedMs,
    remainingMs,
    progressPercent,
    formattedTime,
    statusLabel: getStatusLabel(state.status),
  };
}

/**
 * Validates a custom duration in minutes.
 * Returns null if valid, or an error string if invalid.
 */
export function validateCustomMinutes(value: string | number): { valid: boolean; minutes: number; error?: string } {
  const num = typeof value === 'string' ? Number(value.trim()) : value;

  if (isNaN(num) || !Number.isFinite(num)) {
    return { valid: false, minutes: 0, error: 'Please enter a valid number' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, minutes: 0, error: 'Please enter a whole number of minutes' };
  }
  if (num <= 0) {
    return { valid: false, minutes: 0, error: 'Duration must be greater than 0' };
  }
  if (num > 1440) {
    return { valid: false, minutes: 0, error: 'Duration cannot exceed 24 hours (1440 minutes)' };
  }

  return { valid: true, minutes: num };
}
