import React from 'react';
import type { WeeklyInsights, MonthlyInsights } from '../types/session';
import { formatSecondsToDetailed, formatSecondsToSummary } from '../utils/analytics';

interface WeeklyMonthlyInsightsProps {
  weekly: WeeklyInsights;
  monthly: MonthlyInsights;
  referenceDate?: Date;
}

export const WeeklyMonthlyInsights: React.FC<WeeklyMonthlyInsightsProps> = ({
  weekly,
  monthly,
  referenceDate,
}) => {
  const displayDate = referenceDate || new Date(0);
  // Max duration in week for scaling bars
  const maxWeeklySec = Math.max(1, ...weekly.dailyBreakdown.map((d) => d.seconds));

  return (
    <div className="insights-grid">
      {/* Weekly Insights */}
      <section className="analytics-card weekly-card" aria-label="Weekly Insights">
        <div className="card-header">
          <div>
            <h2 className="card-title">Weekly Insights</h2>
            <p className="card-subtitle">Current week (Mon – Sun)</p>
          </div>
          <span className="card-stat-pill">{formatSecondsToSummary(weekly.totalSeconds)}</span>
        </div>

        {/* Minimal monochrome bar chart */}
        <div className="weekly-chart">
          {weekly.dailyBreakdown.map((day) => {
            const heightPct = Math.round((day.seconds / maxWeeklySec) * 100);
            return (
              <div key={day.dateKey} className="chart-col">
                <span className="col-val">
                  {day.seconds > 0 ? formatSecondsToSummary(day.seconds) : ''}
                </span>
                <div className="col-bar-track">
                  <div
                    className="col-bar-fill"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    title={`${day.dayName}: ${formatSecondsToDetailed(day.seconds)}`}
                  />
                </div>
                <span className="col-label">{day.dayName}</span>
              </div>
            );
          })}
        </div>

        <div className="card-footer-stats">
          <div className="footer-stat">
            <span className="stat-name">Daily Average</span>
            <span className="stat-num">{formatSecondsToSummary(weekly.averageSecondsPerDay)}</span>
          </div>
          <div className="footer-stat">
            <span className="stat-name">Active Days</span>
            <span className="stat-num">{weekly.activeDaysCount} / 7</span>
          </div>
          <div className="footer-stat">
            <span className="stat-name">Top Day</span>
            <span className="stat-num">
              {weekly.mostProductiveDay
                ? `${weekly.mostProductiveDay.dayName} (${formatSecondsToSummary(weekly.mostProductiveDay.seconds)})`
                : 'None'}
            </span>
          </div>
        </div>
      </section>

      {/* Monthly Insights */}
      <section className="analytics-card monthly-card" aria-label="Monthly Insights">
        <div className="card-header">
          <div>
            <h2 className="card-title">Monthly Insights</h2>
            <p className="card-subtitle">
              {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className="card-stat-pill">{formatSecondsToSummary(monthly.totalSeconds)}</span>
        </div>

        <div className="monthly-metrics-grid">
          <div className="monthly-metric-item">
            <span className="metric-label">Total Time</span>
            <span className="metric-value">{formatSecondsToSummary(monthly.totalSeconds)}</span>
            <span className="metric-sub">{formatSecondsToDetailed(monthly.totalSeconds)}</span>
          </div>
          <div className="monthly-metric-item">
            <span className="metric-label">Daily Average</span>
            <span className="metric-value">{formatSecondsToSummary(monthly.averageSecondsPerDay)}</span>
            <span className="metric-sub">across {monthly.daysInMonth} days</span>
          </div>
          <div className="monthly-metric-item">
            <span className="metric-label">Active Days</span>
            <span className="metric-value">
              {monthly.activeDaysCount} <small>/ {monthly.daysInMonth}</small>
            </span>
            <span className="metric-sub">
              {Math.round((monthly.activeDaysCount / monthly.daysInMonth) * 100)}% consistency
            </span>
          </div>
          <div className="monthly-metric-item">
            <span className="metric-label">Total Sessions</span>
            <span className="metric-value">{monthly.totalSessions}</span>
            <span className="metric-sub">{monthly.completedSessions} completed</span>
          </div>
        </div>
      </section>
    </div>
  );
};
