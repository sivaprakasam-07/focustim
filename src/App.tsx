import { useState, useEffect, useCallback } from 'react';
import type { TimerMode } from './types/timer';
import { useTimer } from './hooks/useTimer';
import { useFullscreen } from './hooks/useFullscreen';
import { usePwaInstall } from './hooks/usePwaInstall';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { DurationSelector } from './components/DurationSelector';
import { CircularTimer } from './components/CircularTimer';
import { TimerControls } from './components/TimerControls';
import { ConfirmModal } from './components/ConfirmModal';
import { CustomDurationModal } from './components/CustomDurationModal';
import { InstallModal } from './components/InstallModal';

export function App() {
  const {
    state,
    preferences,
    calculations,
    isWakeLockSupported,
    isWakeLockActive,
    start,
    pause,
    resume,
    reset,
    setCountdownDuration,
    switchMode,
    toggleSound,
    toggleWakeLockPreference,
  } = useTimer();

  const {
    isFullscreen,
    isSupported: isFullscreenSupported,
    toggleFullscreen,
  } = useFullscreen();

  const {
    isInstallable,
    isIos,
    promptInstall,
  } = usePwaInstall();

  // Modals state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [isCustomDurationOpen, setIsCustomDurationOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Safe Reset
  const handleRequestReset = useCallback(() => {
    if (state.status === 'running' || state.status === 'paused') {
      setConfirmConfig({
        isOpen: true,
        title: 'Reset Active Session?',
        message: 'Your current focus progress will be reset. Are you sure you want to proceed?',
        confirmLabel: 'Reset Session',
        onConfirm: () => {
          reset();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      reset();
    }
  }, [state.status, reset]);

  // Safe Mode Switch
  const handleRequestChangeMode = useCallback((newMode: TimerMode) => {
    if (newMode === state.mode) return;

    if (state.status === 'running' || state.status === 'paused') {
      setConfirmConfig({
        isOpen: true,
        title: 'Switch Timer Mode?',
        message: 'Switching modes will discard your active session. Do you wish to continue?',
        confirmLabel: 'Switch Mode',
        onConfirm: () => {
          switchMode(newMode);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      switchMode(newMode);
    }
  }, [state.mode, state.status, switchMode]);

  // Safe Duration Change
  const handleRequestSelectDuration = useCallback((minutes: number) => {
    if (state.status === 'running' || state.status === 'paused') {
      setConfirmConfig({
        isOpen: true,
        title: 'Change Duration?',
        message: 'Changing duration will reset your current countdown session. Continue?',
        confirmLabel: 'Change Duration',
        onConfirm: () => {
          setCountdownDuration(minutes);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setCountdownDuration(minutes);
    }
  }, [state.status, setCountdownDuration]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs or when modals are open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        confirmConfig.isOpen ||
        isCustomDurationOpen ||
        isInstallModalOpen
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (state.status === 'idle') start();
        else if (state.status === 'running') pause();
        else if (state.status === 'paused') resume();
        else if (state.status === 'completed') start();
      } else if (e.key === 'r' || e.key === 'R') {
        if (state.status !== 'idle') {
          handleRequestReset();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (isFullscreenSupported) {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.status,
    confirmConfig.isOpen,
    isCustomDurationOpen,
    isInstallModalOpen,
    start,
    pause,
    resume,
    handleRequestReset,
    isFullscreenSupported,
    toggleFullscreen,
  ]);

  // Handle Install Action
  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (!accepted) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <div className="app-container">
      <Header
        statusLabel={calculations.statusLabel}
        isFullscreen={isFullscreen}
        isFullscreenSupported={isFullscreenSupported}
        isWakeLockActive={isWakeLockActive}
        isWakeLockPreferred={preferences.wakeLockPreferred}
        isWakeLockSupported={isWakeLockSupported}
        isSoundEnabled={preferences.soundEnabled}
        isInstallable={isInstallable}
        onToggleFullscreen={toggleFullscreen}
        onToggleWakeLock={toggleWakeLockPreference}
        onToggleSound={toggleSound}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      <main className="main-stage">
        <ModeSelector
          currentMode={state.mode}
          status={state.status}
          onRequestChangeMode={handleRequestChangeMode}
        />

        {state.mode === 'countdown' && (
          <DurationSelector
            selectedMinutes={preferences.selectedPresetMinutes}
            status={state.status}
            onRequestSelectDuration={handleRequestSelectDuration}
            onOpenCustomModal={() => setIsCustomDurationOpen(true)}
          />
        )}

        <CircularTimer
          state={state}
          calculations={calculations}
        />
      </main>

      <TimerControls
        status={state.status}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onRequestReset={handleRequestReset}
      />

      {/* Confirmation Safeguard Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        isDestructive={true}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Custom Duration Selection Modal */}
      <CustomDurationModal
        isOpen={isCustomDurationOpen}
        currentMinutes={preferences.selectedPresetMinutes}
        onSave={(mins) => handleRequestSelectDuration(mins)}
        onClose={() => setIsCustomDurationOpen(false)}
      />

      {/* PWA Home Screen Installation Guide Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        isIos={isIos}
        onInstallClick={isInstallable ? handleInstallClick : undefined}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}

export default App;
