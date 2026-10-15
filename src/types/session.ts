export interface FocusSession {
  id: string;
  mode: 'countdown' | 'stopwatch';
  startedAt: number; // Unix timestamp ms
  endedAt: number; // Unix timestamp ms
  durationSeconds: number; // Active focused seconds (excluding pauses)
  targetDurationSeconds: number; // Target for countdown, or 0 for stopwatch
  completed: boolean; // True if countdown reached 0 or stopwatch was finished
  createdAt: number;
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface DayFocusData {
  dateKey: string; // YYYY-MM-DD
  date: Date;
  totalDurationSeconds: number;
  sessionCount: number;
  completedCount: number;
  sessions: FocusSession[];
  level: HeatmapLevel;
}

export interface DayAllocation {
  dateKey: string;
  seconds: number;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  activeDaysCount: number;
  totalDaysEvaluated: number;
}

export interface WeeklyInsights {
  totalSeconds: number;
  dailyBreakdown: Array<{ dayName: string; dateKey: string; seconds: number }>;
  averageSecondsPerDay: number;
  activeDaysCount: number;
  mostProductiveDay: { dayName: string; dateKey: string; seconds: number } | null;
}

export interface MonthlyInsights {
  totalSeconds: number;
  averageSecondsPerDay: number;
  activeDaysCount: number;
  totalSessions: number;
  completedSessions: number;
  daysInMonth: number;
}

export interface DailySummary {
  totalSeconds: number;
  sessionCount: number;
  completedCount: number;
  averageSessionSeconds: number;
  dailyGoalSeconds?: number;
}
