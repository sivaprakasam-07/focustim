import React from 'react';
import type { TimerMode, TimerStatus } from '../types/timer';
import { playUiClick, triggerHaptic } from '../utils/sound';

interface TimerControlsProps {
  mode: TimerMode;
  status: TimerStatus;
  elapsedMs: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRequestReset: () => void;
  onFinishStopwatch?: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  mode,
  status,
  elapsedMs,
  onStart,
  onPause,
  onResume,
  onRequestReset,
  onFinishStopwatch,
}) => {
  const handlePrimaryClick = () => {
    playUiClick();
    triggerHaptic(30);

    if (status === 'idle') {
      onStart();
    } else if (status === 'running') {
      onPause();
    } else if (status === 'paused') {
      onResume();
    } else if (status === 'completed') {
      onStart();
    }
  };

  const handleResetClick = () => {
    playUiClick();
    triggerHaptic(30);
    onRequestReset();
  };

  const handleFinishStopwatchClick = () => {
    playUiClick();
    triggerHaptic(40);
    if (onFinishStopwatch) {
      onFinishStopwatch();
    }
  };

  // Stopwatch can be finished when paused or running with >= 5 seconds
  const showFinishStopwatch =
    mode === 'stopwatch' &&
    (status === 'paused' || status === 'running') &&
    elapsedMs >= 5000;

  return (
    <div className="timer-controls-container">
      <div className="controls-row">
        {/* Reset button: visible whenever not in pure idle state */}
        {status !== 'idle' && (
          <button
            type="button"
            className="btn btn-control btn-secondary-action"
            onClick={handleResetClick}
            aria-label="Reset Timer"
            title="Reset timer (Key: R)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="btn-label">Reset</span>
          </button>
        )}

        {/* Primary Action Button (Start / Pause / Resume / Restart) */}
        <button
          type="button"
          className={`btn btn-control btn-primary-action ${status === 'running' ? 'btn-active-running' : ''}`}
          onClick={handlePrimaryClick}
          aria-label={
            status === 'running'
              ? 'Pause timer'
              : status === 'paused'
              ? 'Resume timer'
              : status === 'completed'
              ? 'Start new session'
              : 'Start timer'
          }
          title="Toggle timer (Spacebar)"
        >
          {status === 'running' ? (
            <>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
              <span>Pause</span>
            </>
          ) : status === 'paused' ? (
            <>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Resume</span>
            </>
          ) : status === 'completed' ? (
            <>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Restart</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Focus</span>
            </>
          )}
        </button>

        {/* Stopwatch Finish & Save Button */}
        {showFinishStopwatch && (
          <button
            type="button"
            className="btn btn-control btn-finish-action"
            onClick={handleFinishStopwatchClick}
            aria-label="Finish and save stopwatch session"
            title="Finish & Save Focus"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="btn-label">Finish</span>
          </button>
        )}
      </div>

      <div className="shortcuts-hint">
        <span>Space: Start/Pause</span>
        <span className="dot">•</span>
        <span>R: Reset</span>
      </div>
    </div>
  );
};
