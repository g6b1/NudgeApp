import { NudgeState, TinyGardenState, UserSettings } from '../types/nudge';
import { toLocalDateKey } from '../utils/dateUtils';
import { createInitialGardenState, reconcileGardenWithActions } from '../services/gardenEngine';

const STORAGE_KEY = 'nudge_app_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const DEFAULT_SETTINGS: UserSettings = {
  firstName: '',
  energyLevel: 'normal',
  themePreset: 'botanical',
  colorMode: 'light',
  accentColor: '#788D70',
  backgroundStyle: 'ambient',
  fontPreference: 'editorial',
  completionAnimations: true,
  soundEnabled: true,
  vibrationEnabled: true,
  countdownSeconds: 10,
  countdownAutoStart: false,
  focusBackground: 'calm',
  notificationsEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  notificationCategories: {
    routines: true,
    checklists: true,
    backpacks: true,
    tasks: true,
    selfCare: true,
    journal: false,
    summaries: true,
  },
  morningJournalReminder: '09:00',
  eveningJournalReminder: '21:00',
  eatingRemindersEnabled: false,
  aiConsentGranted: false,
  bareMinimumItems: [
    { id: 'bm-1', title: 'Drink something', emoji: '💧' },
    { id: 'bm-2', title: 'Eat something simple', emoji: '🍞' },
    { id: 'bm-3', title: 'Brush teeth', emoji: '🪥' },
    { id: 'bm-4', title: 'Wash face', emoji: '🫧' },
    { id: 'bm-5', title: 'Change into fresh clothes', emoji: '👕' },
    { id: 'bm-6', title: 'Get comfortable', emoji: '🛋️' },
    { id: 'bm-7', title: 'Complete one tiny task', emoji: '🌿' },
  ],
  getOutOfBedSteps: [
    { id: 'ob-1', title: 'Sit up gently against the pillows' },
    { id: 'ob-2', title: 'Put both feet on the floor' },
    { id: 'ob-3', title: 'Take a few sips of water' },
    { id: 'ob-4', title: 'Open the curtains or turn on a soft light' },
    { id: 'ob-5', title: 'Stand up and stretch for five seconds' },
  ],
  hygieneMode: 'minimum',
  lastActiveDate: undefined,
};

export function createInitialState(): NudgeState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tutorialCompleted: false,
    settings: { ...DEFAULT_SETTINGS },
    routines: [],
    checklists: [],
    backpacks: [],
    calendarItems: [],
    journalEntries: [],
    brainDumpEntries: [],
    goals: [],
    completionLog: [],
    notifications: [],
    weeklyReflections: {},
    garden: createInitialGardenState(),
  };
}

function migrateGardenState(rawGarden: unknown): TinyGardenState {
  const initial = createInitialGardenState();
  if (!rawGarden || typeof rawGarden !== 'object') {
    return initial;
  }
  const g = rawGarden as Partial<TinyGardenState>;
  const slots = Array.isArray(g.slots)
    ? Array.from({ length: 12 }, (_, idx) => g.slots?.[idx] ?? null)
    : initial.slots;

  return {
    ...initial,
    ...g,
    energy: typeof g.energy === 'number' && Number.isFinite(g.energy) ? Math.max(0, g.energy) : initial.energy,
    totalEnergyEarned:
      typeof g.totalEnergyEarned === 'number' && Number.isFinite(g.totalEnergyEarned)
        ? Math.max(0, g.totalEnergyEarned)
        : initial.totalEnergyEarned,
    unlockedSpecies:
      Array.isArray(g.unlockedSpecies) && g.unlockedSpecies.length > 0
        ? g.unlockedSpecies
        : initial.unlockedSpecies,
    unlockedDecorations: Array.isArray(g.unlockedDecorations)
      ? g.unlockedDecorations
      : initial.unlockedDecorations,
    unlockedBackgrounds:
      Array.isArray(g.unlockedBackgrounds) && g.unlockedBackgrounds.length > 0
        ? g.unlockedBackgrounds
        : initial.unlockedBackgrounds,
    slots,
    processedActionIds:
      g.processedActionIds && typeof g.processedActionIds === 'object' ? g.processedActionIds : {},
    claimedWeeklyRewards:
      g.claimedWeeklyRewards && typeof g.claimedWeeklyRewards === 'object'
        ? g.claimedWeeklyRewards
        : {},
    recentContributions: Array.isArray(g.recentContributions) ? g.recentContributions : [],
    unseenActionCount: typeof g.unseenActionCount === 'number' ? Math.max(0, g.unseenActionCount) : 0,
    unseenEnergyEarned: typeof g.unseenEnergyEarned === 'number' ? Math.max(0, g.unseenEnergyEarned) : 0,
    unseenLevelUps: Array.isArray(g.unseenLevelUps) ? g.unseenLevelUps : [],
    easterEggDiscovered: Boolean(g.easterEggDiscovered),
  };
}

export function migrateState(raw: unknown): NudgeState {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const obj = raw as Partial<NudgeState>;

  const mergedSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...(obj.settings || {}),
    notificationCategories: {
      ...DEFAULT_SETTINGS.notificationCategories,
      ...(obj.settings?.notificationCategories || {}),
    },
    bareMinimumItems:
      Array.isArray(obj.settings?.bareMinimumItems) && obj.settings.bareMinimumItems.length > 0
        ? obj.settings.bareMinimumItems
        : DEFAULT_SETTINGS.bareMinimumItems,
    getOutOfBedSteps:
      Array.isArray(obj.settings?.getOutOfBedSteps) && obj.settings.getOutOfBedSteps.length > 0
        ? obj.settings.getOutOfBedSteps
        : DEFAULT_SETTINGS.getOutOfBedSteps,
    countdownSeconds:
      typeof obj.settings?.countdownSeconds === 'number' && obj.settings.countdownSeconds >= 3
        ? Math.min(120, Math.round(obj.settings.countdownSeconds))
        : 10,
  };

  const completionLog = Array.isArray(obj.completionLog) ? obj.completionLog : [];
  const journalEntries = Array.isArray(obj.journalEntries) ? obj.journalEntries : [];
  const migratedGarden = reconcileGardenWithActions(
    migrateGardenState(obj.garden),
    completionLog,
    journalEntries,
    toLocalDateKey()
  );

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tutorialCompleted: Boolean(obj.tutorialCompleted),
    settings: mergedSettings,
    routines: Array.isArray(obj.routines) ? obj.routines : [],
    checklists: Array.isArray(obj.checklists) ? obj.checklists : [],
    backpacks: Array.isArray(obj.backpacks) ? obj.backpacks : [],
    calendarItems: Array.isArray(obj.calendarItems) ? obj.calendarItems : [],
    journalEntries,
    brainDumpEntries: Array.isArray(obj.brainDumpEntries) ? obj.brainDumpEntries : [],
    goals: Array.isArray(obj.goals) ? obj.goals : [],
    completionLog,
    notifications: Array.isArray(obj.notifications) ? obj.notifications : [],
    weeklyReflections:
      obj.weeklyReflections && typeof obj.weeklyReflections === 'object' ? obj.weeklyReflections : {},
    garden: migratedGarden,
  };
}

export function loadNudgeState(): { state: NudgeState; daysSinceLastActive: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createInitialState(), daysSinceLastActive: 0 };
    }
    const parsed = JSON.parse(raw);
    const state = migrateState(parsed);

    const today = toLocalDateKey();
    let daysSinceLastActive = 0;
    if (state.settings.lastActiveDate && state.settings.lastActiveDate < today) {
      const [y1, m1, d1] = state.settings.lastActiveDate.split('-').map(Number);
      const [y2, m2, d2] = today.split('-').map(Number);
      const t1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
      const t2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
      daysSinceLastActive = Math.max(0, Math.round((t2 - t1) / 86400000));
    }

    return { state, daysSinceLastActive };
  } catch {
    return { state: createInitialState(), daysSinceLastActive: 0 };
  }
}

export function saveNudgeState(state: NudgeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or disabled; ignore gracefully
  }
}

export function clearNudgeState(): NudgeState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return createInitialState();
}

export function exportNudgeBackup(state: NudgeState): string {
  return JSON.stringify(
    {
      app: 'Nudge',
      exportedAt: new Date().toISOString(),
      data: state,
    },
    null,
    2
  );
}

export function parseImportedBackup(rawText: string): NudgeState | null {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data) {
      return migrateState(parsed.data);
    }
    if (parsed && typeof parsed === 'object' && 'settings' in parsed) {
      return migrateState(parsed);
    }
    return null;
  } catch {
    return null;
  }
}
