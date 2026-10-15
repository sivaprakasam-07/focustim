import React from 'react';
import type { TimerState, TimerCalculations } from '../types/timer';
import { formatDuration } from '../utils/timerCalculations';

interface CircularTimerProps {
  state: TimerState;
  calculations: TimerCalculations;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  state,
  calculations,
}) => {
  const { mode, status, targetDurationMs } = state;
  const { elapsedMs, progressPercent, formattedTime, statusLabel } = calculations;

  // Geometry: SVG ViewBox 320 x 320, center 160, 160
  const size = 320;
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2; // (320 - 24)/2 = 148
  const circumference = 2 * Math.PI * radius; // ~929.91

  // Countdown mode progress (fills as session advances)
  const strokeDashoffset =
    mode === 'countdown'
      ? circumference - (progressPercent / 100) * circumference
      : 0;

  return (
    <div className={`timer-circle-wrapper status-${status} mode-${mode}`}>
      <div className="svg-container">
        <svg
          className="timer-svg"
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="100%"
        >
          {/* Background track (monochrome inactive track #292929) */}
          <circle
            className="timer-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#292929"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Countdown active progress ring (pure white #FFFFFF) */}
          {mode === 'countdown' ? (
            <circle
              className="timer-progress"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke="#FFFFFF"
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : (
            /* Stopwatch: Subtle monochrome rotating activity indicator */
            <circle
              className={`stopwatch-ring ${status === 'running' ? 'rotating' : ''}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="#FFFFFF"
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="timer-center-content">
          <span className={`center-status-badge status-tag-${status}`}>
            {statusLabel}
          </span>

          <h1 className="timer-digits" aria-label={`Timer: ${formattedTime}`}>
            {formattedTime}
          </h1>

          <div className="timer-subinfo">
            {mode === 'countdown' ? (
              status === 'completed' ? (
                <span className="celebration-msg">
                  Session Complete • Focus Recorded
                </span>
              ) : (
                <div className="countdown-stats">
                  <span>Elapsed: {formatDuration(elapsedMs, false)}</span>
                  <span className="stat-separator">•</span>
                  <span>Target: {formatDuration(targetDurationMs, false)}</span>
                  <span className="stat-separator">•</span>
                  <span className="stat-percent">{Math.round(progressPercent)}%</span>
                </div>
              )
            ) : (
              <span className="stopwatch-stat">
                {status === 'running' ? 'Active Focus Session' : 'Stopwatch'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
