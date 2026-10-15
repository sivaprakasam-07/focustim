import React from 'react';

interface InstallModalProps {
  isOpen: boolean;
  isIos: boolean;
  onInstallClick?: () => void;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  isIos,
  onInstallClick,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="install-modal-header">
          <div className="app-badge-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 id="install-modal-title" className="modal-title">Install FocusFlow</h3>
            <p className="modal-subtitle">Add to your home screen for distraction-free full screen focus.</p>
          </div>
        </div>

        {isIos ? (
          <div className="install-steps">
            <div className="install-step">
              <span className="step-num">1</span>
              <span>Tap the <strong>Share</strong> icon in Safari’s bottom toolbar:</span>
              <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <div className="install-step">
              <span className="step-num">2</span>
              <span>Scroll down and tap <strong>Add to Home Screen</strong>:</span>
              <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="install-step">
              <span className="step-num">3</span>
              <span>Tap <strong>Add</strong> in the top right corner.</span>
            </div>
          </div>
        ) : (
          <div className="install-steps">
            <p className="install-desc">
              Installing FocusFlow adds an icon to your phone launcher, enables 100% offline access, and removes all browser address bars.
            </p>
            {onInstallClick ? (
              <button
                type="button"
                className="btn btn-primary btn-full-width"
                onClick={onInstallClick}
              >
                Install Now (1-Tap)
              </button>
            ) : (
              <div className="install-step">
                <span className="step-num">ℹ</span>
                <span>Open browser menu (⋮) and tap <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</span>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-full-width"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
