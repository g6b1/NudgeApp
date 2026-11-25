import React, { useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  History,
  Pencil,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNudge } from '../../context/NudgeContext';
import { Routine, RoutineActivity, RoutineVersionType } from '../../types/nudge';
import { CATEGORY_COLORS } from '../../styles/themes';
import { createId } from '../../storage/persistence';
import { GlassSheet } from '../../components/ui/GlassSheet';
import { SharePayload } from '../../components/QRShareImportModal';

interface RoutinesManagerProps {
  onStartGuided: (routine: Routine) => void;
  onShareQR: (payload: SharePayload) => void;
  onOpenAIRoutine: () => void;
}

const VERSIONS: { id: RoutineVersionType; label: string }[] = [
  { id: 'full', label: 'Full' },
  { id: 'normal', label: 'Normal' },
  { id: 'quick', label: 'Quick' },
  { id: 'low-energy', label: 'Low Energy' },
  { id: 'bare-minimum', label: 'Bare Minimum' },
];

const EMOJIS = ['🌅', '🌙', '💼', '🧹', '🧴', '📚', '🏃', '🍵', '🌿', '🛏️', '☀️', '🧘'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const RoutinesManager: React.FC<RoutinesManagerProps> = ({
  onStartGuided,
  onShareQR,
  onOpenAIRoutine,
}) => {
  const {
    state,
    todayKey,
    addRoutine,
    updateRoutine,
    duplicateRoutine,
    archiveRoutine,
    deleteRoutinePermanently,
    isActionCompletedToday,
    togglePositiveAction,
  } = useNudge();

  const [tab, setTab] = useState<'active' | 'checked-off' | 'archived' | 'history'>('active');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌅');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [description, setDescription] = useState('');
  const [activeVer, setActiveVer] = useState<RoutineVersionType>('normal');
  const [editVer, setEditVer] = useState<RoutineVersionType>('normal');
  const [versions, setVersions] = useState<Partial<Record<RoutineVersionType, { activities: RoutineActivity[] }>>>({
    normal: { activities: [] },
  });
  const [linkedBackpackId, setLinkedBackpackId] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [newActTitle, setNewActTitle] = useState('');
  const [newActMinutes, setNewActMinutes] = useState(5);

  const openCreate = () => {
    setEditingRoutine(null);
    setName('');
    setEmoji('🌅');
    setColor(CATEGORY_COLORS[0]);
    setDescription('');
    setActiveVer('normal');
    setEditVer('normal');
    setVersions({ normal: { activities: [] } });
    setLinkedBackpackId('');
    setScheduleEnabled(false);
    setScheduleDays([1, 2, 3, 4, 5]);
    setScheduleTime('08:00');
    setNewActTitle('');
    setNewActMinutes(5);
    setEditorOpen(true);
  };

  const openEdit = (r: Routine) => {
    setEditingRoutine(r);
    setName(r.name);
    setEmoji(r.emoji);
    setColor(r.color);
    setDescription(r.description || '');
    setActiveVer(r.activeVersion);
    setEditVer(r.activeVersion);
    setVersions(JSON.parse(JSON.stringify(r.versions)));
    setLinkedBackpackId(r.linkedBackpackId || '');
    setScheduleEnabled(Boolean(r.schedule?.enabled));
    setScheduleDays(r.schedule?.daysOfWeek || [1, 2, 3, 4, 5]);
    setScheduleTime(r.schedule?.time || '08:00');
    setNewActTitle('');
    setNewActMinutes(5);
    setEditorOpen(true);
  };

  const currentActivities = versions[editVer]?.activities || [];

  const updateCurrentActivities = (next: RoutineActivity[]) => {
    setVersions((prev) => ({
      ...prev,
      [editVer]: { activities: next },
    }));
  };

  const handleAddActivity = () => {
    if (!newActTitle.trim()) return;
    updateCurrentActivities([
      ...currentActivities,
      {
        id: createId('act'),
        title: newActTitle.trim(),
        durationMinutes: Math.max(1, Number(newActMinutes) || 5),
      },
    ]);
    setNewActTitle('');
  };

  const moveActivity = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= currentActivities.length) return;
    const copy = [...currentActivities];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    updateCurrentActivities(copy);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      emoji,
      color,
      description: description.trim() || undefined,
      activeVersion: activeVer,
      versions,
      linkedBackpackId: linkedBackpackId || undefined,
      schedule: scheduleEnabled
        ? { enabled: true, daysOfWeek: scheduleDays, time: scheduleTime }
        : { enabled: false, daysOfWeek: scheduleDays, time: scheduleTime },
    };

    if (editingRoutine) {
      updateRoutine(editingRoutine.id, payload);
    } else {
      addRoutine(payload);
    }
    setEditorOpen(false);
  };

  const activeList = state.routines.filter((r) => !r.archived);
  const archivedList = state.routines.filter((r) => r.archived);
  const routineHistory = state.completionLog
    .filter((c) => c.sourceType === 'routine-activity')
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const checkedOffToday = activeList.flatMap((r) => {
    const ver = r.activeVersion;
    const acts = r.versions[ver]?.activities || [];
    return acts
      .filter((a) => isActionCompletedToday('routine-activity', r.id, `${ver}_${a.id}`))
      .map((a) => ({ routine: r, ver, activity: a }));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
          {(
            [
              { id: 'active', label: `Active (${activeList.length})` },
              { id: 'checked-off', label: `Checked Off (${checkedOffToday.length})` },
              { id: 'archived', label: `Archived (${archivedList.length})` },
              { id: 'history', label: 'History' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === t.id
                  ? 'bg-[var(--nudge-accent)] text-white'
                  : 'text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAIRoutine}
            className="min-h-[40px] px-3.5 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--nudge-accent)' }} />
            AI Draft
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="tactile-btn min-h-[40px] px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            <Plus className="w-4 h-4" />
            New Routine
          </button>
        </div>
      </div>

      {tab === 'active' && (
        <>
          {activeList.length === 0 ? (
            <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
              <p className="text-sm font-medium text-[var(--nudge-ink)]">No routines yet</p>
              <p className="text-xs text-[var(--nudge-muted)]">
                Create a routine with Full, Quick, or Low Energy versions, or borrow one from Templates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeList.map((r) => {
                const acts = r.versions[r.activeVersion]?.activities || [];
                const totalMin = acts.reduce((acc, a) => acc + a.durationMinutes, 0);
                const linkedBp = r.linkedBackpackId
                  ? state.backpacks.find((b) => b.id === r.linkedBackpackId)
                  : undefined;

                return (
                  <div key={r.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">{r.emoji}</span>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)] truncate">
                              {r.name}
                            </h3>
                            <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                              {acts.length} steps · ~{totalMin} min
                              {linkedBp ? ` · Linked: ${linkedBp.emoji} ${linkedBp.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartGuided(r)}
                          className="tactile-btn min-h-[38px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                          style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                        >
                          <Play className="w-3.5 h-3.5" />
                          Guide
                        </button>
                      </div>

                      {r.description && (
                        <p className="text-xs text-[var(--nudge-muted)]">{r.description}</p>
                      )}

                      {/* Version Switcher */}
                      <div className="flex flex-wrap gap-1">
                        {VERSIONS.filter((v) => (r.versions[v.id]?.activities.length || 0) > 0 || v.id === r.activeVersion).map(
                          (v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => updateRoutine(r.id, { activeVersion: v.id })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                                r.activeVersion === v.id
                                  ? 'bg-[var(--nudge-accent-soft)] text-[var(--nudge-ink)]'
                                  : 'text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
                              }`}
                            >
                              {v.label}
                            </button>
                          )
                        )}
                      </div>

                      <div className="space-y-1">
                        {acts.map((a) => {
                          const done = isActionCompletedToday('routine-activity', r.id, `${r.activeVersion}_${a.id}`);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() =>
                                togglePositiveAction({
                                  sourceType: 'routine-activity',
                                  sourceId: r.id,
                                  itemId: `${r.activeVersion}_${a.id}`,
                                  label: `${r.name}: ${a.title}`,
                                  category: 'Routines',
                                })
                              }
                              className="w-full py-1.5 px-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    done
                                      ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                      : 'border-[var(--nudge-taupe)]'
                                  }`}
                                >
                                  {done && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <span className={`text-xs truncate ${done ? 'line-through opacity-55' : ''}`}>
                                  {a.title}
                                </span>
                              </div>
                              <span className="font-mono-num text-[11px] text-[var(--nudge-muted)] shrink-0">
                                {a.durationMinutes}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--nudge-glass-border)]">
                      <button
                        type="button"
                        onClick={() => onShareQR({ v: 1, type: 'routine', data: r })}
                        aria-label="Share routine QR"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateRoutine(r.id)}
                        aria-label="Duplicate routine"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        aria-label="Edit routine"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveRoutine(r.id, true)}
                        aria-label="Archive routine"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'checked-off' && (
        <div className="glass-panel rounded-3xl p-5 space-y-3">
          <h3 className="font-display text-base font-medium">Completed Today</h3>
          {checkedOffToday.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">
              Activities you check off today appear here so you can undo accidental taps anytime.
            </p>
          ) : (
            <div className="space-y-2">
              {checkedOffToday.map(({ routine, ver, activity }) => (
                <div key={`${routine.id}_${activity.id}`} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--nudge-ink)]">
                      {routine.emoji} {activity.title}
                    </p>
                    <p className="text-xs text-[var(--nudge-muted)]">
                      {routine.name} · {ver.replace('-', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      togglePositiveAction({
                        sourceType: 'routine-activity',
                        sourceId: routine.id,
                        itemId: `${ver}_${activity.id}`,
                        label: `${routine.name}: ${activity.title}`,
                        category: 'Routines',
                      })
                    }
                    className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'archived' && (
        <div className="glass-panel rounded-3xl p-5 space-y-3">
          {archivedList.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No archived routines.</p>
          ) : (
            archivedList.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                <span className="text-sm font-medium">
                  {r.emoji} {r.name}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => archiveRoutine(r.id, false)}
                    className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoutinePermanently(r.id)}
                    className="min-h-[36px] px-3 rounded-xl text-xs text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="glass-panel rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[var(--nudge-muted)]">
            <History className="w-4 h-4" />
            <span>Recent Routine Completions</span>
          </div>
          {routineHistory.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No routine completions recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {routineHistory.slice(0, 30).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                  <span className="text-[var(--nudge-ink)]">{h.label}</span>
                  <span className="font-mono-num text-[var(--nudge-muted)]">
                    {h.date === todayKey ? 'Today' : h.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Routine Editor Modal */}
      <GlassSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingRoutine ? 'Edit Routine' : 'Create Routine'}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSaveRoutine} className="space-y-4">
          <div className="flex gap-2">
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              aria-label="Choose routine emoji"
              className="w-16 min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-center text-xl"
            >
              {EMOJIS.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Routine name (e.g., Morning Routine)"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional gentle description..."
            className="w-full min-h-[42px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-[var(--nudge-ink)]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <select
              value={linkedBackpackId}
              onChange={(e) => setLinkedBackpackId(e.target.value)}
              className="min-h-[38px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
            >
              <option value="">No linked backpack</option>
              {state.backpacks
                .filter((b) => !b.archived)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    Link: {b.emoji} {b.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Version Editor */}
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--nudge-ink)]">Edit Version</span>
              <button
                type="button"
                onClick={() => setActiveVer(editVer)}
                className="text-[11px] font-medium"
                style={{ color: 'var(--nudge-accent)' }}
              >
                {activeVer === editVer ? 'Default version' : 'Set as default'}
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {VERSIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setEditVer(v.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    editVer === v.id
                      ? 'bg-[var(--nudge-accent)] text-white'
                      : 'bg-[var(--nudge-canvas)] text-[var(--nudge-muted)]'
                  }`}
                >
                  {v.label} ({versions[v.id]?.activities.length || 0})
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {currentActivities.map((act, idx) => (
                <div key={act.id} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={act.title}
                    onChange={(e) => {
                      const copy = [...currentActivities];
                      copy[idx] = { ...act, title: e.target.value };
                      updateCurrentActivities(copy);
                    }}
                    className="flex-1 min-h-[38px] px-2.5 rounded-lg bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={act.durationMinutes}
                    onChange={(e) => {
                      const copy = [...currentActivities];
                      copy[idx] = { ...act, durationMinutes: Math.max(1, Number(e.target.value) || 1) };
                      updateCurrentActivities(copy);
                    }}
                    className="w-14 min-h-[38px] px-2 rounded-lg bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => moveActivity(idx, -1)}
                    aria-label="Move up"
                    className="min-h-[34px] min-w-[30px] flex items-center justify-center text-[var(--nudge-muted)]"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveActivity(idx, 1)}
                    aria-label="Move down"
                    className="min-h-[34px] min-w-[30px] flex items-center justify-center text-[var(--nudge-muted)]"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateCurrentActivities(currentActivities.filter((a) => a.id !== act.id))
                    }
                    aria-label="Delete activity"
                    className="min-h-[34px] min-w-[30px] flex items-center justify-center text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newActTitle}
                onChange={(e) => setNewActTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddActivity();
                  }
                }}
                placeholder="Add step..."
                className="flex-1 min-h-[40px] px-3 rounded-xl bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs"
              />
              <input
                type="number"
                min={1}
                max={180}
                value={newActMinutes}
                onChange={(e) => setNewActMinutes(Number(e.target.value) || 5)}
                className="w-16 min-h-[40px] px-2 rounded-xl bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="min-h-[40px] px-3.5 rounded-xl glass-panel text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Schedule */}
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-2.5">
            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>Schedule on specific days</span>
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
              />
            </label>
            {scheduleEnabled && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {DAYS.map((d, idx) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setScheduleDays((prev) =>
                          prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                        )
                      }
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium ${
                        scheduleDays.includes(idx)
                          ? 'bg-[var(--nudge-accent)] text-white'
                          : 'bg-[var(--nudge-canvas)] text-[var(--nudge-muted)]'
                      }`}
                    >
                      {d.slice(0, 2)}
                    </button>
                  ))}
                </div>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            {editingRoutine ? 'Save Routine' : 'Create Routine'}
          </button>
        </form>
      </GlassSheet>
    </div>
  );
};
