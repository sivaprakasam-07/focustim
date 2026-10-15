import React from 'react';
import type { TimerStatus } from '../types/timer';
import { PRESET_MINUTES } from '../types/timer';

interface DurationSelectorProps {
  selectedMinutes: number;
  status: TimerStatus;
  onRequestSelectDuration: (minutes: number) => void;
  onOpenCustomModal: () => void;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedMinutes,
  status,
  onRequestSelectDuration,
  onOpenCustomModal,
}) => {
  const isCustom = !(PRESET_MINUTES as readonly number[]).includes(selectedMinutes);

  return (
    <div className={`duration-selector-wrapper ${status === 'running' ? 'dimmed' : ''}`}>
      <div className="duration-scroll-container">
        {PRESET_MINUTES.map((mins) => {
          const isSelected = selectedMinutes === mins;
          return (
            <button
              key={mins}
              type="button"
              className={`preset-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onRequestSelectDuration(mins)}
              aria-label={`Set countdown to ${mins} minutes`}
              aria-pressed={isSelected}
            >
              {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
            </button>
          );
        })}

        <button
          type="button"
          className={`preset-chip custom-chip ${isCustom ? 'selected' : ''}`}
          onClick={onOpenCustomModal}
          aria-label="Set custom countdown duration"
          aria-pressed={isCustom}
        >
          {isCustom ? `${selectedMinutes}m (Custom)` : 'Custom'}
        </button>
      </div>
    </div>
  );
};
