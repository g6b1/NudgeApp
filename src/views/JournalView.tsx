import React, { useMemo, useState } from 'react';
import { BookHeart, Calendar as CalendarIcon, Lock, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useNudge } from '../context/NudgeContext';
import { JOURNAL_MOODS, JOURNAL_PROMPTS } from '../data/motivationalTips';
import { JournalEntry, MoodType } from '../types/nudge';
import { formatReadableDate } from '../utils/dateUtils';
import { GlassSheet } from '../components/ui/GlassSheet';

export const JournalView: React.FC = () => {
  const { state, todayKey, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useNudge();
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodType | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [date, setDate] = useState(todayKey);
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<MoodType>('calm');
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');

  const openNewEntry = (selectedPrompt = '') => {
    setEditingEntry(null);
    setDate(todayKey);
    setTitle('');
    setMood('calm');
    setPrompt(selectedPrompt);
    setContent('');
    setEditorOpen(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setTitle(entry.title || '');
    setMood(entry.mood);
    setPrompt(entry.prompt || '');
    setContent(entry.content);
    setEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, {
        date,
        title: title.trim() || undefined,
        mood,
        prompt: prompt || undefined,
        content: content.trim(),
      });
    } else {
      addJournalEntry({
        date,
        title: title.trim() || undefined,
        mood,
        prompt: prompt || undefined,
        content: content.trim(),
      });
    }
    setEditorOpen(false);
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.journalEntries
      .filter((entry) => {
        if (moodFilter !== 'all' && entry.mood !== moodFilter) return false;
        if (!q) return true;
        return (
          entry.content.toLowerCase().includes(q) ||
          entry.title?.toLowerCase().includes(q) ||
          entry.date.includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [state.journalEntries, searchQuery, moodFilter]);

  const getMoodMeta = (id: MoodType) => JOURNAL_MOODS.find((m) => m.id === id) || JOURNAL_MOODS[1];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-[var(--nudge-ink)]">
            Private Journal
          </h1>
          <p className="text-xs md:text-sm text-[var(--nudge-muted)] mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Stored locally on your device. Never sent to AI automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNewEntry()}
          className="tactile-btn min-h-[44px] px-5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shrink-0"
          style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </header>

      {/* Gentle Prompts Strip */}
      <section className="glass-panel rounded-3xl p-4 space-y-2.5">
        <p className="text-xs font-medium text-[var(--nudge-muted)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--nudge-accent)' }} />
          Optional reflection prompts
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {JOURNAL_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => openNewEntry(p)}
              className="px-3.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[var(--nudge-accent-soft)] text-xs text-[var(--nudge-ink)] whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Search & Mood Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--nudge-muted)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl glass-panel text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setMoodFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              moodFilter === 'all'
                ? 'bg-[var(--nudge-accent)] text-white'
                : 'glass-panel text-[var(--nudge-muted)]'
            }`}
          >
            All moods
          </button>
          {JOURNAL_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMoodFilter(m.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                moodFilter === m.id
                  ? 'bg-[var(--nudge-accent)] text-white'
                  : 'glass-panel text-[var(--nudge-muted)]'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
          <BookHeart className="w-7 h-7 mx-auto text-[var(--nudge-muted)]" />
          <h2 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
            {state.journalEntries.length === 0 ? 'A quiet space for your thoughts' : 'No matching entries'}
          </h2>
          <p className="text-sm text-[var(--nudge-muted)] max-w-md mx-auto">
            {state.journalEntries.length === 0
              ? 'Write a single sentence or pick a gentle prompt whenever you want to check in with yourself.'
              : 'Try clearing your search or selecting a different mood.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const moodMeta = getMoodMeta(entry.mood);
            return (
              <article key={entry.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--nudge-muted)]">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{formatReadableDate(entry.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {moodMeta.emoji} {moodMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditEntry(entry)}
                        aria-label="Edit entry"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteJournalEntry(entry.id)}
                        aria-label="Delete entry"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-[var(--nudge-muted)] hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.title && (
                    <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
                      {entry.title}
                    </h3>
                  )}

                  {entry.prompt && (
                    <p className="text-xs italic text-[var(--nudge-muted)]">{entry.prompt}</p>
                  )}

                  <p className="text-sm text-[var(--nudge-ink)]/90 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Entry Sheet */}
      <GlassSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
        subtitle="Saved privately on your device"
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Calendar date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A gentle title..."
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">How are you feeling?</label>
            <div className="grid grid-cols-4 gap-2">
              {JOURNAL_MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition-colors ${
                    mood === m.id
                      ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)] text-[var(--nudge-ink)]'
                      : 'border-[var(--nudge-glass-border)] text-[var(--nudge-muted)]'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1">
              Reflection prompt (optional)
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Optional prompt..."
              className="w-full min-h-[42px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1">Entry</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely..."
              className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm leading-relaxed focus:outline-none focus:border-[var(--nudge-accent)]"
            />
          </div>

          <button
            type="submit"
            className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            {editingEntry ? 'Save Changes' : 'Save Entry'}
          </button>
        </form>
      </GlassSheet>
    </div>
  );
};
