import React, { useState } from 'react';
import type { DayFocusData } from '../types/session';
import { formatSecondsToDetailed, formatSecondsToSummary } from '../utils/analytics';

interface SessionHistoryListProps {
  dayMap: Map<string, DayFocusData>;
  onDeleteSession?: (id: string) => void;
  onClearAll?: () => void;
}

export const SessionHistoryList: React.FC<SessionHistoryListProps> = ({
  dayMap,
  onDeleteSession,
  onClearAll,
}) => {
  const [expandedDateKeys, setExpandedDateKeys] = useState<Set<string>>(new Set());

  // Filter only days with recorded activity and sort descending
  const activeDays = Array.from(dayMap.values())
    .filter((d) => d.totalDurationSeconds > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Find max day duration for percentage bar
  const maxDayDuration = Math.max(1, ...activeDays.map((d) => d.totalDurationSeconds));

  const toggleExpand = (dateKey: string) => {
    setExpandedDateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  return (
    <section className="analytics-card session-history-card" aria-label="Daily Focus History">
      <div className="card-header">
        <div>
          <h2 className="card-title">Daily History</h2>
          <p className="card-subtitle">Detailed breakdown of active focus days</p>
        </div>
        {activeDays.length > 0 && onClearAll && (
          <button
            type="button"
            className="btn-text-action"
            onClick={onClearAll}
            title="Clear all recorded sessions"
          >
            Clear History
          </button>
        )}
      </div>

      {activeDays.length > 0 ? (
        <div className="daily-history-list">
          {activeDays.map((day) => {
            const isExpanded = expandedDateKeys.has(day.dateKey);
            const barWidth = Math.round((day.totalDurationSeconds / maxDayDuration) * 100);

            return (
              <div key={day.dateKey} className="daily-history-item">
                <div
                  className="daily-history-summary-row"
                  onClick={() => toggleExpand(day.dateKey)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(day.dateKey);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="history-date-col">
                    <span className="history-date-title">
                      {day.date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="history-session-count">
                      {day.sessionCount} {day.sessionCount === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>

                  <div className="history-duration-col">
                    <div className="history-bar-track">
                      <div className="history-bar-fill" style={{ width: `${Math.max(4, barWidth)}%` }} />
                    </div>
                    <span className="history-duration-text">
                      {formatSecondsToSummary(day.totalDurationSeconds)}
                    </span>
                    <span className="history-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded individual sessions */}
                {isExpanded && (
                  <div className="daily-sessions-accordion">
                    {day.sessions.map((session) => (
                      <div key={session.id} className="history-session-subrow">
                        <div className="subrow-left">
                          <span className="session-type-pill">{session.mode}</span>
                          <span className="subrow-time">
                            {new Date(session.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="subrow-right">
                          <span className="subrow-duration">
                            {formatSecondsToDetailed(session.durationSeconds)}
                          </span>
                          {session.completed && <span className="subrow-check">✓</span>}
                          {onDeleteSession && (
                            <button
                              type="button"
                              className="btn-delete-session"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              aria-label="Delete session"
                              title="Delete this session record"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-box">
          <p className="empty-state-text">
            No focus history recorded yet. Complete your first focus session to start tracking!
          </p>
        </div>
      )}
    </section>
  );
};
