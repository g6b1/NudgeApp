import React, { useMemo } from 'react';
import { Heart, Sprout, Trash2 } from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import { computePositiveActionsSummary, formatDayLabel } from '../services/positiveActions';

interface ProgressViewProps {
  onOpenGarden?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onOpenGarden }) => {
  const { state, todayKey, removeCompletionRecord } = useNudge();
  const summary = useMemo(
    () => computePositiveActionsSummary(state.completionLog),
    [state.completionLog]
  );

  const maxBar = Math.max(1, ...summary.weeklyBars.map((b) => b.count));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)]">
            Positive Actions
          </h1>
          <p className="text-sm text-[var(--nudge-muted)] mt-1">
            What did you do for yourself? Every small step counts—with zero streaks or penalties.
          </p>
        </div>

        {onOpenGarden && (
          <button
            type="button"
            onClick={onOpenGarden}
            className="tactile-btn min-h-[42px] px-4 rounded-2xl glass-panel text-xs font-medium flex items-center gap-2 whitespace-nowrap self-start sm:self-center shrink-0"
          >
            <Sprout className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
            <span>Tiny Garden</span>
            <span className="font-mono-num text-[var(--nudge-muted)]">
              {state.garden.energy}
            </span>
            {state.garden.unseenActionCount > 0 && (
              <span
                aria-label="New garden growth"
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--nudge-accent)' }}
              />
            )}
          </button>
        )}
      </header>

      {/* Empathetic Headline Card */}
      <section className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--nudge-accent)' }}>
            <Sprout className="w-4 h-4" />
            <span>Your Gentle Summary</span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-medium text-[var(--nudge-ink)] text-balance">
            {summary.encouragementMessage}
          </h2>
          <p className="text-xs md:text-sm text-[var(--nudge-muted)]">
            Completing three activities in a seven-step routine counts as three positive actions. Quiet days are simply rest, never failure.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="glass-panel-strong rounded-2xl p-3.5 text-center min-w-[84px]">
            <p className="font-mono-num text-2xl font-semibold text-[var(--nudge-ink)]">
              {summary.todayCount}
            </p>
            <p className="text-[11px] text-[var(--nudge-muted)] mt-0.5">Today</p>
          </div>
          <div className="glass-panel-strong rounded-2xl p-3.5 text-center min-w-[84px]">
            <p className="font-mono-num text-2xl font-semibold text-[var(--nudge-ink)]">
              {summary.weekCount}
            </p>
            <p className="text-[11px] text-[var(--nudge-muted)] mt-0.5">This week</p>
          </div>
          <div className="glass-panel-strong rounded-2xl p-3.5 text-center min-w-[84px]">
            <p className="font-mono-num text-2xl font-semibold text-[var(--nudge-ink)]">
              {summary.monthCount}
            </p>
            <p className="text-[11px] text-[var(--nudge-muted)] mt-0.5">This month</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Visualization */}
        <section className="lg:col-span-7 glass-panel rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-medium">This Week</h3>
            <span className="font-mono-num text-xs text-[var(--nudge-muted)]">
              {summary.weekCount} total
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
            {summary.weeklyBars.map((bar) => {
              const heightPct = bar.count === 0 ? 6 : Math.max(16, Math.round((bar.count / maxBar) * 100));
              return (
                <div key={bar.dateKey} className="flex flex-col items-center justify-end h-full gap-2">
                  <span className="font-mono-num text-[11px] text-[var(--nudge-muted)]">
                    {bar.count > 0 ? bar.count : ''}
                  </span>
                  <div className="w-full max-w-[34px] flex-1 flex items-end">
                    <div
                      className="w-full rounded-xl transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor:
                          bar.count > 0
                            ? 'var(--nudge-accent)'
                            : 'var(--nudge-taupe)',
                        opacity: bar.count > 0 ? 1 : 0.35,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[11px] ${
                      bar.isToday ? 'font-semibold text-[var(--nudge-ink)]' : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="lg:col-span-5 glass-panel rounded-3xl p-5 space-y-4">
          <h3 className="font-display text-lg font-medium">By Area</h3>
          {summary.byCategory.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Heart className="w-5 h-5 mx-auto text-[var(--nudge-muted)]" />
              <p className="text-sm text-[var(--nudge-muted)]">
                Your completed actions will appear here naturally as you check things off.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.byCategory.map((cat) => {
                const pct = Math.round((cat.count / Math.max(1, summary.totalCount)) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--nudge-ink)]">{cat.category}</span>
                      <span className="font-mono-num text-[var(--nudge-muted)]">{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: 'var(--nudge-accent)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Historical Day Summaries */}
      <section className="glass-panel rounded-3xl p-5 space-y-4">
        <h3 className="font-display text-lg font-medium">Recent Activity Log</h3>
        {summary.recentDays.length === 0 ? (
          <p className="text-sm text-[var(--nudge-muted)]">
            No recorded actions yet. Nothing is fabricated—every item shown here reflects something you truly did for yourself.
          </p>
        ) : (
          <div className="space-y-4">
            {summary.recentDays.map((day) => (
              <div key={day.dateKey} className="space-y-2 pt-3 border-t border-[var(--nudge-glass-border)] first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[var(--nudge-ink)]">
                    {formatDayLabel(day.dateKey, todayKey)}
                  </h4>
                  <span className="font-mono-num text-xs text-[var(--nudge-muted)]">
                    {day.count} positive {day.count === 1 ? 'action' : 'actions'}
                  </span>
                </div>
                <div className="space-y-1">
                  {day.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-[var(--nudge-ink)] truncate">{item.label}</p>
                        <p className="text-[11px] text-[var(--nudge-muted)]">{item.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCompletionRecord(item.id)}
                        aria-label={`Remove ${item.label}`}
                        className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
