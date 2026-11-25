import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pause, Play, Sparkles, Sun, X } from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import { Routine, RoutineVersionType } from '../types/nudge';

interface GuidedRoutineOverlayProps {
  open: boolean;
  routine: Routine | null;
  startMyDayMode?: boolean;
  onClose: () => void;
  onSelectRoutine?: (routine: Routine) => void;
  onOpenBareMinimum?: () => void;
}

const VERSION_LABELS: Record<RoutineVersionType, string> = {
  full: 'Full Version',
  normal: 'Normal Version',
  quick: 'Quick Version',
  'low-energy': 'Low Energy Version',
  'bare-minimum': 'Bare Minimum Version',
};

export const GuidedRoutineOverlay: React.FC<GuidedRoutineOverlayProps> = ({
  open,
  routine,
  startMyDayMode,
  onClose,
  onSelectRoutine,
  onOpenBareMinimum,
}) => {
  const { state, isActionCompletedToday, togglePositiveAction } = useNudge();
  const [selectedVersion, setSelectedVersion] = useState<RoutineVersionType>('normal');
  const [index, setIndex] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !routine) return;
    // Suggest version based on energy level if available
    const energy = state.settings.energyLevel;
    let preferred: RoutineVersionType = routine.activeVersion || 'normal';
    if (energy === 'very-low' && routine.versions['bare-minimum']?.activities.length) {
      preferred = 'bare-minimum';
    } else if (energy === 'low' && routine.versions['low-energy']?.activities.length) {
      preferred = 'low-energy';
    }
    if (!routine.versions[preferred]?.activities.length) {
      const firstPopulated = (Object.keys(routine.versions) as RoutineVersionType[]).find(
        (v) => (routine.versions[v]?.activities.length || 0) > 0
      );
      if (firstPopulated) preferred = firstPopulated;
    }
    setSelectedVersion(preferred);
    setIndex(0);
    setElapsedSec(0);
    setTimerRunning(false);
  }, [open, routine, state.settings.energyLevel]);

  useEffect(() => {
    if (!open || !timerRunning) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [open, timerRunning]);

  if (!open) return null;

  const activeRoutines = state.routines.filter((r) => !r.archived);

  // Start My Day chooser when no specific routine was selected yet
  if (!routine && startMyDayMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[var(--nudge-canvas)] p-6 md:p-10 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Start My Day"
      >
        <div className="max-w-xl mx-auto w-full flex flex-col gap-6 my-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--nudge-muted)]">
              <Sun className="w-4 h-4" />
              <span>Start My Day</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-full glass-panel text-xs font-medium flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>

          <div>
            <h2 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)]">
              How would you like to begin today?
            </h2>
            <p className="text-sm text-[var(--nudge-muted)] mt-1.5">
              Choose a routine to move through step by step, or start gently with daily essentials.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {activeRoutines.map((r) => {
              const count = r.versions[r.activeVersion]?.activities.length || 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRoutine?.(r)}
                  className="glass-panel rounded-2xl p-4 text-left flex items-center justify-between gap-4 hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{r.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base text-[var(--nudge-ink)] truncate">
                        {r.name}
                      </p>
                      <p className="text-xs text-[var(--nudge-muted)]">
                        {count} {count === 1 ? 'step' : 'steps'} · {VERSION_LABELS[r.activeVersion]}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--nudge-muted)] shrink-0" />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBareMinimum?.();
              }}
              className="glass-panel rounded-2xl p-4 text-left flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <p className="font-medium text-sm md:text-base text-[var(--nudge-ink)]">
                    Bare Minimum Essentials
                  </p>
                  <p className="text-xs text-[var(--nudge-muted)]">
                    Drink something, brush teeth, or pick one small care step
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--nudge-muted)] shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!routine) return null;

  const availableVersions = (Object.keys(routine.versions) as RoutineVersionType[]).filter(
    (v) => (routine.versions[v]?.activities.length || 0) > 0
  );
  const activities = routine.versions[selectedVersion]?.activities || [];
  const current = activities[index];
  const completedCount = activities.filter((a) =>
    isActionCompletedToday('routine-activity', routine.id, `${selectedVersion}_${a.id}`)
  ).length;
  const progressPct = activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0;
  const isCurrentDone = current
    ? isActionCompletedToday('routine-activity', routine.id, `${selectedVersion}_${current.id}`)
    : false;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[var(--nudge-canvas)] p-5 md:p-10 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Guided mode for ${routine.name}`}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-3 pt-safe">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl">{routine.emoji}</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-medium text-[var(--nudge-ink)] truncate">
                {routine.name}
              </h2>
              <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                {completedCount} of {activities.length} completed · {progressPct}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-full glass-panel text-xs font-medium flex items-center gap-1.5 shrink-0"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>

        {/* Progress track */}
        <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: routine.color || 'var(--nudge-accent)' }}
          />
        </div>

        {availableVersions.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {availableVersions.map((ver) => (
              <button
                key={ver}
                type="button"
                onClick={() => {
                  setSelectedVersion(ver);
                  setIndex(0);
                  setElapsedSec(0);
                  setTimerRunning(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedVersion === ver
                    ? 'bg-[var(--nudge-accent)] text-white'
                    : 'glass-panel text-[var(--nudge-muted)]'
                }`}
              >
                {VERSION_LABELS[ver]}
              </button>
            ))}
          </div>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="max-w-md mx-auto text-center my-auto py-12">
          <p className="text-sm text-[var(--nudge-muted)]">
            This routine version does not have activities yet. Add steps in Organize to guide through it.
          </p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto w-full my-auto py-6">
          <div className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col items-center text-center">
            <span className="font-mono-num text-xs text-[var(--nudge-muted)] mb-2">
              Step {index + 1} of {activities.length} · ~{current.durationMinutes} min
            </span>
            <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)] leading-snug text-balance">
              {current.title}
            </h3>
            {current.description && (
              <p className="text-sm text-[var(--nudge-muted)] mt-2 max-w-md">
                {current.description}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="min-h-[44px] px-4 rounded-xl glass-panel font-mono-num text-xs font-medium flex items-center gap-2"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {formatSec(elapsedSec)}
              </button>
            </div>

            <div className="mt-7 w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  togglePositiveAction({
                    sourceType: 'routine-activity',
                    sourceId: routine.id,
                    itemId: `${selectedVersion}_${current.id}`,
                    label: `${routine.name}: ${current.title}`,
                    category: 'Routines',
                  });
                  if (!isCurrentDone && index < activities.length - 1) {
                    setIndex((i) => i + 1);
                    setElapsedSec(0);
                  }
                }}
                className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isCurrentDone ? 'var(--nudge-accent-soft)' : 'var(--nudge-accent)',
                  color: isCurrentDone ? 'var(--nudge-accent)' : 'var(--nudge-accent-ink)',
                }}
              >
                <Check className="w-4 h-4" />
                {isCurrentDone ? 'Completed (tap to undo)' : 'Complete Step'}
              </button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    setIndex((i) => Math.max(0, i - 1));
                    setElapsedSec(0);
                  }}
                  className="flex-1 min-h-[44px] rounded-xl glass-panel text-xs font-medium disabled:opacity-35 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={index >= activities.length - 1}
                  onClick={() => {
                    setIndex((i) => Math.min(activities.length - 1, i + 1));
                    setElapsedSec(0);
                  }}
                  className="flex-1 min-h-[44px] rounded-xl glass-panel text-xs font-medium disabled:opacity-35 flex items-center justify-center gap-1.5"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {completedCount === activities.length && activities.length > 0 && (
            <div className="mt-4 glass-panel rounded-2xl p-4 text-center flex items-center justify-center gap-2 text-sm text-[var(--nudge-ink)]">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
              <span>You finished every step of {routine.name}. Well done.</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-xs text-[var(--nudge-muted)] pb-safe">
        You can pause or stop at any step—every completed step counts.
      </div>
    </div>
  );
};
