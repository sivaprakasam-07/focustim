import React, { useState, useEffect, useCallback } from 'react';
import type { FocusSession } from '../types/session';
import { sessionService } from '../utils/sessionService';
import { useAuth } from '../hooks/useAuth';
import {
  aggregateSessionsByDay,
  calculateDailySummary,
  calculateStreaks,
  calculateWeeklyInsights,
  calculateMonthlyInsights,
} from '../utils/analytics';
import { AuthBar } from './AuthBar';
import { DailySummaryCard } from './DailySummaryCard';
import { Heatmap } from './Heatmap';
import { StreaksCard } from './StreaksCard';
import { WeeklyMonthlyInsights } from './WeeklyMonthlyInsights';
import { SessionHistoryList } from './SessionHistoryList';

interface FocusHistoryViewProps {
  onBackToTimer: () => void;
}

export const FocusHistoryView: React.FC<FocusHistoryViewProps> = ({ onBackToTimer }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const records = await sessionService.getSessions(user?.uid ?? null);
      setSessions(records);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDeleteSession = async (id: string) => {
    await sessionService.deleteSession(id, user?.uid ?? null);
    await loadSessions();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all recorded focus sessions?')) {
      for (const s of sessions) {
        await sessionService.deleteSession(s.id, user?.uid ?? null);
      }
      await loadSessions();
    }
  };

  // Derive all metrics from raw sessions using stable referenceDate
  const [referenceDate] = useState<Date>(() => new Date());
  const dayMap = aggregateSessionsByDay(sessions);
  const dailySummary = calculateDailySummary(dayMap, referenceDate);
  const streaks = calculateStreaks(dayMap, referenceDate);
  const weekly = calculateWeeklyInsights(dayMap, referenceDate);
  const monthly = calculateMonthlyInsights(dayMap, referenceDate);

  return (
    <div className="history-view-container">
      {/* History Header */}
      <header className="history-header">
        <button
          type="button"
          className="btn-back-nav"
          onClick={onBackToTimer}
          aria-label="Return to Focus Timer"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Timer</span>
        </button>

        <div className="history-header-title">
          <h1 className="history-title">Focus History</h1>
          <span className="history-subtitle">Analytics & Cloud Sync</span>
        </div>

        <div className="history-header-spacer" />
      </header>

      {/* Main Analytics Content */}
      <main className="history-content">
        {/* Firebase Authentication & Cloud Sync Bar */}
        <AuthBar />

        {isLoading ? (
          <div className="history-loading">Loading activity...</div>
        ) : (
          <>
            {/* Today's Focus Summary */}
            <DailySummaryCard summary={dailySummary} referenceDate={referenceDate} />

            {/* Yearly Activity Heatmap */}
            <Heatmap dayMap={dayMap} />

            {/* Focus Streaks */}
            <StreaksCard streaks={streaks} />

            {/* Weekly & Monthly Insights */}
            <WeeklyMonthlyInsights weekly={weekly} monthly={monthly} referenceDate={referenceDate} />

            {/* Daily History List & Sessions */}
            <SessionHistoryList
              dayMap={dayMap}
              onDeleteSession={handleDeleteSession}
              onClearAll={sessions.length > 0 ? handleClearAll : undefined}
            />
          </>
        )}
      </main>
    </div>
  );
};
