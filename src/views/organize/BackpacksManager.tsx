import React, { useState } from 'react';
import {
  Archive,
  Check,
  Copy,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNudge } from '../../context/NudgeContext';
import { Backpack, BackpackItem } from '../../types/nudge';
import { CATEGORY_COLORS } from '../../styles/themes';
import { createId } from '../../storage/persistence';
import { GlassSheet } from '../../components/ui/GlassSheet';
import { SharePayload } from '../../components/QRShareImportModal';

interface BackpacksManagerProps {
  onShareQR: (payload: SharePayload) => void;
  onOpenAIBackpack: () => void;
}

const EMOJIS = ['🎒', '💼', '📚', '🏋️', '🧳', '🌙', '🧴', '🎨'];
const CATEGORIES = ['Work', 'School', 'Gym', 'Travel', 'Overnight', 'Everyday essentials'];

export const BackpacksManager: React.FC<BackpacksManagerProps> = ({
  onShareQR,
  onOpenAIBackpack,
}) => {
  const {
    state,
    addBackpack,
    updateBackpack,
    toggleBackpackItem,
    resetBackpackPacking,
    duplicateBackpack,
    archiveBackpack,
    deleteBackpackPermanently,
  } = useNudge();

  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Backpack | null>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎒');
  const [color, setColor] = useState(CATEGORY_COLORS[5]);
  const [category, setCategory] = useState('Work');
  const [items, setItems] = useState<BackpackItem[]>([]);

  const [newItemName, setNewItemName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newRequired, setNewRequired] = useState(true);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmoji('🎒');
    setColor(CATEGORY_COLORS[5]);
    setCategory('Work');
    setItems([]);
    setNewItemName('');
    setNewQty(1);
    setNewRequired(true);
    setEditorOpen(true);
  };

  const openEdit = (bp: Backpack) => {
    setEditing(bp);
    setName(bp.name);
    setEmoji(bp.emoji);
    setColor(bp.color);
    setCategory(bp.category);
    setItems(bp.items.map((i) => ({ ...i })));
    setNewItemName('');
    setNewQty(1);
    setNewRequired(true);
    setEditorOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: createId('bi'),
        name: newItemName.trim(),
        quantity: Math.max(1, Number(newQty) || 1),
        required: newRequired,
        packed: false,
      },
    ]);
    setNewItemName('');
    setNewQty(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateBackpack(editing.id, { name: name.trim(), emoji, color, category, items });
    } else {
      addBackpack({ name: name.trim(), emoji, color, category, items });
    }
    setEditorOpen(false);
  };

  const activeList = state.backpacks.filter((b) => !b.archived);
  const archivedList = state.backpacks.filter((b) => b.archived);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              tab === 'active'
                ? 'bg-[var(--nudge-accent)] text-white'
                : 'text-[var(--nudge-muted)]'
            }`}
          >
            Active ({activeList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              tab === 'archived'
                ? 'bg-[var(--nudge-accent)] text-white'
                : 'text-[var(--nudge-muted)]'
            }`}
          >
            Archived ({archivedList.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAIBackpack}
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
            New Backpack
          </button>
        </div>
      </div>

      {tab === 'active' ? (
        activeList.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
            <p className="text-sm font-medium text-[var(--nudge-ink)]">No backpacks yet</p>
            <p className="text-xs text-[var(--nudge-muted)]">
              Create reusable packing lists for work, school, gym, or travel, and link them to routines.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeList.map((bp) => {
              const packedCount = bp.items.filter((i) => i.packed).length;
              const missingRequired = bp.items.filter((i) => i.required && !i.packed).length;
              const allPacked = bp.items.length > 0 && packedCount === bp.items.length;

              return (
                <div key={bp.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{bp.emoji}</span>
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-medium truncate">{bp.name}</h3>
                          <p className="text-xs text-[var(--nudge-muted)]">
                            {bp.category} ·{' '}
                            <span className="font-mono-num">
                              {packedCount}/{bp.items.length} packed
                            </span>
                            {missingRequired > 0 && (
                              <span className="text-amber-700 dark:text-amber-300">
                                {' '}
                                · {missingRequired} required missing
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => resetBackpackPacking(bp.id)}
                        className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1 shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Unpack
                      </button>
                    </div>

                    {allPacked && (
                      <p className="text-xs font-medium" style={{ color: 'var(--nudge-accent)' }}>
                        All packed and ready to go.
                      </p>
                    )}

                    {bp.lastPackedAt && (
                      <p className="text-[11px] text-[var(--nudge-muted)]">
                        Last fully packed: {new Date(bp.lastPackedAt).toLocaleDateString()}
                      </p>
                    )}

                    <div className="space-y-1">
                      {bp.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleBackpackItem(bp.id, item.id)}
                          className="w-full py-1.5 px-2 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
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
                            <span className={`text-xs md:text-sm truncate ${item.packed ? 'line-through opacity-55' : ''}`}>
                              {item.name}
                              {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                            </span>
                          </div>
                          {item.required && !item.packed && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 shrink-0">
                              Required
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--nudge-glass-border)]">
                    <button
                      type="button"
                      onClick={() => onShareQR({ v: 1, type: 'backpack', data: bp })}
                      aria-label="Share backpack QR"
                      className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateBackpack(bp.id)}
                      aria-label="Duplicate backpack"
                      className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(bp)}
                      aria-label="Edit backpack"
                      className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveBackpack(bp.id, true)}
                      aria-label="Archive backpack"
                      className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="glass-panel rounded-3xl p-5 space-y-2">
          {archivedList.length === 0 ? (
            <p className="text-sm text-[var(--nudge-muted)]">No archived backpacks.</p>
          ) : (
            archivedList.map((bp) => (
              <div key={bp.id} className="flex items-center justify-between py-2 border-b border-[var(--nudge-glass-border)] last:border-b-0">
                <span className="text-sm font-medium">
                  {bp.emoji} {bp.name}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => archiveBackpack(bp.id, false)}
                    className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBackpackPermanently(bp.id)}
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

      <GlassSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? 'Edit Backpack' : 'Create Backpack'}
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
              placeholder="Backpack name (e.g., Work Bag)"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[40px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

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
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx] = { ...item, name: e.target.value };
                    setItems(copy);
                  }}
                  className="flex-1 min-h-[38px] px-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={item.quantity}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx] = { ...item, quantity: Math.max(1, Number(e.target.value) || 1) };
                    setItems(copy);
                  }}
                  className="w-14 min-h-[38px] px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                />
                <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) => {
                      const copy = [...items];
                      copy[idx] = { ...item, required: e.target.checked };
                      setItems(copy);
                    }}
                  />
                  Req
                </label>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                  className="min-h-[34px] min-w-[30px] flex items-center justify-center text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-1">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="Item name..."
                className="flex-1 min-w-[140px] min-h-[40px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
              />
              <input
                type="number"
                min={1}
                max={99}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value) || 1)}
                className="w-16 min-h-[40px] px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
              <label className="flex items-center gap-1.5 text-xs px-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                />
                Required
              </label>
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
            {editing ? 'Save Backpack' : 'Create Backpack'}
          </button>
        </form>
      </GlassSheet>
    </div>
  );
};
