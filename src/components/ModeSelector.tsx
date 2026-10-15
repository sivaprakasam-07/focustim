import React from 'react';
import type { TimerMode, TimerStatus } from '../types/timer';

interface ModeSelectorProps {
  currentMode: TimerMode;
  status: TimerStatus;
  onRequestChangeMode: (newMode: TimerMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onRequestChangeMode,
}) => {
  return (
    <div className="mode-selector-container">
      <div className="mode-segmented-control" role="tablist" aria-label="Timer Mode">
        <button
          type="button"
          role="tab"
          aria-selected={currentMode === 'countdown'}
          className={`mode-btn ${currentMode === 'countdown' ? 'active' : ''}`}
          onClick={() => onRequestChangeMode('countdown')}
        >
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 8 14" />
          </svg>
          <span>Countdown</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentMode === 'stopwatch'}
          className={`mode-btn ${currentMode === 'stopwatch' ? 'active' : ''}`}
          onClick={() => onRequestChangeMode('stopwatch')}
        >
          <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3 2 6" />
            <path d="m22 6-3-3" />
            <path d="M12 5V2" />
          </svg>
          <span>Stopwatch</span>
        </button>
      </div>
    </div>
  );
};
