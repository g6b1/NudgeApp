import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Download,
  Lock,
  Palette,
  RotateCcw,
  Sprout,
  Timer,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { GlassSheet } from '../components/ui/GlassSheet';
import { useNudge } from '../context/NudgeContext';
import { ACCENT_SWATCHES, THEME_PRESETS } from '../styles/themes';
import { BackgroundStyle, ColorMode, FontPreference, ThemePresetId } from '../types/nudge';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenGarden?: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({ open, onClose, onOpenGarden }) => {
  const {
    state,
    updateSettings,
    replayTutorial,
    exportBackupJson,
    importBackupJson,
    clearAllData,
  } = useNudge();

  const [confirmClear, setConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [notifPermissionNote, setNotifPermissionNote] = useState('');

  const handleRequestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermissionNote(
        'Browser system notifications are not supported in this embedded preview or device browser. In-app reminders on Today still work.'
      );
      updateSettings({ notificationsEnabled: false });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        updateSettings({ notificationsEnabled: true });
        setNotifPermissionNote('Browser notification permission granted.');
      } else {
        updateSettings({ notificationsEnabled: false });
        setNotifPermissionNote(
          'Browser notifications were blocked or dismissed. In-app reminders remain active on Today without nagging.'
        );
      }
    } catch {
      setNotifPermissionNote(
        'Embedded preview frames may restrict system notifications. In-app reminders on Today continue to work.'
      );
    }
  };

  const handleExport = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nudge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup exported cleanly.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importBackupJson(String(reader.result || ''));
      setStatusMessage(
        ok ? 'Backup restored successfully.' : 'That file is not a valid Nudge JSON backup.'
      );
    };
    reader.readAsText(file);
  };

  return (
    <GlassSheet
      open={open}
      onClose={onClose}
      title="Settings & Personalization"
      subtitle="Customize Nudge to match your energy, taste, and privacy preferences"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-7">
        {/* Profile / Greeting */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-muted)]">
            <User className="w-4 h-4" />
            <span>Personal Greeting</span>
          </div>
          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-1">
              First name (used in Today greetings)
            </label>
            <input
              type="text"
              value={state.settings.firstName}
              onChange={(e) => updateSettings({ firstName: e.target.value })}
              placeholder="Friend"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-sm"
            />
          </div>
        </section>

        {/* Themes & Appearance */}
        <section className="space-y-4 pt-4 border-t border-[var(--nudge-glass-border)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-muted)]">
            <Palette className="w-4 h-4" />
            <span>Themes & Appearance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Color Mode</label>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {(['light', 'dark', 'system'] as ColorMode[]).map((cm) => (
                  <button
                    key={cm}
                    type="button"
                    onClick={() => updateSettings({ colorMode: cm })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize ${
                      state.settings.colorMode === cm
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {cm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Background</label>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {(['ambient', 'minimal', 'linen'] as BackgroundStyle[]).map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => updateSettings({ backgroundStyle: bg })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize ${
                      state.settings.backgroundStyle === bg
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Typography</label>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {(['editorial', 'sans', 'serif'] as FontPreference[]).map((fp) => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => updateSettings({ fontPreference: fp })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize ${
                      state.settings.fontPreference === fp
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--nudge-muted)] mb-2">Visual Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => {
                const preset = THEME_PRESETS[id];
                const active = state.settings.themePreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        themePreset: id,
                        accentColor: preset.defaultAccent,
                      })
                    }
                    className={`p-2.5 rounded-2xl text-left border transition-colors ${
                      active
                        ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)]'
                        : 'border-[var(--nudge-glass-border)] glass-panel'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[var(--nudge-ink)]">{preset.name}</p>
                    <p className="text-[11px] text-[var(--nudge-muted)] truncate">{preset.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Accent Color</label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => updateSettings({ accentColor: sw.value })}
                    title={sw.label}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      state.settings.accentColor === sw.value
                        ? 'scale-110 ring-2 ring-offset-2 ring-[var(--nudge-ink)]'
                        : ''
                    }`}
                    style={{ backgroundColor: sw.value }}
                  />
                ))}
                <input
                  type="color"
                  value={state.settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  aria-label="Custom accent color"
                  className="w-8 h-8 rounded-full cursor-pointer bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--nudge-muted)] mb-1.5">Focus Backdrop</label>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {(['calm', 'botanical', 'deep'] as const).map((fb) => (
                  <button
                    key={fb}
                    type="button"
                    onClick={() => updateSettings({ focusBackground: fb })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                      state.settings.focusBackground === fb
                        ? 'bg-[var(--nudge-accent)] text-white'
                        : 'text-[var(--nudge-muted)]'
                    }`}
                  >
                    {fb}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-2xl glass-panel text-xs cursor-pointer">
              <span>Completion animations</span>
              <input
                type="checkbox"
                checked={state.settings.completionAnimations}
                onChange={(e) => updateSettings({ completionAnimations: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-2xl glass-panel text-xs cursor-pointer">
              <span>Gentle sound chimes</span>
              <input
                type="checkbox"
                checked={state.settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-2xl glass-panel text-xs cursor-pointer">
              <span>Haptic vibration</span>
              <input
                type="checkbox"
                checked={state.settings.vibrationEnabled}
                onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
              />
            </label>
          </div>
        </section>

        {/* Timer & Countdown */}
        <section className="space-y-3 pt-4 border-t border-[var(--nudge-glass-border)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-muted)]">
            <Timer className="w-4 h-4" />
            <span>Start Countdown (Default 10s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="p-3.5 rounded-2xl glass-panel space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Countdown duration</span>
                <span className="font-mono-num font-semibold">
                  {state.settings.countdownSeconds} seconds
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={60}
                value={state.settings.countdownSeconds}
                onChange={(e) => updateSettings({ countdownSeconds: Number(e.target.value) })}
                className="w-full accent-[var(--nudge-accent)]"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-2xl glass-panel text-xs cursor-pointer">
              <span>Auto-start countdown on open</span>
              <input
                type="checkbox"
                checked={state.settings.countdownAutoStart}
                onChange={(e) => updateSettings({ countdownAutoStart: e.target.checked })}
              />
            </label>
          </div>
        </section>

        {/* Reminders & Quiet Hours */}
        <section className="space-y-3 pt-4 border-t border-[var(--nudge-glass-border)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-muted)]">
            <Bell className="w-4 h-4" />
            <span>Reminders & Quiet Hours</span>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--nudge-muted)]">
              <p className="font-medium text-[var(--nudge-ink)]">Browser Notifications</p>
              <p className="mt-0.5">
                Optional alerts when browser permissions allow. In-app reminders always remain respectful.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestBrowserNotifications}
              className="min-h-[38px] px-4 rounded-xl glass-panel text-xs font-medium shrink-0"
            >
              {state.settings.notificationsEnabled ? 'Enabled' : 'Enable Browser Alerts'}
            </button>
          </div>

          {notifPermissionNote && (
            <p className="text-xs text-[var(--nudge-muted)]">{notifPermissionNote}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] text-[var(--nudge-muted)] mb-1">Quiet starts</label>
              <input
                type="time"
                value={state.settings.quietHoursStart}
                onChange={(e) => updateSettings({ quietHoursStart: e.target.value })}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--nudge-muted)] mb-1">Quiet ends</label>
              <input
                type="time"
                value={state.settings.quietHoursEnd}
                onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--nudge-muted)] mb-1">Morning journal</label>
              <input
                type="time"
                value={state.settings.morningJournalReminder || ''}
                onChange={(e) => updateSettings({ morningJournalReminder: e.target.value })}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--nudge-muted)] mb-1">Evening journal</label>
              <input
                type="time"
                value={state.settings.eveningJournalReminder || ''}
                onChange={(e) => updateSettings({ eveningJournalReminder: e.target.value })}
                className="w-full min-h-[40px] px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--nudge-glass-border)] text-xs font-mono-num"
              />
            </div>
          </div>
        </section>

        {/* Privacy, Backup & Tutorial */}
        <section className="space-y-3 pt-4 border-t border-[var(--nudge-glass-border)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-muted)]">
            <Lock className="w-4 h-4" />
            <span>Local-First Privacy & Backup</span>
          </div>

          <p className="text-xs text-[var(--nudge-muted)] leading-relaxed">
            Nudge stores all routines, checklists, backpacks, calendar data, journal entries, and progress locally in your browser with zero tracking or mandatory accounts. Optional Nudge AI features only send the prompt you approve to Google Gemini.
          </p>

          <label className="flex items-center justify-between p-3 rounded-2xl glass-panel text-xs cursor-pointer">
            <span>Allow optional Nudge AI requests</span>
            <input
              type="checkbox"
              checked={state.settings.aiConsentGranted}
              onChange={(e) => updateSettings({ aiConsentGranted: e.target.checked })}
            />
          </label>

          {statusMessage && (
            <p className="text-xs font-medium" style={{ color: 'var(--nudge-accent)' }}>
              {statusMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Backup
            </button>

            <label className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Backup
              <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
            </label>

            {onOpenGarden && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGarden();
                }}
                className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2"
              >
                <Sprout className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
                Open Tiny Garden
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                replayTutorial();
                onClose();
              }}
              className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Replay Tutorial
            </button>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[42px] px-4 rounded-xl glass-panel text-xs font-medium text-rose-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Local Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setConfirmClear(false);
                    setStatusMessage('All local Nudge data was cleared.');
                  }}
                  className="min-h-[42px] px-4 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[42px] px-3 rounded-xl glass-panel text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </GlassSheet>
  );
};
