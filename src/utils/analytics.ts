import type {
  FocusSession,
  DayFocusData,
  DayAllocation,
  HeatmapLevel,
  StreakInfo,
  WeeklyInsights,
  MonthlyInsights,
  DailySummary,
} from '../types/session';

export const HEATMAP_COLORS: Record<HeatmapLevel, string> = {
  0: '#171717',
  1: '#353535',
  2: '#666666',
  3: '#A0A0A0',
  4: '#FFFFFF',
};

/**
 * Deterministic mapping of focused seconds to heatmap intensity levels (0 to 4).
 * - Level 0: 0 seconds (no activity)
 * - Level 1: > 0 and < 30 minutes (1s - 1799s)
 * - Level 2: 30 minutes to < 1 hour (1800s - 3599s)
 * - Level 3: 1 hour to < 2 hours (3600s - 7199s)
 * - Level 4: 2 hours or more (>= 7200s)
 */
export function getFocusLevel(seconds: number): HeatmapLevel {
  if (seconds <= 0) return 0;
  if (seconds < 30 * 60) return 1;
  if (seconds < 60 * 60) return 2;
  if (seconds < 120 * 60) return 3;
  return 4;
}

/**
 * Format a Date object into a local date string "YYYY-MM-DD".
 */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" local date string into a Date object at local midnight.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Format seconds into concise human-readable time (e.g. "1h 45m", "25m", "45s", "0m").
 */
export function formatSecondsToSummary(seconds: number): string {
  const safeSec = Math.max(0, Math.round(seconds));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `${s}s`;
}

/**
 * Format seconds into detailed display (e.g. "2 hours 15 minutes", "25 minutes").
 */
export function formatSecondsToDetailed(seconds: number): string {
  const safeSec = Math.max(0, Math.round(seconds));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);

  if (h > 0 && m > 0) {
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m} ${m === 1 ? 'min' : 'mins'}`;
  }
  if (h > 0) {
    return `${h} ${h === 1 ? 'hr' : 'hrs'}`;
  }
  return `${m} ${m === 1 ? 'min' : 'mins'}`;
}

/**
 * Allocates focus session seconds across local calendar days when crossing midnight.
 */
export function splitSessionByDay(session: FocusSession): DayAllocation[] {
  const startDate = new Date(session.startedAt);
  const endDate = new Date(session.endedAt);
  const startKey = formatLocalDateKey(startDate);
  const endKey = formatLocalDateKey(endDate);

  // If session is within the same calendar day, no split needed
  if (startKey === endKey) {
    return [{ dateKey: startKey, seconds: session.durationSeconds }];
  }

  // Session crosses one or more midnights
  const allocations: DayAllocation[] = [];
  const totalWallClockMs = Math.max(1, session.endedAt - session.startedAt);

  // Iterate day by day from start to end
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
  const endDayLimit = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);

  let allocatedSum = 0;

  while (current <= endDayLimit) {
    const dayKey = formatLocalDateKey(current);
    const dayStartMs = current.getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

    const overlapStart = Math.max(session.startedAt, dayStartMs);
    const overlapEnd = Math.min(session.endedAt, dayEndMs);
    const overlapMs = Math.max(0, overlapEnd - overlapStart);

    if (overlapMs > 0) {
      const ratio = overlapMs / totalWallClockMs;
      const allocatedSec = Math.round(session.durationSeconds * ratio);
      allocations.push({ dateKey: dayKey, seconds: allocatedSec });
      allocatedSum += allocatedSec;
    }

    current.setDate(current.getDate() + 1);
  }

  // Compensate for rounding difference on the last segment
  if (allocations.length > 0 && allocatedSum !== session.durationSeconds) {
    const diff = session.durationSeconds - allocatedSum;
    allocations[allocations.length - 1].seconds += diff;
  }

  return allocations;
}

/**
 * Aggregates all sessions into a Map of dateKey -> DayFocusData.
 */
export function aggregateSessionsByDay(sessions: FocusSession[]): Map<string, DayFocusData> {
  const dayMap = new Map<string, DayFocusData>();

  for (const session of sessions) {
    const allocations = splitSessionByDay(session);

    for (const alloc of allocations) {
      let dayData = dayMap.get(alloc.dateKey);
      if (!dayData) {
        const d = parseLocalDateKey(alloc.dateKey);
        dayData = {
          dateKey: alloc.dateKey,
          date: d,
          totalDurationSeconds: 0,
          sessionCount: 0,
          completedCount: 0,
          sessions: [],
          level: 0,
        };
        dayMap.set(alloc.dateKey, dayData);
      }

      dayData.totalDurationSeconds += alloc.seconds;
      dayData.sessionCount += 1;
      if (session.completed) {
        dayData.completedCount += 1;
      }
      if (!dayData.sessions.some((s) => s.id === session.id)) {
        dayData.sessions.push(session);
      }
      dayData.level = getFocusLevel(dayData.totalDurationSeconds);
    }
  }

  return dayMap;
}

/**
 * Computes current and best streak info from daily duration mapping.
 */
export function calculateStreaks(
  dayMap: Map<string, DayFocusData>,
  referenceDate: Date = new Date()
): StreakInfo {
  const todayKey = formatLocalDateKey(referenceDate);

  // Active days set
  const activeDateKeys = new Set<string>();
  for (const [key, data] of dayMap.entries()) {
    if (data.totalDurationSeconds > 0) {
      activeDateKeys.add(key);
    }
  }

  // Current Streak Calculation:
  // Policy: Today extends the streak if active; otherwise a streak ending yesterday remains active until end of today.
  let currentStreak = 0;
  const cursor = new Date(referenceDate);

  // Check if today is active
  if (activeDateKeys.has(todayKey)) {
    while (activeDateKeys.has(formatLocalDateKey(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    // Check if yesterday was active
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatLocalDateKey(yesterday);

    if (activeDateKeys.has(yesterdayKey)) {
      cursor.setDate(cursor.getDate() - 1);
      while (activeDateKeys.has(formatLocalDateKey(cursor))) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    } else {
      currentStreak = 0;
    }
  }

  // Best Streak Calculation:
  // Sort all unique active keys chronologically and find the longest consecutive run
  let bestStreak = 0;
  const sortedKeys = Array.from(activeDateKeys).sort();

  if (sortedKeys.length > 0) {
    let running = 1;
    bestStreak = 1;

    for (let i = 1; i < sortedKeys.length; i++) {
      const prevDate = parseLocalDateKey(sortedKeys[i - 1]);
      const currDate = parseLocalDateKey(sortedKeys[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        running++;
        if (running > bestStreak) {
          bestStreak = running;
        }
      } else {
        running = 1;
      }
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    activeDaysCount: activeDateKeys.size,
    totalDaysEvaluated: dayMap.size,
  };
}

/**
 * Generates past 365 days of heatmap data organized by week columns (Sunday - Saturday).
 */
export function generateYearlyHeatmap(
  dayMap: Map<string, DayFocusData>,
  endDate: Date = new Date()
): {
  weeks: Array<Array<{ date: Date; dateKey: string; data: DayFocusData | null; level: HeatmapLevel }>>;
  monthLabels: Array<{ name: string; weekIndex: number }>;
  startDate: Date;
  endDate: Date;
  totalActiveDays: number;
  totalFocusedSeconds: number;
} {
  const daysCount = 365;
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - (daysCount - 1));

  // Align start to the preceding Sunday so week columns are aligned
  const alignedStart = new Date(start);
  const dayOfWeek = alignedStart.getDay(); // 0 is Sunday
  alignedStart.setDate(alignedStart.getDate() - dayOfWeek);

  const weeks: Array<Array<{ date: Date; dateKey: string; data: DayFocusData | null; level: HeatmapLevel }>> = [];
  const monthLabels: Array<{ name: string; weekIndex: number }> = [];

  const current = new Date(alignedStart);
  let lastMonth = -1;
  let totalActiveDays = 0;
  let totalFocusedSeconds = 0;

  while (current <= end || current.getDay() !== 0) {
    const weekIndex = weeks.length;
    const currentWeek: Array<{ date: Date; dateKey: string; data: DayFocusData | null; level: HeatmapLevel }> = [];

    for (let day = 0; day < 7; day++) {
      const dateKey = formatLocalDateKey(current);
      const isWithinRange = current >= start && current <= end;

      let data: DayFocusData | null = null;
      let level: HeatmapLevel = 0;

      if (isWithinRange) {
        data = dayMap.get(dateKey) || null;
        if (data) {
          level = data.level;
          if (data.totalDurationSeconds > 0) {
            totalActiveDays++;
            totalFocusedSeconds += data.totalDurationSeconds;
          }
        }
      }

      // Track month transitions for header labels (placed on the first day of month or when month changes)
      if (current.getDate() <= 7 && current.getMonth() !== lastMonth && isWithinRange) {
        lastMonth = current.getMonth();
        const monthShort = current.toLocaleString('default', { month: 'short' });
        monthLabels.push({ name: monthShort, weekIndex });
      }

      currentWeek.push({
        date: new Date(current),
        dateKey,
        data,
        level,
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push(currentWeek);
    if (current > end && current.getDay() === 0) break;
  }

  return {
    weeks,
    monthLabels,
    startDate: start,
    endDate: end,
    totalActiveDays,
    totalFocusedSeconds,
  };
}

/**
 * Calculates Weekly Insights for the current week (Monday to Sunday).
 */
export function calculateWeeklyInsights(
  dayMap: Map<string, DayFocusData>,
  referenceDate: Date = new Date()
): WeeklyInsights {
  // Find Monday of the current week
  const curr = new Date(referenceDate);
  const day = curr.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);

  const dailyBreakdown: Array<{ dayName: string; dateKey: string; seconds: number }> = [];
  let totalSeconds = 0;
  let activeDaysCount = 0;
  let mostProductiveDay: { dayName: string; dateKey: string; seconds: number } | null = null;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateKey = formatLocalDateKey(dayDate);
    const dayData = dayMap.get(dateKey);
    const seconds = dayData ? dayData.totalDurationSeconds : 0;

    dailyBreakdown.push({
      dayName: dayNames[i],
      dateKey,
      seconds,
    });

    totalSeconds += seconds;
    if (seconds > 0) {
      activeDaysCount++;
    }

    if (!mostProductiveDay || seconds > mostProductiveDay.seconds) {
      if (seconds > 0) {
        mostProductiveDay = { dayName: dayNames[i], dateKey, seconds };
      }
    }
  }

  return {
    totalSeconds,
    dailyBreakdown,
    averageSecondsPerDay: Math.round(totalSeconds / 7),
    activeDaysCount,
    mostProductiveDay,
  };
}

/**
 * Calculates Monthly Insights for the current month.
 */
export function calculateMonthlyInsights(
  dayMap: Map<string, DayFocusData>,
  referenceDate: Date = new Date()
): MonthlyInsights {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let totalSeconds = 0;
  let activeDaysCount = 0;
  let totalSessions = 0;
  let completedSessions = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = formatLocalDateKey(d);
    const data = dayMap.get(key);

    if (data) {
      totalSeconds += data.totalDurationSeconds;
      if (data.totalDurationSeconds > 0) activeDaysCount++;
      totalSessions += data.sessionCount;
      completedSessions += data.completedCount;
    }
  }

  return {
    totalSeconds,
    averageSecondsPerDay: Math.round(totalSeconds / daysInMonth),
    activeDaysCount,
    totalSessions,
    completedSessions,
    daysInMonth,
  };
}

/**
 * Calculates Daily Summary for today.
 */
export function calculateDailySummary(
  dayMap: Map<string, DayFocusData>,
  referenceDate: Date = new Date()
): DailySummary {
  const todayKey = formatLocalDateKey(referenceDate);
  const data = dayMap.get(todayKey);

  if (!data || data.totalDurationSeconds <= 0) {
    return {
      totalSeconds: 0,
      sessionCount: 0,
      completedCount: 0,
      averageSessionSeconds: 0,
    };
  }

  const averageSessionSeconds =
    data.sessionCount > 0 ? Math.round(data.totalDurationSeconds / data.sessionCount) : 0;

  return {
    totalSeconds: data.totalDurationSeconds,
    sessionCount: data.sessionCount,
    completedCount: data.completedCount,
    averageSessionSeconds,
  };
}
