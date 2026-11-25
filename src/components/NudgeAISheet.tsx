import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Lock, Send, Sparkles, Wand2 } from 'lucide-react';
import { GlassSheet } from './ui/GlassSheet';
import { useNudge } from '../context/NudgeContext';
import {
  AIBackpackDraft,
  AIBrainDumpSuggestion,
  AIChecklistDraft,
  AIDailyPlanBlock,
  AIRoutineDraft,
  fetchAIStatus,
  generateAIBackpack,
  generateAIChecklist,
  generateAIRoutine,
  generateDailyPlanWithAI,
  generateTaskBreakdown,
  parseBrainDumpWithAI,
  sendAIChatMessage,
} from '../services/aiService';
import { createId } from '../storage/persistence';
import { addDaysToKey, getCalendarInstancesForDate } from '../utils/dateUtils';
import { CATEGORY_COLORS } from '../styles/themes';
import { buildLocalTaskBreakdown } from '../data/motivationalTips';

type AIMode = 'chat' | 'routine' | 'checklist' | 'backpack' | 'breakdown' | 'brain-dump' | 'plan-day';

interface NudgeAISheetProps {
  open: boolean;
  initialMode?: AIMode;
  initialPrompt?: string;
  onClose: () => void;
}

export const NudgeAISheet: React.FC<NudgeAISheetProps> = ({
  open,
  initialMode = 'chat',
  initialPrompt = '',
  onClose,
}) => {
  const {
    state,
    todayKey,
    updateSettings,
    addRoutine,
    addChecklist,
    addBackpack,
    addCalendarItem,
    addNotification,
    addGoal,
    addBrainDumpEntry,
  } = useNudge();

  const [mode, setMode] = useState<AIMode>(initialMode);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);

  // Generator prompts
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [routineDraft, setRoutineDraft] = useState<AIRoutineDraft | null>(null);
  const [checklistDraft, setChecklistDraft] = useState<AIChecklistDraft | null>(null);
  const [backpackDraft, setBackpackDraft] = useState<AIBackpackDraft | null>(null);
  const [breakdownResult, setBreakdownResult] = useState<{ encouragement: string; steps: string[] } | null>(null);
  const [brainDumpResult, setBrainDumpResult] = useState<{
    summary: string;
    suggestions: AIBrainDumpSuggestion[];
  } | null>(null);
  const [approvedDumpIdx, setApprovedDumpIdx] = useState<Record<number, boolean>>({});

  // Daily plan state
  const [planDate, setPlanDate] = useState(() => addDaysToKey(todayKey, 1));
  const [planPrefs, setPlanPrefs] = useState('Include generous breaks, meals, and unhurried free time.');
  const [planResult, setPlanResult] = useState<{ overview: string; blocks: AIDailyPlanBlock[] } | null>(null);
  const [approvedPlanIdx, setApprovedPlanIdx] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    if (initialPrompt) setPromptInput(initialPrompt);
    setErrorMsg('');
    setSavedNotice('');
    setPlanDate(addDaysToKey(todayKey, 1));
    fetchAIStatus()
      .then((res) => setAiConfigured(res.configured))
      .catch(() => setAiConfigured(false));
  }, [open, initialMode, initialPrompt, todayKey]);

  const requireConsentGate = () => {
    if (!state.settings.aiConsentGranted) {
      setErrorMsg('Please confirm AI sharing consent above before sending a prompt.');
      return false;
    }
    return true;
  };

  const handleChatSend = async (customText?: string) => {
    const text = (customText ?? chatInput).trim();
    if (!text || !requireConsentGate()) return;
    setErrorMsg('');
    setChatInput('');
    const nextHistory = [...chatHistory, { role: 'user' as const, text }];
    setChatHistory(nextHistory);
    setLoading(true);
    try {
      const contextSummary = `Energy level: ${state.settings.energyLevel}. Active routines count: ${
        state.routines.filter((r) => !r.archived).length
      }. (Journal entries are private and not included.)`;
      const res = await sendAIChatMessage({
        message: text,
        history: chatHistory,
        context: contextSummary,
      });
      setChatHistory([...nextHistory, { role: 'model', text: res.reply }]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach Nudge AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireConsentGate()) return;
    setErrorMsg('');
    setSavedNotice('');
    setLoading(true);
    try {
      if (mode === 'routine') {
        const draft = await generateAIRoutine(promptInput, state.settings.energyLevel);
        setRoutineDraft(draft);
      } else if (mode === 'checklist') {
        const draft = await generateAIChecklist(promptInput);
        setChecklistDraft(draft);
      } else if (mode === 'backpack') {
        const draft = await generateAIBackpack(promptInput);
        setBackpackDraft(draft);
      } else if (mode === 'breakdown') {
        const res = await generateTaskBreakdown(promptInput, state.settings.energyLevel);
        setBreakdownResult(res);
      } else if (mode === 'brain-dump') {
        const res = await parseBrainDumpWithAI(promptInput, todayKey);
        setBrainDumpResult(res);
        setApprovedDumpIdx({});
      } else if (mode === 'plan-day') {
        const existing = getCalendarInstancesForDate(state.calendarItems, planDate).map((i) => ({
          title: i.title,
          startTime: i.startTime,
          endTime: i.endTime,
        }));
        const res = await generateDailyPlanWithAI({
          targetDate: planDate,
          energyLevel: state.settings.energyLevel,
          preferences: planPrefs,
          existingEvents: existing,
        });
        setPlanResult(res);
        setApprovedPlanIdx({});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nudge AI request failed.';
      setErrorMsg(msg);
      if (mode === 'breakdown' && promptInput.trim()) {
        setBreakdownResult({
          encouragement: 'AI is currently unavailable, so here is a gentle local breakdown:',
          steps: buildLocalTaskBreakdown(promptInput),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const approveSuggestion = (s: AIBrainDumpSuggestion, idx: number) => {
    if (s.kind === 'appointment' || s.kind === 'task') {
      addCalendarItem({
        title: s.title,
        type: s.kind === 'appointment' ? 'event' : 'task',
        date: s.suggestedDate && /^\d{4}-\d{2}-\d{2}$/.test(s.suggestedDate) ? s.suggestedDate : todayKey,
        startTime: s.suggestedTime && /^\d{2}:\d{2}$/.test(s.suggestedTime) ? s.suggestedTime : undefined,
        description: s.notes,
        color: CATEGORY_COLORS[0],
        recurrence: { frequency: 'none' },
      });
    } else if (s.kind === 'reminder') {
      addNotification({
        title: s.title,
        body: s.notes || 'Reminder from Brain Dump',
        category: 'tasks',
        scheduledFor: `${s.suggestedDate || todayKey} ${s.suggestedTime || '09:00'}`,
        status: 'pending',
      });
    } else if (s.kind === 'goal') {
      addGoal({
        title: s.title,
        emoji: '🌱',
        description: s.notes,
        linkedRoutineIds: [],
        linkedTaskIds: [],
      });
    } else if (s.kind === 'shopping') {
      addChecklist({
        name: 'Shopping List',
        emoji: '🛒',
        color: CATEGORY_COLORS[2],
        items: [{ id: createId('ci'), title: s.title, completed: false }],
      });
    } else {
      addBrainDumpEntry(s.title, s.kind === 'idea' ? 'idea' : 'thought');
    }
    setApprovedDumpIdx((p) => ({ ...p, [idx]: true }));
  };

  const modeTabs: { id: AIMode; label: string }[] = [
    { id: 'chat', label: 'Assistant' },
    { id: 'routine', label: 'Routine' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'backpack', label: 'Backpack' },
    { id: 'breakdown', label: 'Make Easier' },
    { id: 'brain-dump', label: 'Sort Brain Dump' },
    { id: 'plan-day', label: 'Plan Day' },
  ];

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Nudge AI"
      subtitle="Warm, practical planning support—always optional and under your control"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Privacy & Consent Banner */}
        <div className="p-3.5 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-[var(--nudge-muted)]">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--nudge-accent)' }} />
            <div>
              <p className="font-medium text-[var(--nudge-ink)]">External AI Disclosure</p>
              <p className="mt-0.5 leading-snug">
                Prompts you submit here are sent to Google Gemini on our server. Private journal entries are never sent automatically.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--nudge-ink)] shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.aiConsentGranted}
              onChange={(e) => updateSettings({ aiConsentGranted: e.target.checked })}
              className="rounded"
            />
            Allow AI requests
          </label>
        </div>

        {aiConfigured === false && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-[var(--nudge-ink)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Nudge AI is currently unconfigured (no Gemini API key set on the server). All routines, checklists, calendar, journal, and gentle tools continue to work locally without AI.
            </span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {modeTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMode(t.id);
                setErrorMsg('');
                setSavedNotice('');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                mode === t.id
                  ? 'bg-[var(--nudge-accent)] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {savedNotice && (
          <div className="p-3 rounded-2xl bg-[var(--nudge-accent-soft)] text-xs text-[var(--nudge-ink)] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
            <span>{savedNotice}</span>
          </div>
        )}

        {mode === 'chat' ? (
          <div className="space-y-3">
            {chatHistory.length === 0 && (
              <div className="space-y-2 py-2">
                <p className="text-xs text-[var(--nudge-muted)]">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Help me organize my mornings.',
                    'I have too much to do today.',
                    'What should I prioritize with low energy?',
                    'Help me build a realistic weekly schedule.',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleChatSend(q)}
                      className="px-3 py-2 rounded-xl glass-panel text-xs text-left text-[var(--nudge-ink)] hover:opacity-80"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'ml-8 bg-[var(--nudge-accent-soft)] text-[var(--nudge-ink)]'
                      : 'mr-4 glass-panel text-[var(--nudge-ink)]'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="p-3 rounded-2xl glass-panel text-xs text-[var(--nudge-muted)]">
                  Nudge AI is thinking gently...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChatSend();
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about routines, prioritizing, or gentle planning..."
                className="flex-1 min-h-[46px] px-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="tactile-btn min-h-[46px] px-4 rounded-2xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleGenerate} className="space-y-3">
              {mode === 'plan-day' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--nudge-muted)] mb-1">Target date</label>
                    <input
                      type="date"
                      value={planDate}
                      onChange={(e) => setPlanDate(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--nudge-muted)] mb-1">Preferences</label>
                    <input
                      type="text"
                      value={planPrefs}
                      onChange={(e) => setPlanPrefs(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">
                    {mode === 'routine' && 'Describe the routine (e.g., "Make a calm morning routine to wake up earlier")'}
                    {mode === 'checklist' && 'Describe the checklist (e.g., "Weekly cleaning checklist")'}
                    {mode === 'backpack' && 'Describe what you are packing for (e.g., "8-hour work shift")'}
                    {mode === 'breakdown' && 'Which task feels overwhelming right now?'}
                    {mode === 'brain-dump' && 'Paste unstructured thoughts to extract tasks, reminders, or goals:'}
                  </label>
                  <textarea
                    rows={mode === 'brain-dump' ? 4 : 2}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Type naturally..."
                    className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm focus:outline-none focus:border-[var(--nudge-accent)]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="tactile-btn min-h-[46px] px-5 rounded-2xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Working...' : mode === 'plan-day' ? 'Propose Schedule' : 'Generate Draft'}
              </button>
            </form>

            {/* Editable & Approvable Drafts */}
            {mode === 'routine' && routineDraft && (
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={routineDraft.name}
                    onChange={(e) => setRoutineDraft({ ...routineDraft, name: e.target.value })}
                    className="font-display text-lg font-medium bg-transparent border-b border-[var(--nudge-glass-border)] focus:outline-none flex-1"
                  />
                  <span className="text-xl">{routineDraft.emoji}</span>
                </div>
                <p className="text-xs text-[var(--nudge-muted)]">{routineDraft.description}</p>
                <div className="space-y-1.5">
                  {routineDraft.activities.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type="text"
                        value={a.title}
                        onChange={(e) => {
                          const next = [...routineDraft.activities];
                          next[idx] = { ...a, title: e.target.value };
                          setRoutineDraft({ ...routineDraft, activities: next });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs"
                      />
                      <span className="font-mono-num text-xs text-[var(--nudge-muted)] shrink-0">
                        {a.durationMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addRoutine({
                      name: routineDraft.name,
                      emoji: routineDraft.emoji || '🌿',
                      color: CATEGORY_COLORS[0],
                      description: routineDraft.description,
                      activeVersion: 'normal',
                      versions: {
                        normal: {
                          activities: routineDraft.activities.map((a) => ({
                            ...a,
                            id: createId('act'),
                          })),
                        },
                        'low-energy': {
                          activities: routineDraft.lowEnergyActivities.map((a) => ({
                            ...a,
                            id: createId('act'),
                          })),
                        },
                      },
                    });
                    setSavedNotice(`Saved "${routineDraft.name}" (with Low Energy version) to Routines.`);
                    setRoutineDraft(null);
                  }}
                  className="tactile-btn w-full min-h-[44px] rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                >
                  Approve & Save Routine
                </button>
              </div>
            )}

            {mode === 'checklist' && checklistDraft && (
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={checklistDraft.name}
                  onChange={(e) => setChecklistDraft({ ...checklistDraft, name: e.target.value })}
                  className="font-display text-lg font-medium bg-transparent border-b border-[var(--nudge-glass-border)] w-full focus:outline-none"
                />
                <div className="space-y-1.5">
                  {checklistDraft.items.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...checklistDraft.items];
                        next[idx] = e.target.value;
                        setChecklistDraft({ ...checklistDraft, items: next });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addChecklist({
                      name: checklistDraft.name,
                      emoji: checklistDraft.emoji || '📝',
                      color: CATEGORY_COLORS[1],
                      description: checklistDraft.description,
                      items: checklistDraft.items.map((t) => ({
                        id: createId('ci'),
                        title: t,
                        completed: false,
                      })),
                    });
                    setSavedNotice(`Saved "${checklistDraft.name}" to Checklists.`);
                    setChecklistDraft(null);
                  }}
                  className="tactile-btn w-full min-h-[44px] rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                >
                  Approve & Save Checklist
                </button>
              </div>
            )}

            {mode === 'backpack' && backpackDraft && (
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={backpackDraft.name}
                  onChange={(e) => setBackpackDraft({ ...backpackDraft, name: e.target.value })}
                  className="font-display text-lg font-medium bg-transparent border-b border-[var(--nudge-glass-border)] w-full focus:outline-none"
                />
                <div className="space-y-1.5">
                  {backpackDraft.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/5 dark:bg-white/5">
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
                  onClick={() => {
                    addBackpack({
                      name: backpackDraft.name,
                      emoji: backpackDraft.emoji || '🎒',
                      color: CATEGORY_COLORS[5],
                      category: backpackDraft.category || 'Everyday',
                      items: backpackDraft.items.map((i) => ({
                        id: createId('bi'),
                        name: i.name,
                        quantity: i.quantity || 1,
                        required: Boolean(i.required),
                        packed: false,
                      })),
                    });
                    setSavedNotice(`Saved "${backpackDraft.name}" to Backpacks.`);
                    setBackpackDraft(null);
                  }}
                  className="tactile-btn w-full min-h-[44px] rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
                >
                  Approve & Save Backpack
                </button>
              </div>
            )}

            {mode === 'breakdown' && breakdownResult && (
              <div className="glass-panel rounded-2xl p-4 space-y-2.5">
                <p className="text-xs text-[var(--nudge-muted)]">{breakdownResult.encouragement}</p>
                {breakdownResult.steps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm py-1">
                    <Wand2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--nudge-accent)' }} />
                    <span>
                      {idx + 1}. {s}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {mode === 'brain-dump' && brainDumpResult && (
              <div className="space-y-2.5">
                <p className="text-xs text-[var(--nudge-muted)]">{brainDumpResult.summary}</p>
                {brainDumpResult.suggestions.map((s, idx) => {
                  const approved = Boolean(approvedDumpIdx[idx]);
                  return (
                    <div
                      key={idx}
                      className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--nudge-ink)]">{s.title}</p>
                        <p className="text-xs text-[var(--nudge-muted)] capitalize">
                          Suggested as {s.kind}
                          {s.suggestedDate ? ` · ${s.suggestedDate}` : ''}
                          {s.suggestedTime ? ` ${s.suggestedTime}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={approved}
                        onClick={() => approveSuggestion(s, idx)}
                        className="min-h-[38px] px-3.5 rounded-xl text-xs font-medium shrink-0 disabled:opacity-50"
                        style={{
                          backgroundColor: approved ? 'var(--nudge-accent-soft)' : 'var(--nudge-accent)',
                          color: approved ? 'var(--nudge-accent)' : 'var(--nudge-accent-ink)',
                        }}
                      >
                        {approved ? 'Added' : 'Approve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {mode === 'plan-day' && planResult && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--nudge-muted)]">{planResult.overview}</p>
                {planResult.blocks.map((b, idx) => {
                  const approved = Boolean(approvedPlanIdx[idx]);
                  return (
                    <div key={idx} className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono-num text-xs text-[var(--nudge-muted)]">
                          {b.startTime} – {b.endTime}
                        </p>
                        <p className="text-sm font-medium text-[var(--nudge-ink)]">{b.title}</p>
                        {b.description && (
                          <p className="text-xs text-[var(--nudge-muted)]">{b.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={approved}
                        onClick={() => {
                          addCalendarItem({
                            title: b.title,
                            type: b.type,
                            date: planDate,
                            startTime: b.startTime,
                            endTime: b.endTime,
                            description: b.description,
                            color: CATEGORY_COLORS[3],
                            recurrence: { frequency: 'none' },
                          });
                          setApprovedPlanIdx((p) => ({ ...p, [idx]: true }));
                        }}
                        className="min-h-[38px] px-3.5 rounded-xl text-xs font-medium shrink-0 disabled:opacity-50"
                        style={{
                          backgroundColor: approved ? 'var(--nudge-accent-soft)' : 'var(--nudge-accent)',
                          color: approved ? 'var(--nudge-accent)' : 'var(--nudge-accent-ink)',
                        }}
                      >
                        {approved ? 'Scheduled' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassSheet>
  );
};
