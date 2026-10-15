import { describe, it, expect } from 'vitest';
import {
  splitSessionByDay,
  getFocusLevel,
  aggregateSessionsByDay,
  calculateStreaks,
  formatLocalDateKey,
  parseLocalDateKey,
  calculateWeeklyInsights,
  calculateMonthlyInsights,
  calculateDailySummary,
} from './analytics';
import type { FocusSession } from '../types/session';

describe('analytics & heatmap calculations', () => {
  describe('getFocusLevel', () => {
    it('returns level 0 for 0 seconds', () => {
      expect(getFocusLevel(0)).toBe(0);
      expect(getFocusLevel(-10)).toBe(0);
    });

    it('returns level 1 for > 0 and < 30 minutes', () => {
      expect(getFocusLevel(1)).toBe(1);
      expect(getFocusLevel(15 * 60)).toBe(1);
      expect(getFocusLevel(29 * 60 + 59)).toBe(1);
    });

    it('returns level 2 for 30 min to < 1 hour', () => {
      expect(getFocusLevel(30 * 60)).toBe(2);
      expect(getFocusLevel(45 * 60)).toBe(2);
      expect(getFocusLevel(59 * 60 + 59)).toBe(2);
    });

    it('returns level 3 for 1 hour to < 2 hours', () => {
      expect(getFocusLevel(60 * 60)).toBe(3);
      expect(getFocusLevel(90 * 60)).toBe(3);
      expect(getFocusLevel(119 * 60 + 59)).toBe(3);
    });

    it('returns level 4 for 2 hours or more', () => {
      expect(getFocusLevel(120 * 60)).toBe(4);
      expect(getFocusLevel(180 * 60)).toBe(4);
    });
  });

  describe('splitSessionByDay (Midnight allocation)', () => {
    it('returns single allocation when session starts and ends on same local day', () => {
      const start = new Date(2026, 9, 15, 10, 0, 0).getTime();
      const end = new Date(2026, 9, 15, 10, 25, 0).getTime();
      const session: FocusSession = {
        id: 's1',
        mode: 'countdown',
        startedAt: start,
        endedAt: end,
        durationSeconds: 1500,
        targetDurationSeconds: 1500,
        completed: true,
        createdAt: start,
      };

      const result = splitSessionByDay(session);
      expect(result).toHaveLength(1);
      expect(result[0].dateKey).toBe('2026-10-15');
      expect(result[0].seconds).toBe(1500);
    });

    it('apportions focused seconds across midnight proportionally', () => {
      // Starts 2026-10-15 23:45, ends 2026-10-16 00:15 (30 min wall clock span)
      // 15 min on Day 1, 15 min on Day 2 -> 50% on each
      const start = new Date(2026, 9, 15, 23, 45, 0).getTime();
      const end = new Date(2026, 9, 16, 0, 15, 0).getTime();
      const session: FocusSession = {
        id: 's2',
        mode: 'countdown',
        startedAt: start,
        endedAt: end,
        durationSeconds: 1800,
        targetDurationSeconds: 1800,
        completed: true,
        createdAt: start,
      };

      const result = splitSessionByDay(session);
      expect(result).toHaveLength(2);
      expect(result[0].dateKey).toBe('2026-10-15');
      expect(result[0].seconds).toBe(900);
      expect(result[1].dateKey).toBe('2026-10-16');
      expect(result[1].seconds).toBe(900);
      expect(result[0].seconds + result[1].seconds).toBe(1800);
    });
  });

  describe('aggregateSessionsByDay', () => {
    it('aggregates multiple sessions on the same day correctly', () => {
      const s1: FocusSession = {
        id: 's1',
        mode: 'countdown',
        startedAt: new Date(2026, 9, 15, 9, 0, 0).getTime(),
        endedAt: new Date(2026, 9, 15, 9, 25, 0).getTime(),
        durationSeconds: 1500,
        targetDurationSeconds: 1500,
        completed: true,
        createdAt: 1,
      };
      const s2: FocusSession = {
        id: 's2',
        mode: 'stopwatch',
        startedAt: new Date(2026, 9, 15, 14, 0, 0).getTime(),
        endedAt: new Date(2026, 9, 15, 14, 45, 0).getTime(),
        durationSeconds: 2700,
        targetDurationSeconds: 0,
        completed: true,
        createdAt: 2,
      };

      const map = aggregateSessionsByDay([s1, s2]);
      const day = map.get('2026-10-15');
      expect(day).toBeDefined();
      expect(day?.totalDurationSeconds).toBe(4200); // 1500 + 2700 = 70 mins
      expect(day?.sessionCount).toBe(2);
      expect(day?.completedCount).toBe(2);
      expect(day?.level).toBe(3); // 70 min is between 60m and 120m -> Level 3
    });
  });

  describe('calculateStreaks', () => {
    it('calculates current and best streak accurately when active today', () => {
      const today = new Date(2026, 9, 15);
      const yesterday = new Date(2026, 9, 14);
      const dayBefore = new Date(2026, 9, 13);

      const dayMap = aggregateSessionsByDay([
        {
          id: '1',
          mode: 'countdown',
          startedAt: today.getTime(),
          endedAt: today.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 1,
        },
        {
          id: '2',
          mode: 'countdown',
          startedAt: yesterday.getTime(),
          endedAt: yesterday.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 2,
        },
        {
          id: '3',
          mode: 'countdown',
          startedAt: dayBefore.getTime(),
          endedAt: dayBefore.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 3,
        },
      ]);

      const streaks = calculateStreaks(dayMap, today);
      expect(streaks.currentStreak).toBe(3);
      expect(streaks.bestStreak).toBe(3);
    });

    it('preserves streak ending yesterday if today has no session yet', () => {
      const today = new Date(2026, 9, 15);
      const yesterday = new Date(2026, 9, 14);
      const dayBefore = new Date(2026, 9, 13);

      // Only yesterday and dayBefore have sessions
      const dayMap = aggregateSessionsByDay([
        {
          id: '2',
          mode: 'countdown',
          startedAt: yesterday.getTime(),
          endedAt: yesterday.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 2,
        },
        {
          id: '3',
          mode: 'countdown',
          startedAt: dayBefore.getTime(),
          endedAt: dayBefore.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 3,
        },
      ]);

      const streaks = calculateStreaks(dayMap, today);
      expect(streaks.currentStreak).toBe(2);
      expect(streaks.bestStreak).toBe(2);
    });

    it('resets current streak to 0 if yesterday was also inactive', () => {
      const today = new Date(2026, 9, 15);
      const oldDay = new Date(2026, 9, 10);

      const dayMap = aggregateSessionsByDay([
        {
          id: '1',
          mode: 'countdown',
          startedAt: oldDay.getTime(),
          endedAt: oldDay.getTime() + 1500000,
          durationSeconds: 1500,
          targetDurationSeconds: 1500,
          completed: true,
          createdAt: 1,
        },
      ]);

      const streaks = calculateStreaks(dayMap, today);
      expect(streaks.currentStreak).toBe(0);
      expect(streaks.bestStreak).toBe(1);
    });
  });

  describe('calculateDailySummary', () => {
    it('returns empty state when no activity today', () => {
      const today = new Date(2026, 9, 15);
      const dayMap = aggregateSessionsByDay([]);
      const summary = calculateDailySummary(dayMap, today);

      expect(summary.totalSeconds).toBe(0);
      expect(summary.sessionCount).toBe(0);
      expect(summary.averageSessionSeconds).toBe(0);
    });
  });

  describe('calculateWeeklyInsights', () => {
    it('computes 7-day breakdown and totals for the current week', () => {
      const testDate = new Date(2026, 9, 15); // Thursday
      const session: FocusSession = {
        id: 'w1',
        mode: 'countdown',
        startedAt: testDate.getTime(),
        endedAt: testDate.getTime() + 3600000,
        durationSeconds: 3600,
        targetDurationSeconds: 3600,
        completed: true,
        createdAt: testDate.getTime(),
      };

      const dayMap = aggregateSessionsByDay([session]);
      const weekly = calculateWeeklyInsights(dayMap, testDate);

      expect(weekly.totalSeconds).toBe(3600);
      expect(weekly.activeDaysCount).toBe(1);
      expect(weekly.dailyBreakdown).toHaveLength(7);
      expect(weekly.mostProductiveDay?.dayName).toBe('Thu');
      expect(weekly.mostProductiveDay?.seconds).toBe(3600);
    });
  });

  describe('calculateMonthlyInsights', () => {
    it('computes monthly aggregates accurately', () => {
      const testDate = new Date(2026, 9, 15);
      const session: FocusSession = {
        id: 'm1',
        mode: 'countdown',
        startedAt: testDate.getTime(),
        endedAt: testDate.getTime() + 1800000,
        durationSeconds: 1800,
        targetDurationSeconds: 1800,
        completed: true,
        createdAt: testDate.getTime(),
      };

      const dayMap = aggregateSessionsByDay([session]);
      const monthly = calculateMonthlyInsights(dayMap, testDate);

      expect(monthly.totalSeconds).toBe(1800);
      expect(monthly.activeDaysCount).toBe(1);
      expect(monthly.totalSessions).toBe(1);
      expect(monthly.completedSessions).toBe(1);
      expect(monthly.daysInMonth).toBe(31); // October has 31 days
    });
  });

  describe('date helpers', () => {
    it('formats and parses local date keys consistently', () => {
      const d = new Date(2026, 9, 15);
      const key = formatLocalDateKey(d);
      expect(key).toBe('2026-10-15');
      const parsed = parseLocalDateKey(key);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9);
      expect(parsed.getDate()).toBe(15);
    });
  });
});
