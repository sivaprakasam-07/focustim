import React from 'react';
import type { TimerStatus } from '../types/timer';
import { playUiClick, triggerHaptic } from '../utils/sound';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRequestReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onRequestReset,
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

  return (
    <div className="timer-controls-container">
      <div className="controls-row">
        {/* Reset button: visible whenever not in pure idle state */}
        {status !== 'idle' && (
          <button
            type="button"
            className="btn btn-control btn-reset"
            onClick={handleResetClick}
            aria-label="Reset Timer"
            title="Reset timer (Key: R)"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="btn-label">Reset</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          className={`btn btn-control btn-primary-action ${status === 'running' ? 'btn-pause' : 'btn-start'}`}
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
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
              <span>Pause</span>
            </>
          ) : status === 'paused' ? (
            <>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Resume</span>
            </>
          ) : status === 'completed' ? (
            <>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Restart</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Focus</span>
            </>
          )}
        </button>
      </div>

      <div className="shortcuts-hint">
        <span>Space: Start/Pause</span>
        <span className="dot">•</span>
        <span>R: Reset</span>
      </div>
    </div>
  );
};
