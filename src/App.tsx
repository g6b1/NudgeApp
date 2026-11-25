import React, { useCallback, useRef, useState } from 'react';
import {
  BookHeart,
  Calendar,
  FolderKanban,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sprout,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { NudgeProvider, useNudge } from './context/NudgeContext';
import { MainNavTab, OrganizeSubTab, Routine } from './types/nudge';
import { SplashScreen } from './components/SplashScreen';
import { TutorialModal } from './components/TutorialModal';
import { TodayView } from './views/TodayView';
import { OrganizeView } from './views/OrganizeView';
import { CalendarView } from './views/CalendarView';
import { JournalView } from './views/JournalView';
import { ProgressView } from './views/ProgressView';
import { SettingsSheet } from './views/SettingsView';
import { CountdownFocusOverlay } from './components/CountdownFocusOverlay';
import { GuidedRoutineOverlay } from './components/GuidedRoutineOverlay';
import { GentleSupportSheet, GentleToolTab } from './components/GentleSupportSheet';
import { QRShareImportModal, SharePayload } from './components/QRShareImportModal';
import { GlobalSearchModal, QuickCaptureModal } from './components/SearchQuickCaptureModals';
import { NudgeAISheet } from './components/NudgeAISheet';
import { TinyGardenModal } from './components/garden/TinyGardenModal';

const PRIMARY_NAV: { id: MainNavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'organize', label: 'Organize', icon: FolderKanban },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'journal', label: 'Journal', icon: BookHeart },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

const NudgeShell: React.FC = () => {
  const { state, updateGardenPreferences } = useNudge();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<MainNavTab>('today');
  const [organizeSubTab, setOrganizeSubTab] = useState<OrganizeSubTab>('routines');

  // Overlays & Sheets
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tinyGardenOpen, setTinyGardenOpen] = useState(false);
  const [justDiscoveredGarden, setJustDiscoveredGarden] = useState(false);
  const [gardenUnlocking, setGardenUnlocking] = useState(false);
  const [logoHintCount, setLogoHintCount] = useState(0);
  const logoTapTimesRef = useRef<number[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCaptureState, setQuickCaptureState] = useState<{
    open: boolean;
    mode: 'task' | 'reminder' | 'brain-dump';
  }>({ open: false, mode: 'task' });

  const [countdownState, setCountdownState] = useState<{
    open: boolean;
    mode: 'countdown' | 'focus';
    taskTitle?: string;
  }>({ open: false, mode: 'countdown' });

  const [guidedState, setGuidedState] = useState<{
    open: boolean;
    routine: Routine | null;
    startMyDay: boolean;
  }>({ open: false, routine: null, startMyDay: false });

  const [gentleToolState, setGentleToolState] = useState<{
    open: boolean;
    tab: GentleToolTab;
    taskTitle?: string;
  }>({ open: false, tab: 'bare-minimum' });

  const [qrState, setQrState] = useState<{
    open: boolean;
    payload: SharePayload | null;
  }>({ open: false, payload: null });

  const [aiState, setAiState] = useState<{
    open: boolean;
    mode: 'chat' | 'routine' | 'checklist' | 'backpack' | 'breakdown' | 'brain-dump' | 'plan-day';
    prompt?: string;
  }>({ open: false, mode: 'chat' });

  const handleNavigate = useCallback((tab: MainNavTab, subTab?: OrganizeSubTab) => {
    setActiveTab(tab);
    if (subTab) setOrganizeSubTab(subTab);
  }, []);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  const handleLogoTap = useCallback(() => {
    setActiveTab('today');
    const now = Date.now();
    const recent = logoTapTimesRef.current.filter((t) => now - t < 2500);
    recent.push(now);
    logoTapTimesRef.current = recent;
    setLogoHintCount(recent.length);

    if (recent.length >= 5) {
      logoTapTimesRef.current = [];
      setLogoHintCount(0);
      const isFirstDiscovery = !state.garden.easterEggDiscovered;
      if (isFirstDiscovery) {
        updateGardenPreferences({ easterEggDiscovered: true });
        setJustDiscoveredGarden(true);
      } else {
        setJustDiscoveredGarden(false);
      }
      setGardenUnlocking(true);
      window.setTimeout(() => {
        setGardenUnlocking(false);
        setTinyGardenOpen(true);
      }, 360);
    }
  }, [state.garden.easterEggDiscovered, updateGardenPreferences]);

  const bgClass =
    state.settings.backgroundStyle === 'linen'
      ? 'bg-linen-pattern'
      : '';

  return (
    <div className={`min-h-dvh flex flex-col relative ${bgClass}`}>
      {/* Subtle Ambient Apple-Inspired Wash */}
      {state.settings.backgroundStyle === 'ambient' && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        >
          <div
            className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 dark:opacity-20"
            style={{ background: 'var(--nudge-accent)' }}
          />
          <div
            className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-3xl opacity-35 dark:opacity-15"
            style={{ background: 'var(--nudge-champagne)' }}
          />
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 glass-panel border-x-0 border-t-0 pt-safe">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand (5 quick taps opens Tiny Garden Easter egg) */}
          <button
            type="button"
            onClick={handleLogoTap}
            className="relative flex items-center gap-2 whitespace-nowrap shrink-0 text-left group"
          >
            <Sprout
              className={`w-5 h-5 transition-transform duration-200 ${
                gardenUnlocking
                  ? 'scale-150 rotate-6'
                  : logoHintCount >= 3
                  ? 'scale-125'
                  : ''
              }`}
              style={{ color: 'var(--nudge-accent)' }}
            />
            <span className="font-display text-lg md:text-xl font-medium tracking-tight text-[var(--nudge-ink)]">
              Nudge
            </span>
            {gardenUnlocking && (
              <span
                aria-hidden="true"
                className="ml-1 inline-flex items-center gap-1 text-[11px] font-medium animate-pulse"
                style={{ color: 'var(--nudge-accent)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Zone 2: Desktop Primary Nav */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            {PRIMARY_NAV.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'text-[var(--nudge-ink)] border-[var(--nudge-accent)]'
                      : 'text-[var(--nudge-muted)] border-transparent hover:text-[var(--nudge-ink)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Compact Utility & Nudge AI Entry */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search Nudge"
              className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setQuickCaptureState({ open: true, mode: 'task' })}
              aria-label="Quick capture"
              className="hidden sm:flex min-h-[40px] min-w-[40px] rounded-xl items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setAiState({ open: true, mode: 'chat' })}
              className="tactile-btn min-h-[38px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
              style={{ backgroundColor: 'var(--nudge-accent)', color: 'var(--nudge-accent-ink)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nudge AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pt-5 pb-28 md:pb-12">
        {activeTab === 'today' && (
          <TodayView
            onNavigate={handleNavigate}
            onStartMyDay={() =>
              setGuidedState({ open: true, routine: null, startMyDay: true })
            }
            onStartGuidedRoutine={(routine) =>
              setGuidedState({ open: true, routine, startMyDay: false })
            }
            onOpenCountdown={(mode, taskTitle) =>
              setCountdownState({ open: true, mode, taskTitle })
            }
            onOpenQuickCapture={(mode) => setQuickCaptureState({ open: true, mode })}
            onOpenNudgeAI={(mode = 'chat', prompt) =>
              setAiState({ open: true, mode, prompt })
            }
            onOpenGentleTool={(tab, taskTitle) =>
              setGentleToolState({ open: true, tab, taskTitle })
            }
          />
        )}

        {activeTab === 'organize' && (
          <OrganizeView
            subTab={organizeSubTab}
            onChangeSubTab={setOrganizeSubTab}
            onStartGuided={(routine) =>
              setGuidedState({ open: true, routine, startMyDay: false })
            }
            onOpenQR={(payload) => setQrState({ open: true, payload })}
            onOpenAI={(mode, prompt) => setAiState({ open: true, mode, prompt })}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            onOpenNudgePlanDay={() => setAiState({ open: true, mode: 'plan-day' })}
          />
        )}

        {activeTab === 'journal' && <JournalView />}

        {activeTab === 'progress' && (
          <ProgressView
            onOpenGarden={
              state.garden.easterEggDiscovered
                ? () => {
                    setJustDiscoveredGarden(false);
                    setTinyGardenOpen(true);
                  }
                : undefined
            }
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-panel-strong border-x-0 border-b-0 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{
                  color: active ? 'var(--nudge-accent)' : 'var(--nudge-muted)',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Overlays */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {!showSplash && <TutorialModal />}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenGarden={
          state.garden.easterEggDiscovered
            ? () => {
                setJustDiscoveredGarden(false);
                setTinyGardenOpen(true);
              }
            : undefined
        }
      />

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <QuickCaptureModal
        open={quickCaptureState.open}
        initialMode={quickCaptureState.mode}
        onClose={() => setQuickCaptureState((s) => ({ ...s, open: false }))}
      />

      <CountdownFocusOverlay
        open={countdownState.open}
        initialMode={countdownState.mode}
        taskTitle={countdownState.taskTitle}
        onClose={() => setCountdownState((s) => ({ ...s, open: false }))}
      />

      <GuidedRoutineOverlay
        open={guidedState.open}
        routine={guidedState.routine}
        startMyDayMode={guidedState.startMyDay}
        onClose={() => setGuidedState({ open: false, routine: null, startMyDay: false })}
        onSelectRoutine={(routine) =>
          setGuidedState({ open: true, routine, startMyDay: false })
        }
        onOpenBareMinimum={() =>
          setGentleToolState({ open: true, tab: 'bare-minimum' })
        }
      />

      <GentleSupportSheet
        open={gentleToolState.open}
        initialTab={gentleToolState.tab}
        initialTaskForEasier={gentleToolState.taskTitle}
        onClose={() => setGentleToolState((s) => ({ ...s, open: false }))}
        onOpenBrainDump={() => handleNavigate('organize', 'brain-dump')}
        onOpenCountdown={(taskTitle) =>
          setCountdownState({ open: true, mode: 'countdown', taskTitle })
        }
      />

      <QRShareImportModal
        open={qrState.open}
        shareTarget={qrState.payload}
        onClose={() => setQrState({ open: false, payload: null })}
      />

      <NudgeAISheet
        open={aiState.open}
        initialMode={aiState.mode}
        initialPrompt={aiState.prompt}
        onClose={() => setAiState((s) => ({ ...s, open: false }))}
      />

      <TinyGardenModal
        open={tinyGardenOpen}
        onClose={() => {
          setTinyGardenOpen(false);
          setJustDiscoveredGarden(false);
        }}
        justDiscovered={justDiscoveredGarden}
      />
    </div>
  );
};

export default function App() {
  return (
    <NudgeProvider>
      <NudgeShell />
    </NudgeProvider>
  );
}
