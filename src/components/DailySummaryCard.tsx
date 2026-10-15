import React from 'react';
import type { DailySummary } from '../types/session';
import { formatSecondsToDetailed, formatSecondsToSummary } from '../utils/analytics';

interface DailySummaryCardProps {
  summary: DailySummary;
  referenceDate?: Date;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ summary, referenceDate }) => {
  const hasActivity = summary.totalSeconds > 0;
  const displayDate = referenceDate || new Date(0); // If not provided, will be passed from view

  return (
    <section className="analytics-card daily-summary-card" aria-label="Today's Focus Summary">
      <div className="card-header">
        <h2 className="card-title">Today's Focus</h2>
        <span className="card-badge">
          {displayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {hasActivity ? (
        <div className="summary-metrics-grid">
          <div className="metric-box primary-metric">
            <span className="metric-label">Total Focused Time</span>
            <span className="metric-value">{formatSecondsToSummary(summary.totalSeconds)}</span>
            <span className="metric-sub">{formatSecondsToDetailed(summary.totalSeconds)}</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Total Sessions</span>
            <span className="metric-value">{summary.sessionCount}</span>
            <span className="metric-sub">{summary.completedCount} completed</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Avg Session</span>
            <span className="metric-value">{formatSecondsToSummary(summary.averageSessionSeconds)}</span>
            <span className="metric-sub">per session</span>
          </div>
        </div>
      ) : (
        <div className="empty-state-box">
          <p className="empty-state-text">
            No focus sessions recorded today. Start a session to build your history.
          </p>
        </div>
      )}
    </section>
  );
};
