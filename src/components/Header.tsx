import React from 'react';
import type { TimerCalculations } from '../types/timer';

interface HeaderProps {
  statusLabel: TimerCalculations['statusLabel'];
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  isWakeLockActive: boolean;
  isWakeLockPreferred: boolean;
  isWakeLockSupported: boolean;
  isSoundEnabled: boolean;
  isInstallable: boolean;
  onToggleFullscreen: () => void;
  onToggleWakeLock: () => void;
  onToggleSound: () => void;
  onOpenInstallModal: () => void;
  onNavigateToHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statusLabel,
  isFullscreen,
  isFullscreenSupported,
  isWakeLockActive,
  isWakeLockPreferred,
  isWakeLockSupported,
  isSoundEnabled,
  isInstallable,
  onToggleFullscreen,
  onToggleWakeLock,
  onToggleSound,
  onOpenInstallModal,
  onNavigateToHistory,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <div className="brand-dot" />
          <span className="brand-name">FocusFlow</span>
        </div>
        <div className={`status-pill status-${statusLabel.toLowerCase()}`}>
          <span className="status-indicator-dot" />
          <span className="status-text">{statusLabel}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Navigation to Focus History */}
        <button
          type="button"
          className="icon-btn btn-history-nav"
          onClick={onNavigateToHistory}
          aria-label="View Focus History and Analytics"
          title="Focus History & Heatmap"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          className={`icon-btn ${isSoundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          aria-label={isSoundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
          title={isSoundEnabled ? 'Sound alerts on' : 'Sound alerts muted'}
        >
          {isSoundEnabled ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        {/* Screen Awake Toggle */}
        <button
          type="button"
          className={`icon-btn ${isWakeLockActive ? 'active' : isWakeLockPreferred ? 'active' : ''}`}
          onClick={onToggleWakeLock}
          aria-label={
            !isWakeLockSupported
              ? 'Screen awake not supported on this browser'
              : isWakeLockPreferred
              ? 'Screen awake is enabled'
              : 'Keep screen awake during sessions'
          }
          title={
            !isWakeLockSupported
              ? 'Screen awake not supported'
              : isWakeLockActive
              ? 'Screen awake: Active (Display will stay on)'
              : isWakeLockPreferred
              ? 'Screen awake: Armed (Will activate during session)'
              : 'Screen awake: Off'
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          {isWakeLockActive && <span className="active-dot" />}
        </button>

        {/* Fullscreen Toggle */}
        {isFullscreenSupported && (
          <button
            type="button"
            className={`icon-btn ${isFullscreen ? 'active' : ''}`}
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
        )}

        {/* Install App button / guide */}
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenInstallModal}
          aria-label="Install FocusFlow Web App"
          title="Install app to Home Screen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isInstallable && <span className="notification-dot" />}
        </button>
      </div>
    </header>
  );
};
