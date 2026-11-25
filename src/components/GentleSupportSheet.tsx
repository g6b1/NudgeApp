import React, { useState } from 'react';
import {
  BedDouble,
  Check,
  Coffee,
  Droplets,
  HeartHandshake,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { GlassSheet } from './ui/GlassSheet';
import { useNudge } from '../context/NudgeContext';
import {
  EASY_MEAL_SUGGESTIONS,
  HYGIENE_ROUTINES,
  JUST_ONE_THING_PROMPTS,
  NUDGE_ME_OPTIONS,
  buildLocalTaskBreakdown,
} from '../data/motivationalTips';
import { createId } from '../storage/persistence';
import { generateTaskBreakdown } from '../services/aiService';

export type GentleToolTab =
  | 'bare-minimum'
  | 'just-one-thing'
  | 'nudge-me'
  | 'make-easier'
  | 'out-of-bed'
  | 'care-support';

interface GentleSupportSheetProps {
  open: boolean;
  initialTab: GentleToolTab;
  initialTaskForEasier?: string;
  onClose: () => void;
  onOpenBrainDump: () => void;
  onOpenCountdown: (taskTitle?: string) => void;
}

export const GentleSupportSheet: React.FC<GentleSupportSheetProps> = ({
  open,
  initialTab,
  initialTaskForEasier,
  onClose,
  onOpenBrainDump,
  onOpenCountdown,
}) => {
  const {
    state,
    updateSettings,
    isActionCompletedToday,
    togglePositiveAction,
    recordPositiveActionOnce,
  } = useNudge();

  const [tab, setTab] = useState<GentleToolTab>(initialTab);
  const [newBmTitle, setNewBmTitle] = useState('');
  const [jotIndex, setJotIndex] = useState(0);
  const [jotDoneState, setJotDoneState] = useState<'idle' | 'done'>('idle');
  const [selectedNeedId, setSelectedNeedId] = useState<string>(NUDGE_ME_OPTIONS[0].id);

  // Make This Easier state
  const [easierInput, setEasierInput] = useState(initialTaskForEasier || '');
  const [easierSteps, setEasierSteps] = useState<string[]>([]);
  const [easierChecked, setEasierChecked] = useState<Record<number, boolean>>({});
  const [easierNote, setEasierNote] = useState('');
  const [easierLoading, setEasierLoading] = useState(false);

  // Get me out of bed completed steps
  const [bedStepsDone, setBedStepsDone] = useState<Record<string, boolean>>({});
  const [newBedStep, setNewBedStep] = useState('');

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      if (initialTaskForEasier) {
        setEasierInput(initialTaskForEasier);
        setEasierSteps(buildLocalTaskBreakdown(initialTaskForEasier));
        setEasierChecked({});
      }
      setJotDoneState('idle');
    }
  }, [open, initialTab, initialTaskForEasier]);

  const currentJot = JUST_ONE_THING_PROMPTS[jotIndex % JUST_ONE_THING_PROMPTS.length];
  const selectedNudgeMe = NUDGE_ME_OPTIONS.find((o) => o.id === selectedNeedId) || NUDGE_ME_OPTIONS[0];

  const handleBreakdown = async (useAI: boolean) => {
    const clean = easierInput.trim();
    if (!clean) return;
    setEasierChecked({});
    setEasierNote('');

    if (!useAI) {
      setEasierSteps(buildLocalTaskBreakdown(clean));
      return;
    }

    setEasierLoading(true);
    try {
      const res = await generateTaskBreakdown(clean, state.settings.energyLevel);
      setEasierNote(res.encouragement || '');
      setEasierSteps(res.steps);
    } catch (err) {
      setEasierNote(
        err instanceof Error
          ? `${err.message} Here is a gentle offline breakdown instead.`
          : 'Using gentle offline steps instead.'
      );
      setEasierSteps(buildLocalTaskBreakdown(clean));
    } finally {
      setEasierLoading(false);
    }
  };

  const tabs: { id: GentleToolTab; label: string }[] = [
    { id: 'bare-minimum', label: 'Bare Minimum' },
    { id: 'just-one-thing', label: 'Just One Thing' },
    { id: 'nudge-me', label: 'Nudge Me' },
    { id: 'make-easier', label: 'Make Easier' },
    { id: 'out-of-bed', label: 'Out of Bed' },
    { id: 'care-support', label: 'Hygiene & Food' },
  ];

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Gentle Support"
      subtitle="Low-pressure tools for difficult or low-energy moments"
      maxWidthClass="max-w-2xl"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-[var(--nudge-glass-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-[var(--nudge-accent)] text-white'
                : 'bg-black/5 dark:bg-white/5 text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bare-minimum' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--nudge-muted)]">
            On hard days, these simple essentials are more than enough. Check off whichever feels manageable—you can customize this list anytime.
          </p>
          <div className="space-y-2">
            {state.settings.bareMinimumItems.map((item) => {
              const done = isActionCompletedToday('bare-minimum', 'bare-minimum', item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-panel"
                >
                  <button
                    type="button"
                    onClick={() =>
                      togglePositiveAction({
                        sourceType: 'bare-minimum',
                        sourceId: 'bare-minimum',
                        itemId: item.id,
                        label: item.title,
                        category: 'Gentle Self-Care',
                      })
                    }
                    className="flex items-center gap-3 flex-1 text-left min-h-[40px]"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                          : 'border-[var(--nudge-taupe)]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-lg">{item.emoji}</span>
                    <span className={`text-sm ${done ? 'line-through opacity-60' : 'text-[var(--nudge-ink)]'}`}>
                      {item.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        bareMinimumItems: state.settings.bareMinimumItems.filter((x) => x.id !== item.id),
                      })
                    }
                    aria-label={`Remove ${item.title}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBmTitle.trim()) return;
              updateSettings({
                bareMinimumItems: [
                  ...state.settings.bareMinimumItems,
                  { id: createId('bm'), title: newBmTitle.trim(), emoji: '🌿' },
                ],
              });
              setNewBmTitle('');
            }}
            className="flex gap-2 pt-2"
          >
            <input
              type="text"
              value={newBmTitle}
              onChange={(e) => setNewBmTitle(e.target.value)}
              placeholder="Add custom bare-minimum essential..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
            />
            <button
              type="submit"
              className="tactile-btn min-h-[44px] px-4 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>
        </div>
      )}

      {tab === 'just-one-thing' && (
        <div className="py-4 text-center space-y-5">
          <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-3">
            <p className="text-xs text-[var(--nudge-muted)]">
              Instead of "{currentJot.originalGoal}":
            </p>
            <h3 className="font-display text-2xl font-medium text-[var(--nudge-ink)] text-balance">
              {currentJot.tinyStep}
            </h3>
          </div>

          {jotDoneState === 'done' ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--nudge-ink)]">
                That counted as a real Positive Action for yourself today.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJotIndex((i) => i + 1);
                    setJotDoneState('idle');
                  }}
                  className="tactile-btn min-h-[44px] px-5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                >
                  Give me another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 rounded-xl glass-panel text-sm font-medium"
                >
                  I'm done for now
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  recordPositiveActionOnce({
                    sourceType: 'just-one-thing',
                    sourceId: 'jot',
                    itemId: `${currentJot.id}_${Date.now()}`,
                    label: currentJot.tinyStep,
                    category: 'Gentle Self-Care',
                  });
                  setJotDoneState('done');
                }}
                className="tactile-btn min-h-[48px] px-6 rounded-2xl text-sm font-semibold flex items-center gap-2"
                style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
              >
                <Check className="w-4 h-4" />
                I did it
              </button>
              <button
                type="button"
                onClick={() => setJotIndex((i) => i + 1)}
                className="min-h-[48px] px-4 rounded-2xl glass-panel text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Give me another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-4 rounded-2xl glass-panel text-sm font-medium"
              >
                I'm done for now
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'nudge-me' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--nudge-muted)]">
            Tell Nudge what kind of support would feel helpful right now:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {NUDGE_ME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedNeedId(opt.id)}
                className={`p-3 rounded-2xl text-left text-sm font-medium transition-colors border ${
                  selectedNeedId === opt.id
                    ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)] text-[var(--nudge-ink)]'
                    : 'border-[var(--nudge-glass-border)] glass-panel text-[var(--nudge-muted)]'
                }`}
              >
                {opt.needLabel}
              </button>
            ))}
          </div>

          <div className="glass-panel-strong rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--nudge-accent)' }}>
              <HeartHandshake className="w-4 h-4" />
              <span>One gentle suggestion</span>
            </div>
            <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
              {selectedNudgeMe.suggestionTitle}
            </h3>
            <p className="text-sm text-[var(--nudge-ink)]/85 leading-relaxed">
              {selectedNudgeMe.suggestionBody}
            </p>
            <button
              type="button"
              onClick={() => {
                if (selectedNudgeMe.actionType === 'bare-minimum') setTab('bare-minimum');
                else if (selectedNudgeMe.actionType === 'just-one-thing') setTab('just-one-thing');
                else if (selectedNudgeMe.actionType === 'out-of-bed') setTab('out-of-bed');
                else if (selectedNudgeMe.actionType === 'brain-dump') {
                  onClose();
                  onOpenBrainDump();
                } else if (selectedNudgeMe.actionType === 'countdown') {
                  onClose();
                  onOpenCountdown();
                }
              }}
              className="tactile-btn min-h-[44px] px-5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              {selectedNudgeMe.actionLabel}
            </button>
          </div>
        </div>
      )}

      {tab === 'make-easier' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--nudge-muted)]">
            Enter any task that feels too big. Break it into tiny steps—stop whenever you want.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={easierInput}
              onChange={(e) => setEasierInput(e.target.value)}
              placeholder="e.g., Clean my bedroom, Reply to emails..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleBreakdown(false)}
                className="min-h-[44px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Simple Steps
              </button>
              <button
                type="button"
                disabled={easierLoading || !state.settings.aiConsentGranted}
                onClick={() => handleBreakdown(true)}
                title={
                  state.settings.aiConsentGranted
                    ? 'Use Nudge AI to tailor steps'
                    : 'Grant AI consent in Nudge AI or Settings to use AI breakdown'
                }
                className="tactile-btn min-h-[44px] px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-45 whitespace-nowrap"
                style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {easierLoading ? 'Thinking...' : 'AI Steps'}
              </button>
            </div>
          </div>

          {!state.settings.aiConsentGranted && (
            <p className="text-xs text-[var(--nudge-muted)]">
              AI breakdown sends only this task text to Gemini when consent is enabled.{' '}
              <button
                type="button"
                onClick={() => updateSettings({ aiConsentGranted: true })}
                className="underline font-medium text-[var(--nudge-ink)]"
              >
                Enable AI consent
              </button>
            </p>
          )}

          {easierNote && <p className="text-xs text-[var(--nudge-muted)] italic">{easierNote}</p>}

          {easierSteps.length > 0 && (
            <div className="space-y-2 pt-1">
              {easierSteps.map((step, idx) => {
                const done = Boolean(easierChecked[idx]);
                return (
                  <button
                    key={`${step}_${idx}`}
                    type="button"
                    onClick={() => {
                      const next = !done;
                      setEasierChecked((prev) => ({ ...prev, [idx]: next }));
                      if (next) {
                        recordPositiveActionOnce({
                          sourceType: 'just-one-thing',
                          sourceId: 'make-easier',
                          itemId: `${easierInput}_${idx}`,
                          label: step,
                          category: 'Gentle Steps',
                        });
                      }
                    }}
                    className="w-full p-3 rounded-2xl glass-panel flex items-center gap-3 text-left min-h-[44px]"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                          : 'border-[var(--nudge-taupe)]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-sm ${done ? 'line-through opacity-60' : 'text-[var(--nudge-ink)]'}`}>
                      {idx + 1}. {step}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'out-of-bed' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--nudge-muted)]">
            <BedDouble className="w-4 h-4" />
            <span>A gentle sequence for mornings when getting up feels heavy.</span>
          </div>
          <div className="space-y-2">
            {state.settings.getOutOfBedSteps.map((step, idx) => {
              const done = Boolean(bedStepsDone[step.id]);
              return (
                <div key={step.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl glass-panel">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !done;
                      setBedStepsDone((p) => ({ ...p, [step.id]: next }));
                      if (next) {
                        recordPositiveActionOnce({
                          sourceType: 'bare-minimum',
                          sourceId: 'out-of-bed',
                          itemId: step.id,
                          label: step.title,
                          category: 'Gentle Self-Care',
                        });
                      }
                    }}
                    className="flex items-center gap-3 flex-1 text-left min-h-[40px]"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                          : 'border-[var(--nudge-taupe)]'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-sm ${done ? 'line-through opacity-60' : 'text-[var(--nudge-ink)]'}`}>
                      {idx + 1}. {step.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        getOutOfBedSteps: state.settings.getOutOfBedSteps.filter((s) => s.id !== step.id),
                      })
                    }
                    aria-label="Remove step"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBedStep.trim()) return;
              updateSettings({
                getOutOfBedSteps: [
                  ...state.settings.getOutOfBedSteps,
                  { id: createId('ob'), title: newBedStep.trim() },
                ],
              });
              setNewBedStep('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newBedStep}
              onChange={(e) => setNewBedStep(e.target.value)}
              placeholder="Customize or add a step..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
            <button
              type="submit"
              className="tactile-btn min-h-[44px] px-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              Add
            </button>
          </form>
        </div>
      )}

      {tab === 'care-support' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h3 className="font-display text-base font-medium">Hygiene Support</h3>
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {(['minimum', 'full'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateSettings({ hygieneMode: mode })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      state.settings.hygieneMode === mode
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {mode === 'minimum' ? 'Minimum' : 'Full'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {HYGIENE_ROUTINES[state.settings.hygieneMode].map((step, i) => {
                const key = `hyg_${state.settings.hygieneMode}_${i}`;
                const done = isActionCompletedToday('bare-minimum', 'hygiene', key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      togglePositiveAction({
                        sourceType: 'bare-minimum',
                        sourceId: 'hygiene',
                        itemId: key,
                        label: step,
                        category: 'Gentle Self-Care',
                      })
                    }
                    className="w-full p-3 rounded-2xl glass-panel flex items-center gap-3 text-left min-h-[44px]"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                          : 'border-[var(--nudge-taupe)]'
                      }`}
                    >
                      {done && <Check className="w-3 h-3" />}
                    </span>
                    <span className={`text-sm ${done ? 'line-through opacity-60' : 'text-[var(--nudge-ink)]'}`}>
                      {step}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--nudge-glass-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h3 className="font-display text-base font-medium">Gentle Eating Support</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--nudge-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.settings.eatingRemindersEnabled}
                  onChange={(e) => updateSettings({ eatingRemindersEnabled: e.target.checked })}
                  className="rounded"
                />
                Gentle reminder on Today
              </label>
            </div>
            <p className="text-xs text-[var(--nudge-muted)]">
              Zero calories or rules—just low-effort ways to nourish yourself when cooking feels like too much.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EASY_MEAL_SUGGESTIONS.map((meal, idx) => {
                const key = `meal_${idx}`;
                const done = isActionCompletedToday('bare-minimum', 'eating', key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      togglePositiveAction({
                        sourceType: 'bare-minimum',
                        sourceId: 'eating',
                        itemId: key,
                        label: `Ate: ${meal.title}`,
                        category: 'Gentle Self-Care',
                      })
                    }
                    className="p-3 rounded-2xl glass-panel text-left flex items-start gap-2.5"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        done
                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                          : 'border-[var(--nudge-taupe)]'
                      }`}
                    >
                      {done && <Check className="w-3 h-3" />}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${done ? 'line-through opacity-60' : 'text-[var(--nudge-ink)]'}`}>
                        {meal.title}
                      </p>
                      <p className="text-xs text-[var(--nudge-muted)] mt-0.5">{meal.note}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GlassSheet>
  );
};
