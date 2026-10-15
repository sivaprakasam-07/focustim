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
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2; // (320 - 28)/2 = 146
  const circumference = 2 * Math.PI * radius; // ~917.34

  // In countdown mode: progress goes from 0% to 100%
  // SVG stroke-dashoffset:
  // At 0% elapsed: offset = circumference (empty) or 0 (full)
  // Traditional focus timers start full and drain down, or fill up.
  // Requirement: "progress = elapsedDuration / targetDuration. Clamp progress to the range 0-100%."
  // Having the ring reflect elapsed progress filling smoothly as focus progresses is standard and very rewarding!
  const strokeDashoffset =
    mode === 'countdown'
      ? circumference - (progressPercent / 100) * circumference
      : 0;

  // Get color theme based on status
  const getGradients = () => {
    switch (status) {
      case 'completed':
        return {
          start: '#A855F7', // Radiant Purple
          mid: '#EC4899',   // Pink
          end: '#8B5CF6',
          glow: 'rgba(168, 85, 247, 0.45)',
        };
      case 'paused':
        return {
          start: '#F59E0B', // Amber
          mid: '#FBBF24',
          end: '#D97706',
          glow: 'rgba(245, 158, 11, 0.35)',
        };
      case 'running':
        return {
          start: '#6366F1', // Indigo to Cyan/Emerald
          mid: '#38BDF8',
          end: '#10B981',
          glow: 'rgba(56, 189, 248, 0.4)',
        };
      default: // idle
        return {
          start: '#6366F1',
          mid: '#818CF8',
          end: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.25)',
        };
    }
  };

  const gradients = getGradients();

  return (
    <div className={`timer-circle-wrapper status-${status} mode-${mode}`}>
      <div className="svg-container">
        <svg
          className="timer-svg"
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradients.start} />
              <stop offset="50%" stopColor={gradients.mid} />
              <stop offset="100%" stopColor={gradients.end} />
            </linearGradient>

            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            className="timer-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />

          {/* Countdown active progress ring */}
          {mode === 'countdown' ? (
            <circle
              className="timer-progress"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke="url(#timerGradient)"
              filter="url(#ringGlow)"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : (
            /* Stopwatch: Elegant continuous pulse/orbital activity indicator when running, static when idle */
            <circle
              className={`stopwatch-ring ${status === 'running' ? 'rotating' : ''}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="url(#timerGradient)"
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              strokeLinecap="round"
              filter="url(#ringGlow)"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="timer-center-content">
          <span className="center-status-badge">
            {statusLabel}
          </span>

          <h1 className="timer-digits" aria-label={`Timer: ${formattedTime}`}>
            {formattedTime}
          </h1>

          <div className="timer-subinfo">
            {mode === 'countdown' ? (
              status === 'completed' ? (
                <span className="celebration-msg">
                  🎉 Session Complete! Take a deep breath.
                </span>
              ) : (
                <div className="countdown-stats">
                  <span>
                    Elapsed: {formatDuration(elapsedMs, false)}
                  </span>
                  <span className="stat-separator">•</span>
                  <span>
                    Target: {formatDuration(targetDurationMs, false)}
                  </span>
                  <span className="stat-separator">•</span>
                  <span className="stat-percent">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              )
            ) : (
              <span className="stopwatch-stat">
                {status === 'running' ? 'Active Focus Stopwatch' : 'Stopwatch Session'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
