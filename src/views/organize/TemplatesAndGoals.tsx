import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { useNudge } from '../../context/NudgeContext';
import { AnyTemplate, TEMPLATE_CATEGORIES, TEMPLATE_LIBRARY } from '../../data/templates';
import { createId } from '../../storage/persistence';
import { GlassSheet } from '../../components/ui/GlassSheet';
import { CATEGORY_COLORS } from '../../styles/themes';
import { computePositiveActionsSummary } from '../../services/positiveActions';
import { getLocalWeekDates } from '../../utils/dateUtils';
import { BrainDumpEntry } from '../../types/nudge';

/* ---------------- TEMPLATES LIBRARY ---------------- */
export const TemplatesLibrary: React.FC = () => {
  const { addRoutine, addChecklist, addBackpack } = useNudge();
  const [category, setCategory] = useState<string>('All');
  const [previewTpl, setPreviewTpl] = useState<AnyTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const filtered = useMemo(
    () =>
      category === 'All'
        ? TEMPLATE_LIBRARY
        : TEMPLATE_LIBRARY.filter((t) => t.category === category),
    [category]
  );

  const openPreview = (tpl: AnyTemplate) => {
    setPreviewTpl(tpl);
    setCustomName(tpl.name);
    setSavedMsg('');
  };

  const handleSaveTemplate = () => {
    if (!previewTpl) return;
    const finalName = customName.trim() || previewTpl.name;
    if (previewTpl.kind === 'routine') {
      addRoutine({
        name: finalName,
        emoji: previewTpl.emoji,
        color: previewTpl.color,
        description: previewTpl.description,
        activeVersion: 'normal',
        versions: {
          normal: {
            activities: previewTpl.activities.map((a) => ({ ...a, id: createId('act') })),
          },
          'low-energy': {
            activities: previewTpl.lowEnergyActivities.map((a) => ({ ...a, id: createId('act') })),
          },
        },
      });
    } else if (previewTpl.kind === 'checklist') {
      addChecklist({
        name: finalName,
        emoji: previewTpl.emoji,
        color: previewTpl.color,
        description: previewTpl.description,
        items: previewTpl.items.map((t) => ({ id: createId('ci'), title: t, completed: false })),
      });
    } else if (previewTpl.kind === 'backpack') {
      addBackpack({
        name: finalName,
        emoji: previewTpl.emoji,
        color: previewTpl.color,
        category: previewTpl.backpackCategory,
        items: previewTpl.items.map((i) => ({
          id: createId('bi'),
          name: i.name,
          quantity: i.quantity,
          required: i.required,
          packed: false,
        })),
      });
    }
    setSavedMsg(`Saved "${finalName}" to your ${previewTpl.kind}s.`);
    setPreviewTpl(null);
  };

  return (
    <div className="space-y-4">
      {savedMsg && (
        <div className="p-3 rounded-2xl bg-[var(--nudge-accent-soft)] text-xs text-[var(--nudge-ink)] flex items-center gap-2">
          <Check className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${
              category === cat
                ? 'bg-[var(--nudge-accent)] text-white'
                : 'glass-panel text-[var(--nudge-muted)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <div key={tpl.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--nudge-muted)]">
                <span>
                  {tpl.category} · <span className="capitalize">{tpl.kind}</span>
                </span>
                <span className="text-xl">{tpl.emoji}</span>
              </div>
              <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">{tpl.name}</h3>
              {'description' in tpl && (
                <p className="text-xs text-[var(--nudge-muted)]">{tpl.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => openPreview(tpl)}
              className="min-h-[40px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center justify-center gap-1.5"
            >
              Preview & Customize
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <GlassSheet
        open={Boolean(previewTpl)}
        onClose={() => setPreviewTpl(null)}
        title={previewTpl ? `${previewTpl.emoji} Preview Template` : ''}
        subtitle="Customize the name before saving—nothing is added automatically"
        maxWidthClass="max-w-lg"
      >
        {previewTpl && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Custom Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
              />
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {previewTpl.kind === 'routine' &&
                previewTpl.activities.map((a, i) => (
                  <div key={i} className="flex justify-between text-xs p-2.5 rounded-xl glass-panel">
                    <span>{a.title}</span>
                    <span className="font-mono-num text-[var(--nudge-muted)]">{a.durationMinutes}m</span>
                  </div>
                ))}
              {previewTpl.kind === 'checklist' &&
                previewTpl.items.map((item, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl glass-panel">
                    {item}
                  </div>
                ))}
              {previewTpl.kind === 'backpack' &&
                previewTpl.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs p-2.5 rounded-xl glass-panel">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-[var(--nudge-muted)]">
                      {item.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={handleSaveTemplate}
              className="tactile-btn w-full min-h-[46px] rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              Save to My {previewTpl.kind === 'routine' ? 'Routines' : previewTpl.kind === 'checklist' ? 'Checklists' : 'Backpacks'}
            </button>
          </div>
        )}
      </GlassSheet>
    </div>
  );
};

/* ---------------- PERSONAL GOALS ---------------- */
export const PersonalGoalsManager: React.FC = () => {
  const { state, addGoal, updateGoal, deleteGoal } = useNudge();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [description, setDescription] = useState('');
  const [linkedRoutines, setLinkedRoutines] = useState<string[]>([]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      emoji,
      description: description.trim() || undefined,
      linkedRoutineIds: linkedRoutines,
      linkedTaskIds: [],
    });
    setTitle('');
    setDescription('');
    setLinkedRoutines([]);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="glass-panel rounded-3xl p-5 space-y-3">
        <h3 className="font-display text-lg font-medium">Create a Gentle Goal</h3>
        <div className="flex gap-2">
          <select
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-center text-lg"
          >
            {['🌱', '😴', '🏃', '📖', '🧹', '🌅', '💛'].map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Improve my sleep schedule, Read regularly..."
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
          />
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why this matters gently to you (optional)"
          className="w-full min-h-[40px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
        />
        {state.routines.filter((r) => !r.archived).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-[var(--nudge-muted)] mr-1">Connect routines:</span>
            {state.routines
              .filter((r) => !r.archived)
              .map((r) => {
                const active = linkedRoutines.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setLinkedRoutines((prev) =>
                        active ? prev.filter((x) => x !== r.id) : [...prev, r.id]
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      active
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'glass-panel text-[var(--nudge-muted)]'
                    }`}
                  >
                    {r.emoji} {r.name}
                  </button>
                );
              })}
          </div>
        )}
        <button
          type="submit"
          className="tactile-btn min-h-[44px] px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </form>

      {state.goals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
          <Target className="w-6 h-6 mx-auto text-[var(--nudge-muted)]" />
          <p className="text-sm text-[var(--nudge-muted)]">
            Flexible personal goals live here—connected to routines without harsh deadlines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.goals.map((g) => (
            <div key={g.id} className="glass-panel rounded-3xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <h4 className="font-display text-lg font-medium">{g.title}</h4>
                    {g.description && (
                      <p className="text-xs text-[var(--nudge-muted)]">{g.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(g.id)}
                  aria-label="Delete goal"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {g.linkedRoutineIds.length > 0 && (
                <div className="text-xs text-[var(--nudge-muted)]">
                  Connected routines:{' '}
                  {g.linkedRoutineIds
                    .map((id) => state.routines.find((r) => r.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
              <input
                type="text"
                value={g.weeklyIntention || ''}
                onChange={(e) => updateGoal(g.id, { weeklyIntention: e.target.value })}
                placeholder="Small intention for this week..."
                className="w-full min-h-[38px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- BRAIN DUMP ---------------- */
export const BrainDumpManager: React.FC<{ onOpenAIParse: (text: string) => void }> = ({
  onOpenAIParse,
}) => {
  const {
    state,
    todayKey,
    addBrainDumpEntry,
    updateBrainDumpEntry,
    deleteBrainDumpEntry,
    addCalendarItem,
    addNotification,
    addChecklist,
    addRoutine,
  } = useNudge();

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [converting, setConverting] = useState<BrainDumpEntry | null>(null);
  const [convertTarget, setConvertTarget] = useState<'task' | 'reminder' | 'calendar' | 'checklist' | 'routine'>('task');
  const [convertDate, setConvertDate] = useState(todayKey);
  const [convertTime, setConvertTime] = useState('');

  const handleSaveThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addBrainDumpEntry(input.trim(), 'thought');
    setInput('');
  };

  const handleConfirmConvert = () => {
    if (!converting) return;
    const text = converting.text.trim();
    if (convertTarget === 'task' || convertTarget === 'calendar') {
      addCalendarItem({
        title: text,
        type: convertTarget === 'task' ? 'task' : 'event',
        date: convertDate,
        startTime: convertTime || undefined,
        color: CATEGORY_COLORS[0],
        recurrence: { frequency: 'none' },
      });
    } else if (convertTarget === 'reminder') {
      addNotification({
        title: text,
        body: 'Converted from Brain Dump',
        category: 'tasks',
        scheduledFor: `${convertDate} ${convertTime || '09:00'}`,
        status: 'pending',
      });
    } else if (convertTarget === 'checklist') {
      const existing = state.checklists.find((c) => !c.archived);
      if (existing) {
        // Append to new checklist or create Brain Dump list
        addChecklist({
          name: 'From Brain Dump',
          emoji: '📝',
          color: CATEGORY_COLORS[1],
          items: [{ id: createId('ci'), title: text, completed: false }],
        });
      } else {
        addChecklist({
          name: 'From Brain Dump',
          emoji: '📝',
          color: CATEGORY_COLORS[1],
          items: [{ id: createId('ci'), title: text, completed: false }],
        });
      }
    } else if (convertTarget === 'routine') {
      addRoutine({
        name: text.slice(0, 40),
        emoji: '🌿',
        color: CATEGORY_COLORS[0],
        activeVersion: 'normal',
        versions: {
          normal: {
            activities: [{ id: createId('act'), title: text, durationMinutes: 5 }],
          },
        },
      });
    }
    updateBrainDumpEntry(converting.id, { convertedTo: convertTarget });
    setConverting(null);
  };

  const filtered = state.brainDumpEntries.filter((e) =>
    !search.trim() ? true : e.text.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSaveThought} className="glass-panel rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-medium">Quick Brain Dump</h3>
          {input.trim() && (
            <button
              type="button"
              onClick={() => onOpenAIParse(input)}
              className="min-h-[34px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--nudge-accent)' }} />
              Sort with AI
            </button>
          )}
        </div>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Unload anything swirling in your mind—tasks, worries, ideas, reminders..."
          className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="tactile-btn min-h-[42px] px-5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            Save Thought
          </button>
        </div>
      </form>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--nudge-muted)]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Brain Dump notes..."
          className="w-full min-h-[42px] pl-10 pr-4 rounded-2xl glass-panel text-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--nudge-muted)] text-center py-6">
          No saved thoughts yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((entry) => (
            <div key={entry.id} className="glass-panel rounded-2xl p-4 space-y-2.5">
              <textarea
                rows={2}
                value={entry.text}
                onChange={(e) => updateBrainDumpEntry(entry.id, { text: e.target.value })}
                className="w-full bg-transparent text-sm text-[var(--nudge-ink)] focus:outline-none resize-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--nudge-glass-border)]">
                <span className="text-[11px] text-[var(--nudge-muted)]">
                  {new Date(entry.createdAt).toLocaleDateString()}
                  {entry.convertedTo ? ` · Converted to ${entry.convertedTo}` : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setConverting(entry);
                      setConvertDate(todayKey);
                      setConvertTime('');
                    }}
                    className="min-h-[34px] px-3 rounded-xl glass-panel text-xs font-medium"
                  >
                    Convert...
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAIParse(entry.text)}
                    className="min-h-[34px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" style={{ color: 'var(--nudge-accent)' }} />
                    AI
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBrainDumpEntry(entry.id)}
                    aria-label="Delete thought"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GlassSheet
        open={Boolean(converting)}
        onClose={() => setConverting(null)}
        title="Convert Thought"
        subtitle="Confirm where you would like to place this item"
        maxWidthClass="max-w-md"
      >
        {converting && (
          <div className="space-y-4">
            <p className="p-3 rounded-2xl glass-panel text-sm">{converting.text}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'task', label: 'Task' },
                  { id: 'reminder', label: 'Reminder' },
                  { id: 'calendar', label: 'Calendar Event' },
                  { id: 'checklist', label: 'Checklist Item' },
                  { id: 'routine', label: 'Routine Activity' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConvertTarget(opt.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                    convertTarget === opt.id
                      ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)]'
                      : 'border-[var(--nudge-glass-border)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(convertTarget === 'task' || convertTarget === 'calendar' || convertTarget === 'reminder') && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={convertDate}
                  onChange={(e) => setConvertDate(e.target.value)}
                  className="min-h-[42px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                />
                <input
                  type="time"
                  value={convertTime}
                  onChange={(e) => setConvertTime(e.target.value)}
                  className="min-h-[42px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmConvert}
              className="tactile-btn w-full min-h-[46px] rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              Confirm & Convert
            </button>
          </div>
        )}
      </GlassSheet>
    </div>
  );
};

/* ---------------- WEEKLY RESET ---------------- */
export const WeeklyResetView: React.FC = () => {
  const { state, todayKey, saveWeeklyReflection } = useNudge();
  const weekDates = useMemo(() => getLocalWeekDates(todayKey), [todayKey]);
  const weekKey = weekDates[0];
  const summary = useMemo(
    () => computePositiveActionsSummary(state.completionLog),
    [state.completionLog]
  );

  const saved = state.weeklyReflections[weekKey] || { reflection: '', intention: '' };
  const [reflection, setReflection] = useState(saved.reflection);
  const [intention, setIntention] = useState(saved.intention);
  const [notice, setNotice] = useState('');

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-5 max-w-2xl">
      <div>
        <h3 className="font-display text-xl font-medium">Weekly Reset</h3>
        <p className="text-xs text-[var(--nudge-muted)] mt-1">
          An optional, calm check-in for the week of {weekKey}. No pressure to fill everything out.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[var(--nudge-accent-soft)] space-y-1">
        <p className="text-sm font-medium text-[var(--nudge-ink)]">{summary.encouragementMessage}</p>
        <p className="text-xs text-[var(--nudge-muted)]">
          Active routines: {state.routines.filter((r) => !r.archived).length} · Active backpacks:{' '}
          {state.backpacks.filter((b) => !b.archived).length}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--nudge-muted)] mb-1">
            How did this week feel? What felt supportive?
          </label>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write a brief, kind note to yourself..."
            className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--nudge-muted)] mb-1">
            Gentle intention for the coming week
          </label>
          <input
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="e.g., Pack my work bag the night before, keep mornings light..."
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
          />
        </div>
      </div>

      {notice && (
        <p className="text-xs font-medium" style={{ color: 'var(--nudge-accent)' }}>
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          saveWeeklyReflection(weekKey, reflection, intention);
          setNotice('Weekly Reset saved locally.');
        }}
        className="tactile-btn min-h-[44px] px-6 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
      >
        Save Weekly Reset
      </button>
    </div>
  );
};
