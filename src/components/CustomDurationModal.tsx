import React, { useState, useEffect } from 'react';
import { validateCustomMinutes } from '../utils/timerCalculations';

interface CustomDurationModalProps {
  isOpen: boolean;
  currentMinutes: number;
  onSave: (minutes: number) => void;
  onClose: () => void;
}

export const CustomDurationModal: React.FC<CustomDurationModalProps> = ({
  isOpen,
  currentMinutes,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState<string>(() => currentMinutes.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateCustomMinutes(value);
    if (!res.valid) {
      setError(res.error || 'Invalid value');
      return;
    }
    onSave(res.minutes);
    onClose();
  };

  const adjustMinutes = (delta: number) => {
    const current = parseInt(value, 10);
    const base = isNaN(current) ? 25 : current;
    const next = Math.max(1, Math.min(1440, base + delta));
    setValue(next.toString());
    setError(null);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="custom-modal-title" className="modal-title">Custom Duration</h3>
        <p className="modal-message">Set a customized focus session length in minutes.</p>

        <form onSubmit={handleSubmit}>
          <div className="custom-input-group">
            <div className="quick-adjust-row">
              <button
                type="button"
                className="btn-quick-adjust"
                onClick={() => adjustMinutes(-5)}
                aria-label="Subtract 5 minutes"
              >
                -5m
              </button>
              <button
                type="button"
                className="btn-quick-adjust"
                onClick={() => adjustMinutes(-1)}
                aria-label="Subtract 1 minute"
              >
                -1m
              </button>

              <div className="input-with-unit">
                <input
                  type="number"
                  inputMode="numeric"
                  className="duration-number-input"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  min="1"
                  max="1440"
                  autoFocus
                  required
                />
                <span className="input-unit">min</span>
              </div>

              <button
                type="button"
                className="btn-quick-adjust"
                onClick={() => adjustMinutes(1)}
                aria-label="Add 1 minute"
              >
                +1m
              </button>
              <button
                type="button"
                className="btn-quick-adjust"
                onClick={() => adjustMinutes(5)}
                aria-label="Add 5 minutes"
              >
                +5m
              </button>
            </div>

            {error && <p className="input-error-msg">{error}</p>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Apply Duration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
