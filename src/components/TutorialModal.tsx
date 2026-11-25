import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  BookHeart,
  Calendar,
  Check,
  HeartHandshake,
  Layers,
  ListChecks,
  Lock,
  Palette,
  Sparkles,
  Sprout,
  Sun,
} from 'lucide-react';
import { useNudge } from '../context/NudgeContext';

interface TutorialStep {
  title: string;
  subtitle: string;
  body: string;
  icon: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Nudge',
    subtitle: 'Your Gentle Everyday Assistant',
    body: 'Nudge is built around one simple idea: productivity should never come at the expense of your well-being. Whether you want to organize a busy week or simply drink water and brush your teeth, you belong here.',
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    title: 'The Today Screen',
    subtitle: 'Your calm daily anchor',
    body: 'Today shows your greeting, current energy level, a rotating gentle tip, and only what matters right now. Expand routines, checklists, or tasks to check items off inline without clutter.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    title: 'Flexible Routines',
    subtitle: 'Built for high and low energy days',
    body: 'Create routines with multiple versions—Full, Normal, Quick, Low Energy, and Bare Minimum—plus a Guided Mode that walks you through one calm step at a time.',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    title: 'Simple Checklists',
    subtitle: 'Resettable & reusable',
    body: 'Keep reusable checklists for self-care, cleaning, groceries, or work prep. Check items off, view Checked Off history with undo, or reset them in one tap.',
    icon: <ListChecks className="w-6 h-6" />,
  },
  {
    title: 'Backpacks & Packing Lists',
    subtitle: 'Never forget essentials at the door',
    body: 'Build packing lists for work, school, gym, or travel with item quantities, required-item indicators, and optional links to your preparation routines.',
    icon: <Backpack className="w-6 h-6" />,
  },
  {
    title: 'Calendar & Scheduling',
    subtitle: 'Month, Week, and Day views',
    body: 'Schedule tasks, events, and routines using accurate local dates and flexible recurrence rules—and edit individual occurrences without breaking a series.',
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    title: 'Private Daily Journal',
    subtitle: 'Yours alone, stored on your device',
    body: 'Capture moods, reflection prompts, and daily thoughts linked to calendar dates. Journal entries stay strictly private and are never automatically sent to AI.',
    icon: <BookHeart className="w-6 h-6" />,
  },
  {
    title: 'Positive Actions',
    subtitle: 'Zero streaks, zero guilt',
    body: 'Instead of punishing broken streaks, Nudge counts every Positive Action you take for yourself. Completing even one step of a routine counts—and quiet days are never treated as failure.',
    icon: <Check className="w-6 h-6" />,
  },
  {
    title: 'Nudge AI Assistant',
    subtitle: 'Optional, thoughtful support',
    body: 'Ask Nudge AI to draft routines, packing lists, break down overwhelming tasks, sort a messy Brain Dump, or propose a balanced day—always requiring your review and consent.',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    title: 'Gentle & Depression-Friendly Tools',
    subtitle: 'Support when starting feels hard',
    body: 'Try Bare Minimum Day, Just One Thing, Nudge Me, Get Me Out of Bed, and the 10-Second Start countdown whenever motivation or energy is scarce.',
    icon: <HeartHandshake className="w-6 h-6" />,
  },
  {
    title: 'Make Nudge Feel Like Yours',
    subtitle: 'Themes, timers, and sound',
    body: 'Open Settings anytime to set your name, choose Light or Dark mode, pick from seven curated themes, customize your countdown duration, or configure quiet hours.',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    title: 'Local-First Privacy',
    subtitle: 'No account required',
    body: 'Your routines, checklists, calendar, and journal stay locally on your device. You can export a full JSON backup anytime, and AI features clearly ask before sending a prompt.',
    icon: <Lock className="w-6 h-6" />,
  },
];

export const TutorialModal: React.FC = () => {
  const { state, completeTutorial } = useNudge();
  const [stepIndex, setStepIndex] = useState(0);

  if (state.tutorialCompleted) return null;

  const current = TUTORIAL_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nudge interactive tutorial"
    >
      <div className="glass-panel-strong w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 md:p-8 flex flex-col gap-5 pb-safe">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono-num text-xs text-[var(--nudge-muted)]">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            onClick={completeTutorial}
            className="min-h-[40px] px-3 text-xs font-medium text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] transition-colors whitespace-nowrap"
          >
            Skip tutorial
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--nudge-accent-soft)',
              color: 'var(--nudge-accent)',
            }}
          >
            {current.icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl md:text-2xl font-medium text-[var(--nudge-ink)] leading-snug">
              {current.title}
            </h2>
            <p className="text-xs font-medium text-[var(--nudge-muted)] mt-0.5">
              {current.subtitle}
            </p>
          </div>
        </div>

        <p className="text-sm md:text-[15px] leading-relaxed text-[var(--nudge-ink)]/90">
          {current.body}
        </p>

        <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden="true">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === stepIndex ? 'w-5' : 'w-1.5 opacity-30'
              }`}
              style={{
                backgroundColor: idx === stepIndex ? 'var(--nudge-accent)' : 'var(--nudge-ink)',
              }}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--nudge-glass-border)] text-sm font-medium text-[var(--nudge-ink)] disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={completeTutorial}
              className="tactile-btn min-h-[44px] px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--nudge-accent)',
                color: 'var(--nudge-accent-ink)',
              }}
            >
              Begin with Nudge
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1))}
              className="tactile-btn min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--nudge-accent)',
                color: 'var(--nudge-accent-ink)',
              }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
