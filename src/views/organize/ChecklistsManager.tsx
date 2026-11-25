import React, { useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  History,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNudge } from '../../context/NudgeContext';
import { Checklist, ChecklistItem } from '../../types/nudge';
import { CATEGORY_COLORS } from '../../styles/themes';
import { createId } from '../../storage/persistence';
import { GlassSheet } from '../../components/ui/GlassSheet';
import { SharePayload } from '../../components/QRShareImportModal';

interface ChecklistsManagerProps {
  onShareQR: (payload: SharePayload) => void;
  onOpenAIChecklist: () => void;
}

const EMOJIS = ['📝', '🌱', '🧹', '🛒', '💼', '🎓', '✈️', '🧺', '💛', '🍵'];

export const ChecklistsManager: React.FC<ChecklistsManagerProps> = ({
  onShareQR,
  onOpenAIChecklist,
}) => {
  const {
    state,
    todayKey,
    addChecklist,
    updateChecklist,
    toggleChecklistItem,
    resetChecklist,
    duplicateChecklist,
    archiveChecklist,
    deleteChecklistPermanently,
  } = useNudge();

  const [tab, setTab] = useState<'active' | 'checked-off' | 'archived' | 'history'>('active');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmoji('📝');
    setColor(CATEGORY_COLORS[0]);
    setItems([]);
    setNewItemTitle('');
    setEditorOpen(true);
  };

  const openEdit = (cl: Checklist) => {
    setEditing(cl);
    setName(cl.name);
    setEmoji(cl.emoji);
    setColor(cl.color);
    setItems(cl.items.map((i) => ({ ...i })));
    setNewItemTitle('');
    setEditorOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    setItems((prev) => [...prev, { id: createId('ci'), title: newItemTitle.trim(), completed: false }]);
    setNewItemTitle('');
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setItems(copy);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateChecklist(editing.id, { name: name.trim(), emoji, color, items });
    } else {
      addChecklist({ name: name.trim(), emoji, color, items });
    }
    setEditorOpen(false);
  };

  const activeList = state.checklists.filter((c) => !c.archived);
  const archivedList = state.checklists.filter((c) => c.archived);
  const checkedOffItems = activeList.flatMap((c) =>
    c.items.filter((i) => i.completed).map((i) => ({ checklist: c, item: i }))
  );
  const history = state.completionLog
    .filter((c) => c.sourceType === 'checklist-item')
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
          {(
            [
              { id: 'active', label: `Active (${activeList.length})` },
              { id: 'checked-off', label: `Checked Off (${checkedOffItems.length})` },
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
            onClick={onOpenAIChecklist}
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
            New Checklist
          </button>
        </div>
      </div>

      {tab === 'active' && (
        <>
          {activeList.length === 0 ? (
            <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
              <p className="text-sm font-medium text-[var(--nudge-ink)]">No checklists yet</p>
              <p className="text-xs text-[var(--nudge-muted)]">
                Create reusable checklists for self-care, groceries, or apartment cleaning.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeList.map((cl) => {
                const doneCount = cl.items.filter((i) => i.completed).length;
                return (
                  <div key={cl.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">{cl.emoji}</span>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-medium truncate">{cl.name}</h3>
                            <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                              {doneCount}/{cl.items.length} checked
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => resetChecklist(cl.id)}
                          className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>

                      <div className="space-y-1">
                        {cl.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleChecklistItem(cl.id, item.id)}
                            className="w-full py-1.5 px-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
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
                            <span className={`text-xs md:text-sm ${item.completed ? 'line-through opacity-55' : ''}`}>
                              {item.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--nudge-glass-border)]">
                      <button
                        type="button"
                        onClick={() => onShareQR({ v: 1, type: 'checklist', data: cl })}
                        aria-label="Share checklist QR"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateChecklist(cl.id)}
                        aria-label="Duplicate checklist"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(cl)}
                        aria-label="Edit checklist"
                        className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveChecklist(cl.id, true)}
                        aria-label="Archive checklist"
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
        <div className="glass-panel rounded-3xl p-5 space-y-2">
          {checkedOffItems.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No checked off items right now.</p>
          ) : (
            checkedOffItems.map(({ checklist, item }) => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--nudge-muted)]">
                    {checklist.emoji} {checklist.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleChecklistItem(checklist.id, item.id)}
                  className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium"
                >
                  Undo
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'archived' && (
        <div className="glass-panel rounded-3xl p-5 space-y-2">
          {archivedList.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No archived checklists.</p>
          ) : (
            archivedList.map((cl) => (
              <div key={cl.id} className="flex items-center justify-between py-2 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                <span className="text-sm font-medium">
                  {cl.emoji} {cl.name}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => archiveChecklist(cl.id, false)}
                    className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteChecklistPermanently(cl.id)}
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
        <div className="glass-panel rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--nudge-muted)]">
            <History className="w-4 h-4" />
            <span>Checklist Completion History</span>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No checklist history recorded yet.</p>
          ) : (
            history.slice(0, 30).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                <span>{h.label}</span>
                <span className="font-mono-num text-[var(--nudge-muted)]">
                  {h.date === todayKey ? 'Today' : h.date}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <GlassSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit Checklist' : 'Create Checklist'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-2">
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
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
              placeholder="Checklist name..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>

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

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx] = { ...item, title: e.target.value };
                    setItems(copy);
                  }}
                  className="flex-1 min-h-[38px] px-3 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
                />
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  className="min-h-[34px] min-w-[30px] flex items-center justify-center text-[var(--nudge-muted)]"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  className="min-h-[34px] min-w-[30px] flex items-center justify-center text-[var(--nudge-muted)]"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                  className="min-h-[34px] min-w-[30px] flex items-center justify-center text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="Add item..."
                className="flex-1 min-h-[40px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="min-h-[40px] px-4 rounded-xl glass-panel text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="tactile-btn w-full min-h-[48px] rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
          >
            {editing ? 'Save Checklist' : 'Create Checklist'}
          </button>
        </form>
      </GlassSheet>
    </div>
  );
};
