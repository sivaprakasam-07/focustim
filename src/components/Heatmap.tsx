import React, { useState } from 'react';
import type { DayFocusData } from '../types/session';
import {
  generateYearlyHeatmap,
  HEATMAP_COLORS,
  formatSecondsToDetailed,
} from '../utils/analytics';

interface HeatmapProps {
  dayMap: Map<string, DayFocusData>;
}

export const Heatmap: React.FC<HeatmapProps> = ({ dayMap }) => {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const heatmap = generateYearlyHeatmap(dayMap);
  const selectedData = selectedDateKey ? dayMap.get(selectedDateKey) || null : null;

  const handleCellClick = (dateKey: string) => {
    setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey));
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <section className="analytics-card heatmap-card" aria-label="Yearly Focus Activity Heatmap">
      <div className="card-header">
        <div>
          <h2 className="card-title">Yearly Activity</h2>
          <p className="card-subtitle">
            {heatmap.totalActiveDays} active {heatmap.totalActiveDays === 1 ? 'day' : 'days'} •{' '}
            {formatSecondsToDetailed(heatmap.totalFocusedSeconds)} focused in the last 365 days
          </p>
        </div>
      </div>

      <div className="heatmap-scroll-container">
        <div className="heatmap-grid-wrapper">
          {/* Month labels row */}
          <div className="heatmap-months-row">
            <div className="day-label-placeholder" />
            <div className="month-labels-track">
              {heatmap.monthLabels.map((m, idx) => (
                <span
                  key={`${m.name}-${idx}`}
                  className="month-label"
                  style={{ left: `${m.weekIndex * 15}px` }}
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          <div className="heatmap-body">
            {/* Weekday indicators */}
            <div className="heatmap-day-labels">
              {dayLabels.map((label, idx) => (
                <span key={idx} className="day-label">
                  {label}
                </span>
              ))}
            </div>

            {/* Matrix of weeks and days */}
            <div className="heatmap-weeks-track">
              {heatmap.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="heatmap-week-col">
                  {week.map((cell) => {
                    const isSelected = selectedDateKey === cell.dateKey;
                    const durationSec = cell.data ? cell.data.totalDurationSeconds : 0;
                    const formattedDate = cell.date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    const tooltipText = `${formattedDate}: ${
                      durationSec > 0 ? formatSecondsToDetailed(durationSec) : 'No focus recorded'
                    }`;

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        className={`heatmap-cell ${isSelected ? 'selected' : ''}`}
                        style={{ backgroundColor: HEATMAP_COLORS[cell.level] }}
                        onClick={() => handleCellClick(cell.dateKey)}
                        aria-label={tooltipText}
                        title={tooltipText}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-footer">
        <span className="legend-label">Less</span>
        <div className="heatmap-legend-cells">
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              className="legend-cell"
              style={{ backgroundColor: HEATMAP_COLORS[lvl as 0 | 1 | 2 | 3 | 4] }}
              title={`Level ${lvl}`}
            />
          ))}
        </div>
        <span className="legend-label">More</span>
      </div>

      {/* Selected Day Inspector */}
      {selectedDateKey && (
        <div className="day-inspector">
          <div className="day-inspector-header">
            <div>
              <span className="inspector-date">
                {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <p className="inspector-summary">
                {selectedData && selectedData.totalDurationSeconds > 0 ? (
                  <>
                    <strong>{formatSecondsToDetailed(selectedData.totalDurationSeconds)}</strong> across{' '}
                    {selectedData.sessionCount} {selectedData.sessionCount === 1 ? 'session' : 'sessions'}{' '}
                    ({selectedData.completedCount} completed)
                  </>
                ) : (
                  'No focus activity recorded on this day.'
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn-close-inspector"
              onClick={() => setSelectedDateKey(null)}
              aria-label="Close day details"
            >
              ✕
            </button>
          </div>

          {selectedData && selectedData.sessions.length > 0 && (
            <div className="inspector-sessions-list">
              {selectedData.sessions.map((s, idx) => (
                <div key={s.id || idx} className="inspector-session-item">
                  <span className="session-mode-badge">{s.mode}</span>
                  <span className="session-time">
                    {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="session-duration">
                    {formatSecondsToDetailed(s.durationSeconds)}
                  </span>
                  {s.completed && <span className="session-completed-tag">✓ Completed</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
