import React from 'react';
import type { StreakInfo } from '../types/session';

interface StreaksCardProps {
  streaks: StreakInfo;
}

export const StreaksCard: React.FC<StreaksCardProps> = ({ streaks }) => {
  return (
    <section className="analytics-card streaks-card" aria-label="Focus Streaks">
      <div className="card-header">
        <h2 className="card-title">Focus Streaks</h2>
        <span className="card-badge">Daily Consistency</span>
      </div>

      <div className="streaks-row">
        <div className="streak-box highlight-streak">
          <div className="streak-icon-wrap">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div className="streak-content">
            <span className="streak-title">Current Streak</span>
            <span className="streak-number">
              {streaks.currentStreak} <span className="streak-unit">{streaks.currentStreak === 1 ? 'day' : 'days'}</span>
            </span>
          </div>
        </div>

        <div className="streak-box">
          <div className="streak-icon-wrap">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34" />
              <path d="M18 9V4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v5a6 6 0 0 0 12 0Z" />
            </svg>
          </div>
          <div className="streak-content">
            <span className="streak-title">Best Streak</span>
            <span className="streak-number">
              {streaks.bestStreak} <span className="streak-unit">{streaks.bestStreak === 1 ? 'day' : 'days'}</span>
            </span>
          </div>
        </div>

        <div className="streak-box">
          <div className="streak-icon-wrap">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="streak-content">
            <span className="streak-title">Active Days</span>
            <span className="streak-number">
              {streaks.activeDaysCount} <span className="streak-unit">{streaks.activeDaysCount === 1 ? 'day' : 'days'}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
