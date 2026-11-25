import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import {
  CalendarInstance,
  CalendarItem,
  RecurrenceFrequency,
  RecurrenceRule,
} from '../types/nudge';
import {
  addDays,
  addDaysToKey,
  formatFullDate,
  formatTime12h,
  getCalendarInstancesForDate,
  getLocalWeekDates,
  getMonthGridDates,
  parseLocalDateKey,
  toLocalDateKey,
} from '../utils/dateUtils';
import { GlassSheet } from '../components/ui/GlassSheet';
import { CATEGORY_COLORS } from '../styles/themes';

type CalendarMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
  onOpenNudgePlanDay: () => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RECURRENCE_LABELS: { id: RecurrenceFrequency; label: string }[] = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Every week (selected weekdays)' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'every-n-weeks', label: 'Every N weeks' },
  { id: 'monthly-date', label: 'Every month on a specific date' },
  { id: 'monthly-first-weekday', label: 'First weekday of each month' },
  { id: 'monthly-last-weekday', label: 'Last weekday of each month' },
];

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenNudgePlanDay }) => {
  const {
    state,
    todayKey,
    addCalendarItem,
    updateCalendarItem,
    overrideCalendarOccurrence,
    toggleCalendarCompletion,
    deleteCalendarItem,
    addNotification,
  } = useNudge();

  const [viewMode, setViewMode] = useState<CalendarMode>('month');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editScope, setEditScope] = useState<'create' | 'series' | 'occurrence'>('create');
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [occurrenceDateKey, setOccurrenceDateKey] = useState<string>(todayKey);

  // Form fields
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<'task' | 'event' | 'routine'>('task');
  const [routineId, setRoutineId] = useState('');
  const [date, setDate] = useState(todayKey);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [reminderMinutes, setReminderMinutes] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('none');
  const [intervalWeeks, setIntervalWeeks] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([new Date().getDay()]);
  const [monthDay, setMonthDay] = useState<number>(new Date().getDate());
  const [targetWeekday, setTargetWeekday] = useState<number>(new Date().getDay());
  const [endDate, setEndDate] = useState('');

  const selectedDateObj = useMemo(() => parseLocalDateKey(selectedDateKey), [selectedDateKey]);
  const monthGrid = useMemo(
    () => getMonthGridDates(selectedDateObj.getFullYear(), selectedDateObj.getMonth()),
    [selectedDateObj]
  );
  const weekDateKeys = useMemo(() => getLocalWeekDates(selectedDateKey), [selectedDateKey]);
  const selectedDayInstances = useMemo(
    () => getCalendarInstancesForDate(state.calendarItems, selectedDateKey),
    [state.calendarItems, selectedDateKey]
  );

  const selectedDayJournal = useMemo(
    () => state.journalEntries.filter((j) => j.date === selectedDateKey),
    [state.journalEntries, selectedDateKey]
  );

  const shiftPeriod = (dir: -1 | 1) => {
    if (viewMode === 'day') {
      setSelectedDateKey(addDaysToKey(selectedDateKey, dir));
    } else if (viewMode === 'week') {
      setSelectedDateKey(addDaysToKey(selectedDateKey, dir * 7));
    } else {
      const d = parseLocalDateKey(selectedDateKey);
      const moved = new Date(d.getFullYear(), d.getMonth() + dir, 1);
      setSelectedDateKey(toLocalDateKey(moved));
    }
  };

  const openCreateModal = (defaultDate = selectedDateKey) => {
    const parsed = parseLocalDateKey(defaultDate);
    setEditScope('create');
    setEditingItem(null);
    setTitle('');
    setItemType('task');
    setRoutineId('');
    setDate(defaultDate);
    setStartTime('');
    setEndTime('');
    setDescription('');
    setColor(CATEGORY_COLORS[0]);
    setReminderMinutes('');
    setFrequency('none');
    setIntervalWeeks(3);
    setWeekdays([parsed.getDay()]);
    setMonthDay(parsed.getDate());
    setTargetWeekday(parsed.getDay());
    setEndDate('');
    setEditorOpen(true);
  };

  const openEditModal = (instance: CalendarInstance, scope: 'series' | 'occurrence') => {
    const item = instance.item;
    setEditScope(scope);
    setEditingItem(item);
    setOccurrenceDateKey(instance.date);

    setTitle(scope === 'occurrence' ? instance.title : item.title);
    setItemType(item.type);
    setRoutineId(item.routineId || '');
    setDate(scope === 'occurrence' ? instance.date : item.date);
    setStartTime((scope === 'occurrence' ? instance.startTime : item.startTime) || '');
    setEndTime((scope === 'occurrence' ? instance.endTime : item.endTime) || '');
    setDescription((scope === 'occurrence' ? instance.description : item.description) || '');
    setColor(scope === 'occurrence' ? instance.color : item.color);
    setReminderMinutes(item.reminderMinutes !== undefined ? String(item.reminderMinutes) : '');

    const r = item.recurrence;
    setFrequency(r?.frequency || 'none');
    setIntervalWeeks(r?.intervalWeeks || 3);
    setWeekdays(r?.weekdays || [parseLocalDateKey(item.date).getDay()]);
    setMonthDay(r?.monthDay || parseLocalDateKey(item.date).getDate());
    setTargetWeekday(r?.targetWeekday ?? parseLocalDateKey(item.date).getDay());
    setEndDate(r?.endDate || '');
    setEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTitle =
      itemType === 'routine' && routineId && !title.trim()
        ? state.routines.find((r) => r.id === routineId)?.name || 'Routine'
        : title.trim();
    if (!resolvedTitle) return;

    if (editScope === 'occurrence' && editingItem) {
      overrideCalendarOccurrence(editingItem.id, occurrenceDateKey, {
        title: resolvedTitle,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        color,
      });
      setEditorOpen(false);
      return;
    }

    const recurrence: RecurrenceRule = {
      frequency,
      intervalWeeks: frequency === 'every-n-weeks' ? Math.max(1, intervalWeeks) : undefined,
      weekdays:
        frequency === 'weekly' || frequency === 'biweekly' || frequency === 'every-n-weeks'
          ? weekdays
          : undefined,
      monthDay: frequency === 'monthly-date' ? monthDay : undefined,
      targetWeekday:
        frequency === 'monthly-first-weekday' || frequency === 'monthly-last-weekday'
          ? targetWeekday
          : undefined,
      endDate: endDate || undefined,
    };

    const reminderNum = reminderMinutes !== '' ? Number(reminderMinutes) : undefined;

    if (editScope === 'series' && editingItem) {
      updateCalendarItem(editingItem.id, {
        title: resolvedTitle,
        type: itemType,
        routineId: itemType === 'routine' ? routineId || undefined : undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        color,
        reminderMinutes: reminderNum,
        recurrence,
      });
    } else {
      const created = addCalendarItem({
        title: resolvedTitle,
        type: itemType,
        routineId: itemType === 'routine' ? routineId || undefined : undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        color,
        reminderMinutes: reminderNum,
        recurrence,
      });
      if (reminderNum !== undefined) {
        addNotification({
          title: resolvedTitle,
          body: `Reminder (${reminderNum} min before)`,
          category: itemType === 'routine' ? 'routines' : 'tasks',
          scheduledFor: `${date} ${startTime || '09:00'}`,
          status: 'pending',
          relatedId: created.id,
        });
      }
      setSelectedDateKey(date);
    }

    setEditorOpen(false);
  };

  const periodHeading = useMemo(() => {
    if (viewMode === 'day') return formatFullDate(selectedDateKey);
    if (viewMode === 'week') {
      const first = parseLocalDateKey(weekDateKeys[0]);
      const last = parseLocalDateKey(weekDateKeys[6]);
      return `${first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return selectedDateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [viewMode, selectedDateKey, weekDateKeys, selectedDateObj]);

  const toggleWeekday = (wd: number) => {
    setWeekdays((prev) =>
      prev.includes(wd) ? (prev.length > 1 ? prev.filter((d) => d !== wd) : prev) : [...prev, wd]
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)]">
            Calendar
          </h1>
          <p className="text-xs md:text-sm text-[var(--nudge-muted)] mt-0.5">
            Local dates and gentle scheduling—nothing fabricated
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNudgePlanDay}
            className="min-h-[42px] px-3.5 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--nudge-accent)' }} />
            Plan Tomorrow with AI
          </button>
          <button
            type="button"
            onClick={() => openCreateModal(selectedDateKey)}
            className="tactile-btn min-h-[42px] px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            <Plus className="w-4 h-4" />
            Schedule
          </button>
        </div>
      </header>

      {/* Toolbar: Date Nav + View Switcher */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            aria-label="Previous"
            className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-base md:text-lg font-medium text-[var(--nudge-ink)] min-w-[160px] text-center sm:text-left">
            {periodHeading}
          </h2>
          <button
            type="button"
            onClick={() => shiftPeriod(1)}
            aria-label="Next"
            className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDateKey(todayKey)}
            className="min-h-[36px] px-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-medium text-[var(--nudge-ink)]"
          >
            Today
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 self-start sm:self-auto">
          {(['month', 'week', 'day'] as CalendarMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                viewMode === m
                  ? 'bg-[var(--nudge-accent)] text-white'
                  : 'text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 glass-panel rounded-3xl p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="text-[11px] font-medium text-[var(--nudge-muted)] py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((cellDate) => {
                const key = toLocalDateKey(cellDate);
                const isCurrentMonth = cellDate.getMonth() === selectedDateObj.getMonth();
                const isToday = key === todayKey;
                const isSelected = key === selectedDateKey;
                const dayInstances = getCalendarInstancesForDate(state.calendarItems, key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-2xl flex flex-col items-start justify-between text-left border transition-colors ${
                      isSelected
                        ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)]'
                        : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`font-mono-num text-xs w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[var(--nudge-accent)] text-white font-semibold'
                          : 'text-[var(--nudge-ink)]'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>

                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayInstances.slice(0, 2).map((inst) => (
                        <div
                          key={inst.instanceKey}
                          className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: `${inst.color}26`,
                            color: 'var(--nudge-ink)',
                          }}
                        >
                          {inst.title}
                        </div>
                      ))}
                      {dayInstances.length > 2 && (
                        <div className="text-[10px] text-[var(--nudge-muted)] pl-1">
                          +{dayInstances.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          <div className="lg:col-span-4 glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
                  {formatFullDate(selectedDateKey)}
                </h3>
                <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                  {selectedDayInstances.length}{' '}
                  {selectedDayInstances.length === 1 ? 'scheduled item' : 'scheduled items'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(selectedDateKey)}
                className="min-h-[38px] px-3 rounded-xl glass-panel text-xs font-medium"
              >
                + Add
              </button>
            </div>

            <DayAgendaList
              instances={selectedDayInstances}
              dateKey={selectedDateKey}
              onToggleComplete={toggleCalendarCompletion}
              onEditOccurrence={(inst) => openEditModal(inst, 'occurrence')}
              onEditSeries={(inst) => openEditModal(inst, 'series')}
              onDeleteOccurrence={(inst) =>
                overrideCalendarOccurrence(inst.item.id, inst.date, { cancelled: true })
              }
              onDeleteSeries={(inst) => deleteCalendarItem(inst.item.id)}
            />

            {selectedDayJournal.length > 0 && (
              <div className="pt-3 border-t border-[var(--nudge-glass-border)] space-y-1.5">
                <p className="text-xs font-medium text-[var(--nudge-muted)]">
                  Linked journal entries ({selectedDayJournal.length})
                </p>
                {selectedDayJournal.map((j) => (
                  <p key={j.id} className="text-xs text-[var(--nudge-ink)] line-clamp-2">
                    {j.title || j.content}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDateKeys.map((wkKey) => {
            const d = parseLocalDateKey(wkKey);
            const instances = getCalendarInstancesForDate(state.calendarItems, wkKey);
            const isToday = wkKey === todayKey;
            const isSelected = wkKey === selectedDateKey;

            return (
              <div
                key={wkKey}
                onClick={() => setSelectedDateKey(wkKey)}
                className={`glass-panel rounded-2xl p-3 flex flex-col gap-2.5 min-h-[180px] cursor-pointer border ${
                  isSelected ? 'border-[var(--nudge-accent)]' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--nudge-glass-border)]">
                  <div>
                    <p className="text-[11px] text-[var(--nudge-muted)]">
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                    <p
                      className={`font-mono-num text-sm font-semibold ${
                        isToday ? 'text-[var(--nudge-accent)]' : 'text-[var(--nudge-ink)]'
                      }`}
                    >
                      {d.getDate()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateModal(wkKey);
                    }}
                    aria-label={`Add item on ${wkKey}`}
                    className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-[var(--nudge-muted)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {instances.length === 0 ? (
                  <p className="text-[11px] text-[var(--nudge-muted)] italic">Open</p>
                ) : (
                  <div className="space-y-1.5">
                    {instances.map((inst) => (
                      <div
                        key={inst.instanceKey}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(inst, inst.isRecurringInstance ? 'occurrence' : 'series');
                        }}
                        className="p-2 rounded-xl text-xs space-y-0.5"
                        style={{ backgroundColor: `${inst.color}22` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCalendarCompletion(inst.item.id, wkKey);
                            }}
                            aria-label={`Toggle ${inst.title}`}
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              inst.completed
                                ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                                : 'border-current/40'
                            }`}
                          >
                            {inst.completed && <Check className="w-2.5 h-2.5" />}
                          </button>
                          <span className={`font-medium truncate ${inst.completed ? 'line-through opacity-55' : ''}`}>
                            {inst.title}
                          </span>
                        </div>
                        {inst.startTime && (
                          <p className="font-mono-num text-[10px] text-[var(--nudge-muted)] pl-5">
                            {formatTime12h(inst.startTime)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="glass-panel rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--nudge-muted)]">
              <CalendarIcon className="w-4 h-4" />
              <span>Full Day Schedule</span>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal(selectedDateKey)}
              className="min-h-[40px] px-4 rounded-xl glass-panel text-xs font-medium"
            >
              + Add to this day
            </button>
          </div>

          <DayAgendaList
            instances={selectedDayInstances}
            dateKey={selectedDateKey}
            onToggleComplete={toggleCalendarCompletion}
            onEditOccurrence={(inst) => openEditModal(inst, 'occurrence')}
            onEditSeries={(inst) => openEditModal(inst, 'series')}
            onDeleteOccurrence={(inst) =>
              overrideCalendarOccurrence(inst.item.id, inst.date, { cancelled: true })
            }
            onDeleteSeries={(inst) => deleteCalendarItem(inst.item.id)}
          />
        </div>
      )}

      {/* Schedule / Edit Modal */}
      <GlassSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={
          editScope === 'create'
            ? 'Schedule Item'
            : editScope === 'occurrence'
            ? `Edit Occurrence (${occurrenceDateKey})`
            : 'Edit Series'
        }
        subtitle={
          editScope === 'occurrence'
            ? 'Changes apply only to this date without altering the rest of the recurring series.'
            : undefined
        }
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {editScope === 'create' && (
            <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
              {(['task', 'event', 'routine'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setItemType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${
                    itemType === t
                      ? 'bg-[var(--nudge-accent)] text-white'
                      : 'text-[var(--nudge-muted)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {itemType === 'routine' && editScope !== 'occurrence' && (
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Link a Routine</label>
              <select
                value={routineId}
                onChange={(e) => {
                  const id = e.target.value;
                  setRoutineId(id);
                  const found = state.routines.find((r) => r.id === id);
                  if (found && !title.trim()) setTitle(`${found.emoji} ${found.name}`);
                }}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
              >
                <option value="">Choose a routine...</option>
                {state.routines
                  .filter((r) => !r.archived)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.emoji} {r.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to schedule?"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {editScope !== 'occurrence' && (
              <div>
                <label className="block text-xs text-[var(--nudge-muted)] mb-1">Start Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1">Description (optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Color</label>
              <div className="flex items-center gap-1.5">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-115 ring-2 ring-offset-2 ring-[var(--nudge-ink)]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            {editScope !== 'occurrence' && (
              <div className="w-36">
                <label className="block text-xs text-[var(--nudge-muted)] mb-1">Reminder</label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                  className="w-full min-h-[38px] px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
                >
                  <option value="">None</option>
                  <option value="0">At time</option>
                  <option value="10">10 min before</option>
                  <option value="30">30 min before</option>
                  <option value="60">1 hour before</option>
                </select>
              </div>
            )}
          </div>

          {/* Advanced Recurrence Section */}
          {editScope !== 'occurrence' && (
            <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--nudge-ink)]">
                <Repeat className="w-3.5 h-3.5" />
                <span>Recurrence</span>
              </div>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full min-h-[42px] px-3 rounded-xl bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs"
              >
                {RECURRENCE_LABELS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              {(frequency === 'weekly' || frequency === 'biweekly' || frequency === 'every-n-weeks') && (
                <div className="space-y-2">
                  {frequency === 'every-n-weeks' && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>Every</span>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={intervalWeeks}
                        onChange={(e) => setIntervalWeeks(Number(e.target.value) || 1)}
                        className="w-16 min-h-[36px] px-2 rounded-lg bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] font-mono-num"
                      />
                      <span>weeks on:</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {WEEKDAY_LABELS.map((lbl, idx) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => toggleWeekday(idx)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium ${
                          weekdays.includes(idx)
                            ? 'bg-[var(--nudge-accent)] text-white'
                            : 'bg-[var(--nudge-canvas)] text-[var(--nudge-muted)]'
                        }`}
                      >
                        {lbl.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'monthly-date' && (
                <div className="flex items-center gap-2 text-xs">
                  <span>Day of month:</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    onChange={(e) => setMonthDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-16 min-h-[36px] px-2 rounded-lg bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] font-mono-num"
                  />
                </div>
              )}

              {(frequency === 'monthly-first-weekday' || frequency === 'monthly-last-weekday') && (
                <div className="flex items-center gap-2 text-xs">
                  <span>Weekday:</span>
                  <select
                    value={targetWeekday}
                    onChange={(e) => setTargetWeekday(Number(e.target.value))}
                    className="min-h-[36px] px-2 rounded-lg bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)]"
                  >
                    {WEEKDAY_LABELS.map((lbl, idx) => (
                      <option key={lbl} value={idx}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {frequency !== 'none' && (
                <div>
                  <label className="block text-[11px] text-[var(--nudge-muted)] mb-1">
                    End date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-h-[38px] px-3 rounded-xl bg-[var(--nudge-canvas)] border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            {editScope === 'create' ? 'Save to Calendar' : 'Save Changes'}
          </button>
        </form>
      </GlassSheet>
    </div>
  );
};

interface DayAgendaListProps {
  instances: CalendarInstance[];
  dateKey: string;
  onToggleComplete: (id: string, dateKey: string) => void;
  onEditOccurrence: (inst: CalendarInstance) => void;
  onEditSeries: (inst: CalendarInstance) => void;
  onDeleteOccurrence: (inst: CalendarInstance) => void;
  onDeleteSeries: (inst: CalendarInstance) => void;
}

const DayAgendaList: React.FC<DayAgendaListProps> = ({
  instances,
  dateKey,
  onToggleComplete,
  onEditOccurrence,
  onEditSeries,
  onDeleteOccurrence,
  onDeleteSeries,
}) => {
  if (instances.length === 0) {
    return (
      <p className="text-sm text-[var(--nudge-muted)] py-6 text-center">
        Nothing scheduled for this day.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {instances.map((inst) => (
        <div
          key={inst.instanceKey}
          className="p-3 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-[var(--nudge-glass-border)] space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onToggleComplete(inst.item.id, dateKey)}
              className="flex items-start gap-3 text-left flex-1 min-w-0"
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  inst.completed
                    ? 'bg-[var(--nudge-accent)] border-[var(--nudge-accent)] text-white'
                    : 'border-[var(--nudge-taupe)]'
                }`}
              >
                {inst.completed && <Check className="w-3 h-3" />}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    inst.completed ? 'line-through opacity-55' : 'text-[var(--nudge-ink)]'
                  }`}
                >
                  {inst.title}
                </p>
                <p className="font-mono-num text-xs text-[var(--nudge-muted)] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {inst.startTime ? formatTime12h(inst.startTime) : 'Anytime'}
                  {inst.endTime ? ` – ${formatTime12h(inst.endTime)}` : ''}
                  {inst.isRecurringInstance && ' · Recurring'}
                </p>
                {inst.description && (
                  <p className="text-xs text-[var(--nudge-muted)] mt-1">{inst.description}</p>
                )}
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {inst.isRecurringInstance ? (
                <>
                  <button
                    type="button"
                    onClick={() => onEditOccurrence(inst)}
                    title="Edit only this occurrence"
                    className="px-2 py-1 rounded-lg glass-panel text-[11px]"
                  >
                    This day
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditSeries(inst)}
                    title="Edit entire series"
                    className="px-2 py-1 rounded-lg glass-panel text-[11px]"
                  >
                    Series
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteOccurrence(inst)}
                    title="Skip this occurrence"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onEditSeries(inst)}
                    aria-label="Edit item"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSeries(inst)}
                    aria-label="Delete item"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[var(--nudge-muted)] hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
