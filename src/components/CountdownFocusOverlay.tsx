import React, { useEffect, useRef, useState } from 'react';
import { Check, EyeOff, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import { playCountdownTick, triggerGentleVibration } from '../services/feedbackService';

interface CountdownFocusOverlayProps {
  open: boolean;
  initialMode: 'countdown' | 'focus';
  taskTitle?: string;
  onClose: () => void;
}

export const CountdownFocusOverlay: React.FC<CountdownFocusOverlayProps> = ({
  open,
  initialMode,
  taskTitle,
  onClose,
}) => {
  const { state, recordPositiveActionOnce } = useNudge();
  const configuredSeconds = Math.max(3, state.settings.countdownSeconds || 10);

  const [mode, setMode] = useState<'countdown' | 'focus'>(initialMode);
  const [selectedTask, setSelectedTask] = useState(taskTitle || 'Just start for one tiny moment');
  const [secondsLeft, setSecondsLeft] = useState(configuredSeconds);
  const [running, setRunning] = useState(false);
  const [startedFocus, setStartedFocus] = useState(false);
  const [focusElapsed, setFocusElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setSelectedTask(taskTitle || 'Begin with one small step');
    setSecondsLeft(configuredSeconds);
    setFocusElapsed(0);
    setStartedFocus(false);
    setRunning(initialMode === 'countdown' ? state.settings.countdownAutoStart : true);
  }, [open, initialMode, taskTitle, configuredSeconds, state.settings.countdownAutoStart]);

  useEffect(() => {
    if (!open || !running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (mode === 'countdown') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            playCountdownTick(state.settings.soundEnabled, true);
            triggerGentleVibration(state.settings.vibrationEnabled, [30, 40, 30]);
            setStartedFocus(true);
            setMode('focus');
            return 0;
          }
          playCountdownTick(state.settings.soundEnabled, false);
          return prev - 1;
        });
      } else {
        setFocusElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open, running, mode, state.settings.soundEnabled, state.settings.vibrationEnabled]);

  if (!open) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const focusBgClass =
    state.settings.focusBackground === 'deep'
      ? 'bg-[#131614] text-[#F2EFE9]'
      : state.settings.focusBackground === 'botanical'
      ? 'bg-[#E9EFE5] dark:bg-[#19201A] text-[var(--nudge-ink)]'
      : 'bg-[var(--nudge-canvas)] text-[var(--nudge-ink)]';

  const handleCompleteFocus = () => {
    recordPositiveActionOnce({
      sourceType: 'just-one-thing',
      sourceId: 'focus-start',
      itemId: `${Date.now()}`,
      label: selectedTask,
      category: 'Focus & Starting',
    });
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-10 transition-colors ${focusBgClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'countdown' ? 'Just Start countdown' : 'Focus Mode'}
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full pt-safe">
        <div className="flex items-center gap-2 text-xs font-medium opacity-75">
          {mode === 'countdown' ? <Timer className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>{mode === 'countdown' ? 'Just Start Countdown' : 'Focus Mode'}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 rounded-full glass-panel text-xs font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <X className="w-4 h-4" />
          Exit
        </button>
      </div>

      <div className="max-w-lg mx-auto w-full flex flex-col items-center text-center my-auto py-8">
        <label className="w-full mb-6">
          <span className="sr-only">Task to focus on</span>
          <input
            type="text"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            placeholder="What tiny step are you starting?"
            className="w-full text-center font-display text-2xl md:text-3xl font-medium bg-transparent border-b border-current/15 pb-2 focus:outline-none focus:border-[var(--nudge-accent)]"
          />
        </label>

        {mode === 'countdown' ? (
          <>
            <div className="w-48 h-48 rounded-full glass-panel-strong flex flex-col items-center justify-center mb-6">
              <span className="font-mono-num text-6xl font-semibold tracking-tight">
                {secondsLeft}
              </span>
              <span className="text-xs opacity-70 mt-1">
                {running ? 'Gentle launch...' : `${configuredSeconds}s configured`}
              </span>
            </div>
            <p className="text-sm opacity-75 max-w-sm mb-8">
              You only have to begin when the countdown reaches zero. Stopping after 30 seconds is completely allowed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="tactile-btn min-h-[48px] px-6 rounded-2xl font-semibold text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--nudge-accent)',
                  color: 'var(--nudge-accent-ink)',
                }}
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? 'Pause' : 'Just Start'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(configuredSeconds);
                }}
                className="min-h-[48px] px-4 rounded-2xl glass-panel text-sm font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('focus');
                  setRunning(true);
                }}
                className="min-h-[48px] px-4 rounded-2xl glass-panel text-sm font-medium"
              >
                Skip to Focus
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-52 h-52 rounded-full glass-panel-strong flex flex-col items-center justify-center mb-6">
              <span className="font-mono-num text-5xl font-semibold tracking-tight">
                {formatDuration(focusElapsed)}
              </span>
              <span className="text-xs opacity-70 mt-2">
                {startedFocus ? 'You started—well done' : 'Calm focus active'}
              </span>
            </div>
            <p className="text-sm opacity-75 max-w-sm mb-8">
              Secondary navigation and alerts are tucked away so you can stay with this single step.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="min-h-[48px] px-5 rounded-2xl glass-panel text-sm font-medium flex items-center gap-2"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? 'Pause' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={handleCompleteFocus}
                className="tactile-btn min-h-[48px] px-6 rounded-2xl text-sm font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--nudge-accent)',
                  color: 'var(--nudge-accent-ink)',
                }}
              >
                <Check className="w-4 h-4" />
                I did something
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-xs opacity-60 pb-safe">
        Adjust countdown duration and background in Settings
      </div>
    </div>
  );
};
