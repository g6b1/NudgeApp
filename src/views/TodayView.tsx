import React, { useMemo, useState } from 'react';
import {
  Backpack as BackpackIcon,
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  HeartHandshake,
  Layers,
  ListChecks,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
  Sun,
  Timer,
  Wand2,
} from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import { CALM_SUBTITLES, MOTIVATIONAL_TIPS } from '../data/motivationalTips';
import { EnergyLevel, MainNavTab, OrganizeSubTab, Routine, RoutineVersionType } from '../types/nudge';
import {
  addDaysToKey,
  formatTime12h,
  getCalendarInstancesForDate,
  getGreeting,
} from '../utils/dateUtils';
import { computePositiveActionsSummary } from '../services/positiveActions';
import { GentleToolTab } from '../components/GentleSupportSheet';

interface TodayViewProps {
  onNavigate: (tab: MainNavTab, subTab?: OrganizeSubTab) => void;
  onStartMyDay: () => void;
  onStartGuidedRoutine: (routine: Routine) => void;
  onOpenCountdown: (mode: 'countdown' | 'focus', taskTitle?: string) => void;
  onOpenQuickCapture: (mode: 'task' | 'reminder' | 'brain-dump') => void;
  onOpenNudgeAI: (mode?: 'chat' | 'routine' | 'breakdown' | 'plan-day', prompt?: string) => void;
  onOpenGentleTool: (tab: GentleToolTab, taskTitle?: string) => void;
}

const ENERGY_OPTIONS: { id: EnergyLevel; label: string }[] = [
  { id: 'high', label: 'High' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Low' },
  { id: 'very-low', label: 'Very Low' },
];

export const TodayView: React.FC<TodayViewProps> = ({
  onNavigate,
  onStartMyDay,
  onStartGuidedRoutine,
  onOpenCountdown,
  onOpenQuickCapture,
  onOpenNudgeAI,
  onOpenGentleTool,
}) => {
  const {
    state,
    todayKey,
    daysSinceLastActive,
    dismissWelcomeBack,
    setEnergyLevel,
    isActionCompletedToday,
    togglePositiveAction,
    toggleChecklistItem,
    toggleBackpackItem,
    toggleCalendarCompletion,
    updateNotificationStatus,
    updateRoutine,
  } = useNudge();

  const [tipOffset, setTipOffset] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    routines: true,
    tasks: true,
    checklists: false,
    backpacks: false,
    reminders: true,
  });

  const subtitle = useMemo(() => {
    const dayNum = Number(todayKey.slice(-2)) || 0;
    return CALM_SUBTITLES[dayNum % CALM_SUBTITLES.length];
  }, [todayKey]);

  const currentTip = useMemo(() => {
    const daySeed = Number(todayKey.replace(/-/g, '')) || 1;
    const idx = (daySeed + tipOffset) % MOTIVATIONAL_TIPS.length;
    return MOTIVATIONAL_TIPS[idx];
  }, [todayKey, tipOffset]);

  const positiveSummary = useMemo(
    () => computePositiveActionsSummary(state.completionLog),
    [state.completionLog]
  );

  const todayWeekday = new Date().getDay();
  const activeRoutines = state.routines.filter((r) => !r.archived);
  const todaysRoutines = activeRoutines.filter(
    (r) => !r.schedule?.enabled || r.schedule.daysOfWeek.includes(todayWeekday)
  );
  const activeChecklists = state.checklists.filter((c) => !c.archived);
  const activeBackpacks = state.backpacks.filter((b) => !b.archived);
  const todaysInstances = useMemo(
    () => getCalendarInstancesForDate(state.calendarItems, todayKey),
    [state.calendarItems, todayKey]
  );

  const pendingNotifications = state.notifications.filter((n) => n.status === 'pending');

  // Compute real completion percentage only across scheduled/active today items
  const { totalTodayItems, completedTodayItems } = useMemo(() => {
    let total = 0;
    let done = 0;

    for (const r of todaysRoutines) {
      const ver = r.activeVersion || 'normal';
      const acts = r.versions[ver]?.activities || [];
      total += acts.length;
      for (const a of acts) {
        if (isActionCompletedToday('routine-activity', r.id, `${ver}_${a.id}`)) done++;
      }
    }

    for (const inst of todaysInstances) {
      total++;
      if (inst.completed) done++;
    }

    return { totalTodayItems: total, completedTodayItems: done };
  }, [todaysRoutines, todaysInstances, isActionCompletedToday]);

  const completionPct =
    totalTodayItems > 0 ? Math.round((completedTodayItems / totalTodayItems) * 100) : null;

  const upcomingActivity = useMemo(() => {
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const pending = todaysInstances.filter((i) => !i.completed);
    const timedNext = pending.find((i) => i.startTime && i.startTime >= nowTime);
    return timedNext || pending[0] || null;
  }, [todaysInstances]);

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getSuggestedVersionForEnergy = (r: Routine): RoutineVersionType => {
    const e = state.settings.energyLevel;
    if (e === 'very-low' && r.versions['bare-minimum']?.activities.length) return 'bare-minimum';
    if (e === 'low' && r.versions['low-energy']?.activities.length) return 'low-energy';
    return r.activeVersion;
  };

  return (
    <div className="space-y-6">
      {/* Greeting & Subtitle */}
      <section className="pt-1">
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--nudge-ink)] text-balance">
          {getGreeting(state.settings.firstName)}
        </h1>
        <p className="text-sm md:text-[15px] text-[var(--nudge-muted)] mt-1">
          {subtitle}
        </p>
      </section>

      {/* Recovery-Friendly Welcome Back */}
      {daysSinceLastActive >= 3 && (
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--nudge-ink)]">
            Welcome back. You don't have to catch up. Let's start with today.
          </p>
          <button
            type="button"
            onClick={dismissWelcomeBack}
            className="min-h-[38px] px-3 rounded-xl text-xs font-medium text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Compact Daily Overview */}
      <section className="glass-panel rounded-3xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Positive Actions & Progress */}
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-mono-num text-lg font-semibold"
              style={{
                backgroundColor: 'var(--nudge-accent-soft)',
                color: 'var(--nudge-accent)',
              }}
            >
              {positiveSummary.todayCount}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--nudge-ink)]">
                Positive {positiveSummary.todayCount === 1 ? 'action' : 'actions'} today
              </p>
              <p className="text-xs text-[var(--nudge-muted)] font-mono-num">
                {completionPct !== null
                  ? `${completionPct}% of today's plan (${completedTodayItems}/${totalTodayItems})`
                  : 'Every small thing you do counts'}
              </p>
            </div>
          </div>

          {/* Upcoming Activity */}
          <div className="min-w-0 md:border-l md:border-[var(--nudge-glass-border)] md:pl-4">
            <p className="text-xs text-[var(--nudge-muted)]">Up next</p>
            {upcomingActivity ? (
              <p className="text-sm font-medium text-[var(--nudge-ink)] truncate mt-0.5">
                {upcomingActivity.startTime ? `${formatTime12h(upcomingActivity.startTime)} · ` : ''}
                {upcomingActivity.title}
              </p>
            ) : (
              <p className="text-sm text-[var(--nudge-muted)] mt-0.5">
                Open space—move at your own pace
              </p>
            )}
          </div>

          {/* Energy Mode Selector */}
          <div className="md:border-l md:border-[var(--nudge-glass-border)] md:pl-4">
            <p className="text-xs text-[var(--nudge-muted)] mb-1.5">Current energy</p>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
              {ENERGY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEnergyLevel(opt.id)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap truncate ${
                    state.settings.energyLevel === opt.id
                      ? 'bg-[var(--nudge-accent)] text-white shadow-sm'
                      : 'text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gentle Motivational Tip */}
        <div className="pt-3 border-t border-[var(--nudge-glass-border)] flex items-center justify-between gap-3">
          <p className="text-xs md:text-sm text-[var(--nudge-ink)]/85 italic leading-relaxed">
            "{currentTip.text}"
          </p>
          <button
            type="button"
            onClick={() => setTipOffset((o) => o + 1)}
            aria-label="Show another gentle tip"
            className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] hover:bg-black/5 dark:hover:bg-white/5 shrink-0 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Compact Quick Actions */}
      <section aria-label="Quick actions" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={onStartMyDay}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <Sun className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">Start My Day</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCountdown('countdown')}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <Timer className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">
            {state.settings.countdownSeconds}-Second Start
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenQuickCapture('brain-dump')}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <StickyNote className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">Brain Dump</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenQuickCapture('task')}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <Plus className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">Add Task</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenNudgeAI('chat')}
          className="tactile-btn glass-panel rounded-2xl p-3 flex items-center gap-2.5 text-left min-h-[48px]"
        >
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
          <span className="text-xs font-medium text-[var(--nudge-ink)] truncate">Nudge AI</span>
        </button>
      </section>

      {/* Gentle Support Tools Strip (Progressive Disclosure) */}
      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--nudge-muted)] mr-1 flex items-center gap-1.5">
          <HeartHandshake className="w-3.5 h-3.5" />
          Gentle support:
        </span>
        {(
          [
            { id: 'bare-minimum', label: 'Bare Minimum Day' },
            { id: 'just-one-thing', label: 'Just One Thing' },
            { id: 'nudge-me', label: 'Nudge Me' },
            { id: 'out-of-bed', label: 'Get Me Out of Bed' },
            { id: 'make-easier', label: 'Make This Easier' },
            { id: 'care-support', label: 'Hygiene & Eating' },
          ] as { id: GentleToolTab; label: string }[]
        ).map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onOpenGentleTool(tool.id)}
            className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium text-[var(--nudge-ink)] hover:opacity-85 transition-opacity"
          >
            {tool.label}
          </button>
        ))}
      </section>

      {/* Optional Gentle Eating Reminder */}
      {state.settings.eatingRemindersEnabled && (
        <div className="glass-panel rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs md:text-sm text-[var(--nudge-ink)]">
            <Coffee className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
            <span>Gentle check-in: Have you had water or a simple bite to eat recently?</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGentleTool('care-support')}
            className="text-xs font-medium underline shrink-0"
            style={{ color: 'var(--nudge-accent)' }}
          >
            Easy ideas
          </button>
        </div>
      )}

      {/* Pending Reminders */}
      {pendingNotifications.length > 0 && (
        <section className="glass-panel rounded-3xl p-4 md:p-5 space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('reminders')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
              <h2 className="font-display text-base font-medium">
                Reminders ({pendingNotifications.length})
              </h2>
            </div>
            {expandedSections.reminders ? (
              <ChevronDown className="w-4 h-4 text-[var(--nudge-muted)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--nudge-muted)]" />
            )}
          </button>

          {expandedSections.reminders && (
            <div className="space-y-2">
              {pendingNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--nudge-ink)]">{n.title}</p>
                    <p className="text-xs text-[var(--nudge-muted)]">
                      {n.scheduledFor} · {n.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        togglePositiveAction({
                          sourceType: 'task',
                          sourceId: n.id,
                          itemId: todayKey,
                          label: n.title,
                          category: 'Reminders',
                        });
                        updateNotificationStatus(n.id, 'completed');
                      }}
                      className="min-h-[36px] px-3 rounded-xl text-xs font-medium"
                      style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNotificationStatus(n.id, 'snoozed', '15m')}
                      className="min-h-[36px] px-3 rounded-xl glass-panel text-xs"
                    >
                      Snooze
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNotificationStatus(n.id, 'snoozed', addDaysToKey(todayKey, 1))}
                      className="min-h-[36px] px-3 rounded-xl glass-panel text-xs"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNotificationStatus(n.id, 'skipped')}
                      className="min-h-[36px] px-3 rounded-xl text-xs text-[var(--nudge-muted)]"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main Two-Column Content Grid on Desktop, Clean Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left/Primary Column: Today's Routines & Scheduled Tasks */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Routines */}
          <section className="glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSection('routines')}
                className="flex items-center gap-2 text-left min-h-[40px]"
              >
                <Layers className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h2 className="font-display text-lg font-medium">Today's Routines</h2>
                {expandedSections.routines ? (
                  <ChevronDown className="w-4 h-4 text-[var(--nudge-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--nudge-muted)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('organize', 'routines')}
                className="text-xs font-medium text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
              >
                Manage
              </button>
            </div>

            {expandedSections.routines && (
              <>
                {todaysRoutines.length === 0 ? (
                  <div className="py-5 text-center space-y-3">
                    <p className="text-sm text-[var(--nudge-muted)]">
                      No routines set up yet. Start gently with a template, Nudge AI, or build your own.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('organize', 'templates')}
                        className="min-h-[40px] px-4 rounded-xl glass-panel text-xs font-medium"
                      >
                        Browse Templates
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenNudgeAI('routine')}
                        className="tactile-btn min-h-[40px] px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Create with AI
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysRoutines.map((routine) => {
                      const suggestedVer = getSuggestedVersionForEnergy(routine);
                      const ver = routine.activeVersion || suggestedVer;
                      const activities = routine.versions[ver]?.activities || [];
                      const doneCount = activities.filter((a) =>
                        isActionCompletedToday('routine-activity', routine.id, `${ver}_${a.id}`)
                      ).length;

                      return (
                        <div
                          key={routine.id}
                          className="rounded-2xl p-4 bg-black/[0.025] dark:bg-white/[0.03] border border-[var(--nudge-glass-border)] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{routine.emoji}</span>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-[var(--nudge-ink)] truncate">
                                  {routine.name}
                                </h3>
                                <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                                  {doneCount}/{activities.length} steps · {ver.replace('-', ' ')}
                                  {routine.schedule?.time ? ` · ${formatTime12h(routine.schedule.time)}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {(state.settings.energyLevel === 'low' ||
                                state.settings.energyLevel === 'very-low') &&
                                ver !== suggestedVer && (
                                  <button
                                    type="button"
                                    onClick={() => updateRoutine(routine.id, { activeVersion: suggestedVer })}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--nudge-accent-soft)]"
                                    style={{ color: 'var(--nudge-accent)' }}
                                  >
                                    Switch to {suggestedVer.replace('-', ' ')}
                                  </button>
                                )}
                              <button
                                type="button"
                                onClick={() => onStartGuidedRoutine(routine)}
                                className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Guide
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {activities.map((act) => {
                              const done = isActionCompletedToday(
                                'routine-activity',
                                routine.id,
                                `${ver}_${act.id}`
                              );
                              return (
                                <button
                                  key={act.id}
                                  type="button"
                                  onClick={() =>
                                    togglePositiveAction({
                                      sourceType: 'routine-activity',
                                      sourceId: routine.id,
                                      itemId: `${ver}_${act.id}`,
                                      label: `${routine.name}: ${act.title}`,
                                      category: 'Routines',
                                    })
                                  }
                                  className="w-full py-2 px-2.5 rounded-xl flex items-center justify-between gap-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors min-h-[42px]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                        done
                                          ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                          : 'border-[var(--nudge-taupe)]'
                                      }`}
                                    >
                                      {done && <Check className="w-3 h-3" />}
                                    </span>
                                    <span
                                      className={`text-sm truncate ${
                                        done ? 'line-through opacity-55' : 'text-[var(--nudge-ink)]'
                                      }`}
                                    >
                                      {act.title}
                                    </span>
                                  </div>
                                  <span className="font-mono-num text-xs text-[var(--nudge-muted)] shrink-0">
                                    {act.durationMinutes}m
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Today's Scheduled Tasks & Events */}
          <section className="glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSection('tasks')}
                className="flex items-center gap-2 text-left min-h-[40px]"
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h2 className="font-display text-lg font-medium">Scheduled Today</h2>
                {expandedSections.tasks ? (
                  <ChevronDown className="w-4 h-4 text-[var(--nudge-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--nudge-muted)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onOpenQuickCapture('task')}
                className="text-xs font-medium"
                style={{ color: 'var(--nudge-accent)' }}
              >
                + Add task
              </button>
            </div>

            {expandedSections.tasks && (
              <>
                {todaysInstances.length === 0 ? (
                  <p className="text-sm text-[var(--nudge-muted)] py-3">
                    Nothing scheduled for today yet. Your time is open.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {todaysInstances.map((inst) => (
                      <div
                        key={inst.instanceKey}
                        className="p-2.5 rounded-2xl flex items-center justify-between gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCalendarCompletion(inst.item.id, todayKey)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[40px]"
                        >
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              inst.completed
                                ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                : 'border-[var(--nudge-taupe)]'
                            }`}
                          >
                            {inst.completed && <Check className="w-3 h-3" />}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                inst.completed ? 'line-through opacity-55' : 'text-[var(--nudge-ink)]'
                              }`}
                            >
                              {inst.title}
                            </p>
                            <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                              {inst.startTime ? formatTime12h(inst.startTime) : 'Anytime'}
                              {inst.endTime ? ` – ${formatTime12h(inst.endTime)}` : ''}
                              {inst.isRecurringInstance ? ' · Recurring' : ''}
                            </p>
                          </div>
                        </button>

                        {!inst.completed && (
                          <button
                            type="button"
                            onClick={() => onOpenGentleTool('make-easier', inst.title)}
                            title="Make this task easier"
                            className="min-h-[36px] px-2.5 rounded-xl glass-panel text-[11px] font-medium flex items-center gap-1 shrink-0 text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                          >
                            <Wand2 className="w-3 h-3" />
                            Easier
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Right/Secondary Column: Checklists & Backpacks */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Checklists */}
          <section className="glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleSection('checklists')}
                className="flex items-center gap-2 text-left min-h-[40px]"
              >
                <ListChecks className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h2 className="font-display text-lg font-medium">
                  Checklists ({activeChecklists.length})
                </h2>
                {expandedSections.checklists ? (
                  <ChevronDown className="w-4 h-4 text-[var(--nudge-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--nudge-muted)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('organize', 'checklists')}
                className="text-xs font-medium text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
              >
                Open all
              </button>
            </div>

            {expandedSections.checklists && (
              <>
                {activeChecklists.length === 0 ? (
                  <p className="text-xs text-[var(--nudge-muted)] py-2">
                    No active checklists. Create one or pick a self-care template in Organize.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeChecklists.slice(0, 3).map((cl) => (
                      <div key={cl.id} className="space-y-1.5 pt-2 border-t border-[var(--nudge-glass-border)] first:border-t-0 first:pt-0">
                        <p className="text-sm font-medium text-[var(--nudge-ink)]">
                          {cl.emoji} {cl.name}
                        </p>
                        {cl.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklistItem(cl.id, item.id)}
                            className="w-full py-1.5 px-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] min-h-[38px]"
                          >
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                item.completed
                                  ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                  : 'border-[var(--nudge-taupe)]'
                              }`}
                            >
                              {item.completed && <Check className="w-3 h-3" />}
                            </span>
                            <span
                              className={`text-xs md:text-sm ${
                                item.completed ? 'line-through opacity-55' : 'text-[var(--nudge-ink)]'
                              }`}
                            >
                              {item.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Backpacks */}
          <section className="glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleSection('backpacks')}
                className="flex items-center gap-2 text-left min-h-[40px]"
              >
                <BackpackIcon className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                <h2 className="font-display text-lg font-medium">
                  Backpacks ({activeBackpacks.length})
                </h2>
                {expandedSections.backpacks ? (
                  <ChevronDown className="w-4 h-4 text-[var(--nudge-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--nudge-muted)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('organize', 'backpacks')}
                className="text-xs font-medium text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
              >
                Open all
              </button>
            </div>

            {expandedSections.backpacks && (
              <>
                {activeBackpacks.length === 0 ? (
                  <p className="text-xs text-[var(--nudge-muted)] py-2">
                    No packing lists yet. Create a Work, School, or Gym backpack in Organize.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeBackpacks.slice(0, 2).map((bp) => {
                      const missingRequired = bp.items.filter((i) => i.required && !i.packed).length;
                      return (
                        <div key={bp.id} className="space-y-1.5 pt-2 border-t border-[var(--nudge-glass-border)] first:border-t-0 first:pt-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[var(--nudge-ink)]">
                              {bp.emoji} {bp.name}
                            </p>
                            {missingRequired > 0 && (
                              <span className="text-xs text-amber-700 dark:text-amber-300 font-mono-num">
                                {missingRequired} required left
                              </span>
                            )}
                          </div>
                          {bp.items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleBackpackItem(bp.id, item.id)}
                              className="w-full py-1.5 px-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] min-h-[38px]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    item.packed
                                      ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                      : 'border-[var(--nudge-taupe)]'
                                  }`}
                                >
                                  {item.packed && <Check className="w-3 h-3" />}
                                </span>
                                <span
                                  className={`text-xs md:text-sm truncate ${
                                    item.packed ? 'line-through opacity-55' : 'text-[var(--nudge-ink)]'
                                  }`}
                                >
                                  {item.name}
                                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                                </span>
                              </div>
                              {item.required && !item.packed && (
                                <span className="text-[11px] text-[var(--nudge-muted)] shrink-0">
                                  Required
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
