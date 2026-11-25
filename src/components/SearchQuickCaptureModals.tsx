import React, { useMemo, useState } from 'react';
import { Backpack, BookHeart, Calendar, CheckSquare, Layers, Plus, Search, StickyNote } from 'lucide-react';
import { GlassSheet } from './ui/GlassSheet';
import { useNudge } from '../context/NudgeContext';
import { MainNavTab, OrganizeSubTab } from '../types/nudge';
import { CATEGORY_COLORS } from '../styles/themes';
import { formatReadableDate } from '../utils/dateUtils';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: MainNavTab, subTab?: OrganizeSubTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const { state } = useNudge();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: {
      id: string;
      kind: string;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      action: () => void;
    }[] = [];

    for (const r of state.routines) {
      if (r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)) {
        matches.push({
          id: `rtn_${r.id}`,
          kind: 'Routine',
          title: `${r.emoji} ${r.name}`,
          subtitle: r.archived ? 'Archived routine' : 'Routine',
          icon: <Layers className="w-4 h-4" />,
          action: () => {
            onNavigate('organize', 'routines');
            onClose();
          },
        });
      }
      for (const ver of Object.values(r.versions)) {
        for (const act of ver?.activities || []) {
          if (act.title.toLowerCase().includes(q)) {
            matches.push({
              id: `act_${r.id}_${act.id}`,
              kind: 'Activity',
              title: act.title,
              subtitle: `In ${r.name} · ${act.durationMinutes} min`,
              icon: <Layers className="w-4 h-4" />,
              action: () => {
                onNavigate('organize', 'routines');
                onClose();
              },
            });
          }
        }
      }
    }

    for (const c of state.checklists) {
      if (c.name.toLowerCase().includes(q)) {
        matches.push({
          id: `chk_${c.id}`,
          kind: 'Checklist',
          title: `${c.emoji} ${c.name}`,
          subtitle: `${c.items.length} items`,
          icon: <CheckSquare className="w-4 h-4" />,
          action: () => {
            onNavigate('organize', 'checklists');
            onClose();
          },
        });
      }
      for (const item of c.items) {
        if (item.title.toLowerCase().includes(q)) {
          matches.push({
            id: `ci_${c.id}_${item.id}`,
            kind: 'Checklist Item',
            title: item.title,
            subtitle: `In ${c.name}`,
            icon: <CheckSquare className="w-4 h-4" />,
            action: () => {
              onNavigate('organize', 'checklists');
              onClose();
            },
          });
        }
      }
    }

    for (const b of state.backpacks) {
      const hitItem = b.items.find((i) => i.name.toLowerCase().includes(q));
      if (b.name.toLowerCase().includes(q) || hitItem) {
        matches.push({
          id: `bp_${b.id}`,
          kind: 'Backpack',
          title: `${b.emoji} ${b.name}`,
          subtitle: hitItem ? `Contains "${hitItem.name}"` : b.category,
          icon: <Backpack className="w-4 h-4" />,
          action: () => {
            onNavigate('organize', 'backpacks');
            onClose();
          },
        });
      }
    }

    for (const cal of state.calendarItems) {
      if (cal.title.toLowerCase().includes(q) || cal.description?.toLowerCase().includes(q)) {
        matches.push({
          id: `cal_${cal.id}`,
          kind: cal.type === 'task' ? 'Task' : 'Calendar Event',
          title: cal.title,
          subtitle: `${formatReadableDate(cal.date)}${cal.startTime ? ` · ${cal.startTime}` : ''}`,
          icon: <Calendar className="w-4 h-4" />,
          action: () => {
            onNavigate('calendar');
            onClose();
          },
        });
      }
    }

    for (const j of state.journalEntries) {
      if (j.content.toLowerCase().includes(q) || j.title?.toLowerCase().includes(q)) {
        matches.push({
          id: `jrn_${j.id}`,
          kind: 'Journal',
          title: j.title || formatReadableDate(j.date),
          subtitle: j.content.slice(0, 80),
          icon: <BookHeart className="w-4 h-4" />,
          action: () => {
            onNavigate('journal');
            onClose();
          },
        });
      }
    }

    for (const bd of state.brainDumpEntries) {
      if (bd.text.toLowerCase().includes(q)) {
        matches.push({
          id: `bd_${bd.id}`,
          kind: 'Brain Dump',
          title: bd.text.slice(0, 70),
          subtitle: 'Brain Dump note',
          icon: <StickyNote className="w-4 h-4" />,
          action: () => {
            onNavigate('organize', 'brain-dump');
            onClose();
          },
        });
      }
    }

    return matches.slice(0, 25);
  }, [query, state, onNavigate, onClose]);

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Search Nudge"
      subtitle="Routines, activities, checklists, backpacks, calendar, and journal"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--nudge-muted)]" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything in your Nudge..."
            className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
          />
        </div>

        {!query.trim() ? (
          <p className="text-xs text-[var(--nudge-muted)] text-center py-6">
            Type a word to search across all your local routines, tasks, packing lists, and journal entries.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-[var(--nudge-muted)] text-center py-8">
            No matches found for "{query}".
          </p>
        ) : (
          <div className="divide-y divide-[var(--nudge-glass-border)]">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full py-3 px-2 flex items-start gap-3 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <span className="mt-0.5 text-[var(--nudge-muted)]">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--nudge-ink)] truncate">{item.title}</p>
                  <p className="text-xs text-[var(--nudge-muted)] truncate">
                    {item.kind} · {item.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </GlassSheet>
  );
};

interface QuickCaptureModalProps {
  open: boolean;
  initialMode?: 'task' | 'reminder' | 'brain-dump';
  onClose: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  open,
  initialMode = 'task',
  onClose,
}) => {
  const { todayKey, addCalendarItem, addNotification, addBrainDumpEntry } = useNudge();
  const [mode, setMode] = useState<'task' | 'reminder' | 'brain-dump'>(initialMode);
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState('');

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setDate(todayKey);
      setText('');
      setTime('');
    }
  }, [open, initialMode, todayKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;

    if (mode === 'brain-dump') {
      addBrainDumpEntry(clean, 'thought');
    } else if (mode === 'reminder') {
      addNotification({
        title: clean,
        body: 'Gentle reminder you captured for yourself.',
        category: 'tasks',
        scheduledFor: `${date} ${time || '09:00'}`,
        status: 'pending',
      });
    } else {
      addCalendarItem({
        title: clean,
        type: 'task',
        date,
        startTime: time || undefined,
        color: CATEGORY_COLORS[0],
        recurrence: { frequency: 'none' },
      });
    }
    onClose();
  };

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Quick Capture"
      subtitle="Save a thought, task, or reminder in seconds"
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
          {([
            { id: 'task', label: 'Task' },
            { id: 'reminder', label: 'Reminder' },
            { id: 'brain-dump', label: 'Brain Dump' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === tab.id
                  ? 'bg-[var(--nudge-accent)] text-white'
                  : 'text-[var(--nudge-muted)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--nudge-muted)] mb-1.5">
            {mode === 'brain-dump' ? "What's on your mind?" : mode === 'reminder' ? 'Reminder' : 'Task'}
          </label>
          {mode === 'brain-dump' ? (
            <textarea
              rows={3}
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write anything without worrying about structure..."
              className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
            />
          ) : (
            <input
              type="text"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mode === 'reminder' ? 'e.g., Drink water or take meds' : 'e.g., Call pharmacy'}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
            />
          )}
        </div>

        {mode !== 'brain-dump' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Time (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
        >
          <Plus className="w-4 h-4" />
          Save {mode === 'brain-dump' ? 'Thought' : mode === 'reminder' ? 'Reminder' : 'Task'}
        </button>
      </form>
    </GlassSheet>
  );
};
