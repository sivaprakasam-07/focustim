import { describe, it, expect } from 'vitest';
import {
  calculateElapsedMs,
  calculateRemainingMs,
  calculateProgressPercent,
  formatDuration,
  formatReadableDuration,
  validateCustomMinutes,
} from './timerCalculations';
import type { TimerState } from '../types/timer';

describe('timerCalculations', () => {
  describe('calculateElapsedMs', () => {
    it('returns accumulated elapsed time when idle', () => {
      const state: TimerState = {
        mode: 'countdown',
        targetDurationMs: 60000,
        status: 'idle',
        startTimestamp: null,
        accumulatedElapsedMs: 15000,
        pauseTimestamp: null,
        sessionId: 'test',
        completedAt: null,
      };
      expect(calculateElapsedMs(state, 100000)).toBe(15000);
    });

    it('returns accumulated elapsed time when paused', () => {
      const state: TimerState = {
        mode: 'countdown',
        targetDurationMs: 60000,
        status: 'paused',
        startTimestamp: null,
        accumulatedElapsedMs: 25000,
        pauseTimestamp: 50000,
        sessionId: 'test',
        completedAt: null,
      };
      expect(calculateElapsedMs(state, 70000)).toBe(25000);
    });

    it('calculates accurate elapsed time while running based on timestamp delta', () => {
      const state: TimerState = {
        mode: 'countdown',
        targetDurationMs: 60000,
        status: 'running',
        startTimestamp: 10000,
        accumulatedElapsedMs: 5000,
        pauseTimestamp: null,
        sessionId: 'test',
        completedAt: null,
      };
      // now = 20000 -> 10000ms passed in current slice + 5000 accumulated = 15000
      expect(calculateElapsedMs(state, 20000)).toBe(15000);
    });

    it('clamps countdown elapsed to target duration when running', () => {
      const state: TimerState = {
        mode: 'countdown',
        targetDurationMs: 60000,
        status: 'running',
        startTimestamp: 10000,
        accumulatedElapsedMs: 0,
        pauseTimestamp: null,
        sessionId: 'test',
        completedAt: null,
      };
      // now = 80000 (70000ms passed, target is 60000)
      expect(calculateElapsedMs(state, 80000)).toBe(60000);
    });

    it('allows stopwatch to exceed arbitrary durations', () => {
      const state: TimerState = {
        mode: 'stopwatch',
        targetDurationMs: 0,
        status: 'running',
        startTimestamp: 10000,
        accumulatedElapsedMs: 50000,
        pauseTimestamp: null,
        sessionId: 'test',
        completedAt: null,
      };
      // now = 70000 -> 60000 slice + 50000 accumulated = 110000
      expect(calculateElapsedMs(state, 70000)).toBe(110000);
    });
  });

  describe('calculateRemainingMs', () => {
    it('calculates remaining time correctly', () => {
      expect(calculateRemainingMs(60000, 20000)).toBe(40000);
      expect(calculateRemainingMs(60000, 60000)).toBe(0);
      expect(calculateRemainingMs(60000, 70000)).toBe(0);
    });
  });

  describe('calculateProgressPercent', () => {
    it('calculates percentage clamped to 0-100', () => {
      expect(calculateProgressPercent(0, 100000)).toBe(0);
      expect(calculateProgressPercent(50000, 100000)).toBe(50);
      expect(calculateProgressPercent(100000, 100000)).toBe(100);
      expect(calculateProgressPercent(120000, 100000)).toBe(100);
      expect(calculateProgressPercent(-10, 100000)).toBe(0);
      expect(calculateProgressPercent(100, 0)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('formats countdown MM:SS using ceil so 00:00 marks completion', () => {
      // 25 minutes = 1,500,000ms
      expect(formatDuration(1500000, true)).toBe('25:00');
      // 1499500ms (500ms into the first second) is still 25:00
      expect(formatDuration(1499500, true)).toBe('25:00');
      // 1499000ms is 24:59
      expect(formatDuration(1499000, true)).toBe('24:59');
      // 1000ms is 00:01
      expect(formatDuration(1000, true)).toBe('00:01');
      // 1ms is 00:01
      expect(formatDuration(1, true)).toBe('00:01');
      // 0ms is 00:00
      expect(formatDuration(0, true)).toBe('00:00');
    });

    it('formats stopwatch MM:SS using floor', () => {
      expect(formatDuration(0, false)).toBe('00:00');
      expect(formatDuration(500, false)).toBe('00:00');
      expect(formatDuration(1000, false)).toBe('00:01');
      expect(formatDuration(65000, false)).toBe('01:05');
    });

    it('formats hours when elapsed exceeds 3600 seconds or when forced', () => {
      // 1 hour 15 minutes 30 seconds = 4530 seconds = 4,530,000 ms
      expect(formatDuration(4530000, false)).toBe('01:15:30');
      expect(formatDuration(65000, false, true)).toBe('00:01:05');
    });
  });

  describe('formatReadableDuration', () => {
    it('formats readable descriptions correctly', () => {
      expect(formatReadableDuration(25 * 60 * 1000)).toBe('25 min');
      expect(formatReadableDuration(60 * 60 * 1000)).toBe('1h');
      expect(formatReadableDuration(90 * 60 * 1000)).toBe('1h 30m');
    });
  });

  describe('validateCustomMinutes', () => {
    it('validates positive integers within reasonable limits', () => {
      expect(validateCustomMinutes(25)).toEqual({ valid: true, minutes: 25 });
      expect(validateCustomMinutes('45')).toEqual({ valid: true, minutes: 45 });
      expect(validateCustomMinutes(' 60 ')).toEqual({ valid: true, minutes: 60 });
      expect(validateCustomMinutes(1440)).toEqual({ valid: true, minutes: 1440 });
    });

    it('rejects invalid inputs', () => {
      expect(validateCustomMinutes(0).valid).toBe(false);
      expect(validateCustomMinutes(-5).valid).toBe(false);
      expect(validateCustomMinutes('abc').valid).toBe(false);
      expect(validateCustomMinutes(1441).valid).toBe(false);
      expect(validateCustomMinutes(12.5).valid).toBe(false);
    });
  });
});
