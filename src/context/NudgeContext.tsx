import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Backpack,
  BackpackItem,
  BrainDumpEntry,
  CalendarItem,
  CalendarOccurrenceOverride,
  Checklist,
  CompletionRecord,
  DecorationTypeId,
  EnergyLevel,
  GardenBackgroundId,
  JournalEntry,
  NotificationItem,
  NudgeState,
  PersonalGoal,
  PlantSpeciesId,
  PlantedSlotItem,
  PositiveActionSource,
  PotStyleId,
  Routine,
  RoutineActivity,
  RoutineVersionType,
  TinyGardenState,
  UserSettings,
} from '../types/nudge';
import {
  clearNudgeState,
  createId,
  exportNudgeBackup,
  loadNudgeState,
  parseImportedBackup,
  saveNudgeState,
} from '../storage/persistence';
import { getLocalWeekDates, toLocalDateKey } from '../utils/dateUtils';
import { applyThemeVariables } from '../styles/themes';
import { playGentleChime, triggerGentleVibration } from '../services/feedbackService';
import {
  GARDEN_BACKGROUNDS,
  GARDEN_DECORATIONS,
  MAX_PLANT_XP,
  PLANT_SPECIES,
  WEEKLY_GARDEN_REWARDS,
} from '../data/gardenCatalog';
import { reconcileGardenWithActions } from '../services/gardenEngine';

interface NudgeContextValue {
  state: NudgeState;
  todayKey: string;
  daysSinceLastActive: number;
  dismissWelcomeBack: () => void;

  // Tutorial
  completeTutorial: () => void;
  replayTutorial: () => void;

  // Settings & Energy
  updateSettings: (patch: Partial<UserSettings>) => void;
  setEnergyLevel: (level: EnergyLevel) => void;

  // Positive Actions helper
  isActionCompletedToday: (sourceType: PositiveActionSource, sourceId: string, itemId: string, dateKey?: string) => boolean;
  togglePositiveAction: (params: {
    sourceType: PositiveActionSource;
    sourceId: string;
    itemId: string;
    label: string;
    category: string;
    dateKey?: string;
  }) => boolean;
  recordPositiveActionOnce: (params: {
    sourceType: PositiveActionSource;
    sourceId: string;
    itemId: string;
    label: string;
    category: string;
  }) => void;
  removeCompletionRecord: (recordId: string) => void;

  // Routines
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Routine;
  updateRoutine: (id: string, patch: Partial<Routine>) => void;
  duplicateRoutine: (id: string) => Routine | null;
  archiveRoutine: (id: string, archived: boolean) => void;
  deleteRoutinePermanently: (id: string) => void;
  setRoutineActivities: (id: string, version: RoutineVersionType, activities: RoutineActivity[]) => void;

  // Checklists
  addChecklist: (checklist: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'resetCount'>) => Checklist;
  updateChecklist: (id: string, patch: Partial<Checklist>) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;
  resetChecklist: (id: string) => void;
  duplicateChecklist: (id: string) => Checklist | null;
  archiveChecklist: (id: string, archived: boolean) => void;
  deleteChecklistPermanently: (id: string) => void;

  // Backpacks
  addBackpack: (backpack: Omit<Backpack, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Backpack;
  updateBackpack: (id: string, patch: Partial<Backpack>) => void;
  toggleBackpackItem: (backpackId: string, itemId: string) => void;
  resetBackpackPacking: (id: string) => void;
  duplicateBackpack: (id: string) => Backpack | null;
  archiveBackpack: (id: string, archived: boolean) => void;
  deleteBackpackPermanently: (id: string) => void;

  // Calendar
  addCalendarItem: (item: Omit<CalendarItem, 'id' | 'createdAt' | 'completedDates'>) => CalendarItem;
  updateCalendarItem: (id: string, patch: Partial<CalendarItem>) => void;
  overrideCalendarOccurrence: (id: string, dateKey: string, override: CalendarOccurrenceOverride) => void;
  toggleCalendarCompletion: (id: string, dateKey: string) => void;
  deleteCalendarItem: (id: string) => void;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => JournalEntry;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Brain Dump
  addBrainDumpEntry: (text: string, category?: BrainDumpEntry['category']) => BrainDumpEntry;
  updateBrainDumpEntry: (id: string, patch: Partial<BrainDumpEntry>) => void;
  deleteBrainDumpEntry: (id: string) => void;

  // Personal Goals & Weekly Reset
  addGoal: (goal: Omit<PersonalGoal, 'id' | 'createdAt'>) => PersonalGoal;
  updateGoal: (id: string, patch: Partial<PersonalGoal>) => void;
  deleteGoal: (id: string) => void;
  saveWeeklyReflection: (weekKey: string, reflection: string, intention: string) => void;

  // Notifications
  addNotification: (notif: Omit<NotificationItem, 'id'>) => void;
  updateNotificationStatus: (id: string, status: NotificationItem['status'], snoozedUntil?: string) => void;

  // Data portability & QR import
  exportBackupJson: () => string;
  importBackupJson: (raw: string) => boolean;
  clearAllData: () => void;

  // Tiny Garden
  markGardenVisited: () => void;
  unlockGardenSpecies: (speciesId: PlantSpeciesId) => boolean;
  plantSeedInSlot: (slotIndex: number, speciesId: PlantSpeciesId, potStyle?: PotStyleId) => boolean;
  unlockGardenDecoration: (decorationId: DecorationTypeId) => boolean;
  placeDecorationInSlot: (slotIndex: number, decorationId: DecorationTypeId) => boolean;
  unlockGardenBackground: (bgId: GardenBackgroundId) => boolean;
  moveGardenSlot: (fromIndex: number, toIndex: number) => void;
  clearGardenSlot: (slotIndex: number) => void;
  waterPlantSlot: (slotIndex: number) => boolean;
  nurturePlantWithEnergy: (slotIndex: number) => boolean;
  changePotStyle: (slotIndex: number, potStyle: PotStyleId) => void;
  updateGardenPreferences: (
    patch: Partial<
      Pick<
        TinyGardenState,
        'activeBackground' | 'seasonOverride' | 'companionVisible' | 'companionName' | 'easterEggDiscovered'
      >
    >
  ) => void;
  claimWeeklyGardenReward: (weekKey: string, rewardId: string) => boolean;
}

const NudgeContext = createContext<NudgeContextValue | null>(null);

export const NudgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLoad = useMemo(() => loadNudgeState(), []);
  const [state, setState] = useState<NudgeState>(initialLoad.state);
  const [daysSinceLastActive, setDaysSinceLastActive] = useState<number>(initialLoad.daysSinceLastActive);
  const [todayKey, setTodayKey] = useState<string>(() => toLocalDateKey());

  // Keep todayKey accurate if midnight passes while app stays open
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nowKey = toLocalDateKey();
      setTodayKey((prev) => (prev !== nowKey ? nowKey : prev));
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Stamp lastActiveDate gently on mount / date change
  useEffect(() => {
    setState((prev) => {
      if (prev.settings.lastActiveDate === todayKey) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          lastActiveDate: todayKey,
        },
      };
    });
  }, [todayKey]);

  // Persist to localStorage
  useEffect(() => {
    saveNudgeState(state);
  }, [state]);

  // Automatic background reconciliation of Tiny Garden with real Positive Actions & Journal dates
  useEffect(() => {
    setState((prev) => {
      const reconciled = reconcileGardenWithActions(
        prev.garden,
        prev.completionLog,
        prev.journalEntries,
        todayKey
      );
      if (reconciled === prev.garden) return prev;
      return { ...prev, garden: reconciled };
    });
  }, [state.completionLog, state.journalEntries, todayKey]);

  // Apply theme CSS variables & dark class
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const resolveAndApply = () => {
      const isDark =
        state.settings.colorMode === 'dark' ||
        (state.settings.colorMode === 'system' && media.matches);
      applyThemeVariables(
        state.settings.themePreset,
        isDark,
        state.settings.accentColor,
        state.settings.fontPreference
      );
      document.documentElement.classList.toggle('no-animations', !state.settings.completionAnimations);
    };
    resolveAndApply();
    media.addEventListener('change', resolveAndApply);
    return () => media.removeEventListener('change', resolveAndApply);
  }, [
    state.settings.themePreset,
    state.settings.colorMode,
    state.settings.accentColor,
    state.settings.fontPreference,
    state.settings.completionAnimations,
  ]);

  const triggerFeedback = useCallback(() => {
    playGentleChime(state.settings.soundEnabled);
    triggerGentleVibration(state.settings.vibrationEnabled);
  }, [state.settings.soundEnabled, state.settings.vibrationEnabled]);

  const dismissWelcomeBack = useCallback(() => setDaysSinceLastActive(0), []);

  const completeTutorial = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialCompleted: true }));
  }, []);

  const replayTutorial = useCallback(() => {
    setState((prev) => ({ ...prev, tutorialCompleted: false }));
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
        notificationCategories: patch.notificationCategories
          ? { ...prev.settings.notificationCategories, ...patch.notificationCategories }
          : prev.settings.notificationCategories,
      },
    }));
  }, []);

  const setEnergyLevel = useCallback((level: EnergyLevel) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, energyLevel: level },
    }));
  }, []);

  const isActionCompletedToday = useCallback(
    (sourceType: PositiveActionSource, sourceId: string, itemId: string, dateKey = todayKey) => {
      return state.completionLog.some(
        (r) =>
          r.date === dateKey &&
          r.sourceType === sourceType &&
          r.sourceId === sourceId &&
          r.itemId === itemId
      );
    },
    [state.completionLog, todayKey]
  );

  const togglePositiveAction = useCallback(
    (params: {
      sourceType: PositiveActionSource;
      sourceId: string;
      itemId: string;
      label: string;
      category: string;
      dateKey?: string;
    }) => {
      const targetDate = params.dateKey || todayKey;
      let becameCompleted = false;
      setState((prev) => {
        const exists = prev.completionLog.some(
          (r) =>
            r.date === targetDate &&
            r.sourceType === params.sourceType &&
            r.sourceId === params.sourceId &&
            r.itemId === params.itemId
        );
        if (exists) {
          becameCompleted = false;
          return {
            ...prev,
            completionLog: prev.completionLog.filter(
              (r) =>
                !(
                  r.date === targetDate &&
                  r.sourceType === params.sourceType &&
                  r.sourceId === params.sourceId &&
                  r.itemId === params.itemId
                )
            ),
          };
        }
        becameCompleted = true;
        const record: CompletionRecord = {
          id: createId('pa'),
          date: targetDate,
          timestamp: new Date().toISOString(),
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          itemId: params.itemId,
          label: params.label,
          category: params.category,
        };
        return {
          ...prev,
          completionLog: [...prev.completionLog, record],
        };
      });
      if (becameCompleted) {
        triggerFeedback();
      }
      return becameCompleted;
    },
    [todayKey, triggerFeedback]
  );

  const recordPositiveActionOnce = useCallback(
    (params: {
      sourceType: PositiveActionSource;
      sourceId: string;
      itemId: string;
      label: string;
      category: string;
    }) => {
      setState((prev) => {
        const exists = prev.completionLog.some(
          (r) =>
            r.date === todayKey &&
            r.sourceType === params.sourceType &&
            r.sourceId === params.sourceId &&
            r.itemId === params.itemId
        );
        if (exists) return prev;
        const record: CompletionRecord = {
          id: createId('pa'),
          date: todayKey,
          timestamp: new Date().toISOString(),
          ...params,
        };
        return {
          ...prev,
          completionLog: [...prev.completionLog, record],
        };
      });
      triggerFeedback();
    },
    [todayKey, triggerFeedback]
  );

  const removeCompletionRecord = useCallback((recordId: string) => {
    setState((prev) => ({
      ...prev,
      completionLog: prev.completionLog.filter((r) => r.id !== recordId),
    }));
  }, []);

  // Routines
  const addRoutine = useCallback(
    (input: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Routine => {
      const now = new Date().toISOString();
      const routine: Routine = {
        ...input,
        id: createId('rtn'),
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, routines: [routine, ...prev.routines] }));
      return routine;
    },
    []
  );

  const updateRoutine = useCallback((id: string, patch: Partial<Routine>) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      ),
    }));
  }, []);

  const duplicateRoutine = useCallback(
    (id: string): Routine | null => {
      const found = state.routines.find((r) => r.id === id);
      if (!found) return null;
      const now = new Date().toISOString();
      const clonedVersions: Routine['versions'] = {};
      (Object.keys(found.versions) as RoutineVersionType[]).forEach((ver) => {
        const vData = found.versions[ver];
        if (vData) {
          clonedVersions[ver] = {
            activities: vData.activities.map((a) => ({ ...a, id: createId('act') })),
          };
        }
      });
      const copy: Routine = {
        ...found,
        id: createId('rtn'),
        name: `${found.name} (Copy)`,
        versions: clonedVersions,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, routines: [copy, ...prev.routines] }));
      return copy;
    },
    [state.routines]
  );

  const archiveRoutine = useCallback((id: string, archived: boolean) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.map((r) =>
        r.id === id ? { ...r, archived, updatedAt: new Date().toISOString() } : r
      ),
    }));
  }, []);

  const deleteRoutinePermanently = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id),
    }));
  }, []);

  const setRoutineActivities = useCallback(
    (id: string, version: RoutineVersionType, activities: RoutineActivity[]) => {
      setState((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === id
            ? {
                ...r,
                versions: { ...r.versions, [version]: { activities } },
                updatedAt: new Date().toISOString(),
              }
            : r
        ),
      }));
    },
    []
  );

  // Checklists
  const addChecklist = useCallback(
    (input: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'resetCount'>): Checklist => {
      const now = new Date().toISOString();
      const checklist: Checklist = {
        ...input,
        id: createId('chk'),
        archived: false,
        resetCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, checklists: [checklist, ...prev.checklists] }));
      return checklist;
    },
    []
  );

  const updateChecklist = useCallback((id: string, patch: Partial<Checklist>) => {
    setState((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      ),
    }));
  }, []);

  const toggleChecklistItem = useCallback(
    (checklistId: string, itemId: string) => {
      const cl = state.checklists.find((c) => c.id === checklistId);
      const item = cl?.items.find((i) => i.id === itemId);
      if (!cl || !item) return;

      const nextCompleted = !item.completed;
      setState((prev) => {
        const nextChecklists = prev.checklists.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) => (i.id === itemId ? { ...i, completed: nextCompleted } : i)),
                updatedAt: new Date().toISOString(),
              }
            : c
        );

        let nextLog = prev.completionLog;
        if (nextCompleted) {
          const alreadyLogged = nextLog.some(
            (r) =>
              r.date === todayKey &&
              r.sourceType === 'checklist-item' &&
              r.sourceId === checklistId &&
              r.itemId === itemId
          );
          if (!alreadyLogged) {
            nextLog = [
              ...nextLog,
              {
                id: createId('pa'),
                date: todayKey,
                timestamp: new Date().toISOString(),
                sourceType: 'checklist-item',
                sourceId: checklistId,
                itemId,
                label: item.title,
                category: 'Checklists',
              },
            ];
          }
        } else {
          nextLog = nextLog.filter(
            (r) =>
              !(
                r.date === todayKey &&
                r.sourceType === 'checklist-item' &&
                r.sourceId === checklistId &&
                r.itemId === itemId
              )
          );
        }

        return { ...prev, checklists: nextChecklists, completionLog: nextLog };
      });
      if (nextCompleted) triggerFeedback();
    },
    [state.checklists, todayKey, triggerFeedback]
  );

  const resetChecklist = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === id
          ? {
              ...c,
              items: c.items.map((i) => ({ ...i, completed: false })),
              resetCount: c.resetCount + 1,
              lastResetAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  }, []);

  const duplicateChecklist = useCallback(
    (id: string): Checklist | null => {
      const found = state.checklists.find((c) => c.id === id);
      if (!found) return null;
      const now = new Date().toISOString();
      const copy: Checklist = {
        ...found,
        id: createId('chk'),
        name: `${found.name} (Copy)`,
        items: found.items.map((i) => ({ ...i, id: createId('ci'), completed: false })),
        archived: false,
        resetCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, checklists: [copy, ...prev.checklists] }));
      return copy;
    },
    [state.checklists]
  );

  const archiveChecklist = useCallback((id: string, archived: boolean) => {
    setState((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === id ? { ...c, archived, updatedAt: new Date().toISOString() } : c
      ),
    }));
  }, []);

  const deleteChecklistPermanently = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((c) => c.id !== id),
    }));
  }, []);

  // Backpacks
  const addBackpack = useCallback(
    (input: Omit<Backpack, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Backpack => {
      const now = new Date().toISOString();
      const backpack: Backpack = {
        ...input,
        id: createId('bp'),
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, backpacks: [backpack, ...prev.backpacks] }));
      return backpack;
    },
    []
  );

  const updateBackpack = useCallback((id: string, patch: Partial<Backpack>) => {
    setState((prev) => ({
      ...prev,
      backpacks: prev.backpacks.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
      ),
    }));
  }, []);

  const toggleBackpackItem = useCallback(
    (backpackId: string, itemId: string) => {
      const bp = state.backpacks.find((b) => b.id === backpackId);
      const item = bp?.items.find((i) => i.id === itemId);
      if (!bp || !item) return;

      const nextPacked = !item.packed;
      setState((prev) => {
        const nextBackpacks = prev.backpacks.map((b) => {
          if (b.id !== backpackId) return b;
          const nextItems: BackpackItem[] = b.items.map((i) =>
            i.id === itemId ? { ...i, packed: nextPacked } : i
          );
          const allPacked = nextItems.length > 0 && nextItems.every((i) => i.packed);
          return {
            ...b,
            items: nextItems,
            lastPackedAt: allPacked ? new Date().toISOString() : b.lastPackedAt,
            updatedAt: new Date().toISOString(),
          };
        });

        let nextLog = prev.completionLog;
        if (nextPacked) {
          const exists = nextLog.some(
            (r) =>
              r.date === todayKey &&
              r.sourceType === 'backpack-item' &&
              r.sourceId === backpackId &&
              r.itemId === itemId
          );
          if (!exists) {
            nextLog = [
              ...nextLog,
              {
                id: createId('pa'),
                date: todayKey,
                timestamp: new Date().toISOString(),
                sourceType: 'backpack-item',
                sourceId: backpackId,
                itemId,
                label: item.name,
                category: 'Backpacks',
              },
            ];
          }
        } else {
          nextLog = nextLog.filter(
            (r) =>
              !(
                r.date === todayKey &&
                r.sourceType === 'backpack-item' &&
                r.sourceId === backpackId &&
                r.itemId === itemId
              )
          );
        }

        return { ...prev, backpacks: nextBackpacks, completionLog: nextLog };
      });
      if (nextPacked) triggerFeedback();
    },
    [state.backpacks, todayKey, triggerFeedback]
  );

  const resetBackpackPacking = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      backpacks: prev.backpacks.map((b) =>
        b.id === id
          ? {
              ...b,
              items: b.items.map((i) => ({ ...i, packed: false })),
              updatedAt: new Date().toISOString(),
            }
          : b
      ),
    }));
  }, []);

  const duplicateBackpack = useCallback(
    (id: string): Backpack | null => {
      const found = state.backpacks.find((b) => b.id === id);
      if (!found) return null;
      const now = new Date().toISOString();
      const copy: Backpack = {
        ...found,
        id: createId('bp'),
        name: `${found.name} (Copy)`,
        items: found.items.map((i) => ({ ...i, id: createId('bi'), packed: false })),
        archived: false,
        lastPackedAt: undefined,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, backpacks: [copy, ...prev.backpacks] }));
      return copy;
    },
    [state.backpacks]
  );

  const archiveBackpack = useCallback((id: string, archived: boolean) => {
    setState((prev) => ({
      ...prev,
      backpacks: prev.backpacks.map((b) =>
        b.id === id ? { ...b, archived, updatedAt: new Date().toISOString() } : b
      ),
    }));
  }, []);

  const deleteBackpackPermanently = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      backpacks: prev.backpacks.filter((b) => b.id !== id),
    }));
  }, []);

  // Calendar
  const addCalendarItem = useCallback(
    (input: Omit<CalendarItem, 'id' | 'createdAt' | 'completedDates'>): CalendarItem => {
      const item: CalendarItem = {
        ...input,
        id: createId('cal'),
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, calendarItems: [...prev.calendarItems, item] }));
      return item;
    },
    []
  );

  const updateCalendarItem = useCallback((id: string, patch: Partial<CalendarItem>) => {
    setState((prev) => ({
      ...prev,
      calendarItems: prev.calendarItems.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const overrideCalendarOccurrence = useCallback(
    (id: string, dateKey: string, override: CalendarOccurrenceOverride) => {
      setState((prev) => ({
        ...prev,
        calendarItems: prev.calendarItems.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            overrides: {
              ...(c.overrides || {}),
              [dateKey]: {
                ...(c.overrides?.[dateKey] || {}),
                ...override,
              },
            },
          };
        }),
      }));
    },
    []
  );

  const toggleCalendarCompletion = useCallback(
    (id: string, dateKey: string) => {
      const item = state.calendarItems.find((c) => c.id === id);
      if (!item) return;
      const isDone = item.completedDates.includes(dateKey);
      const nextDone = !isDone;

      setState((prev) => {
        const nextCal = prev.calendarItems.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            completedDates: nextDone
              ? [...c.completedDates, dateKey]
              : c.completedDates.filter((d) => d !== dateKey),
          };
        });

        let nextLog = prev.completionLog;
        // Only record positive actions for today or past dates, never future dates
        if (dateKey <= todayKey) {
          if (nextDone) {
            const exists = nextLog.some(
              (r) =>
                r.date === dateKey &&
                r.sourceType === 'task' &&
                r.sourceId === id &&
                r.itemId === dateKey
            );
            if (!exists) {
              nextLog = [
                ...nextLog,
                {
                  id: createId('pa'),
                  date: dateKey,
                  timestamp: new Date().toISOString(),
                  sourceType: 'task',
                  sourceId: id,
                  itemId: dateKey,
                  label: item.overrides?.[dateKey]?.title ?? item.title,
                  category: item.type === 'routine' ? 'Routines' : 'Scheduled Tasks',
                },
              ];
            }
          } else {
            nextLog = nextLog.filter(
              (r) =>
                !(
                  r.date === dateKey &&
                  r.sourceType === 'task' &&
                  r.sourceId === id &&
                  r.itemId === dateKey
                )
            );
          }
        }

        return { ...prev, calendarItems: nextCal, completionLog: nextLog };
      });
      if (nextDone) triggerFeedback();
    },
    [state.calendarItems, todayKey, triggerFeedback]
  );

  const deleteCalendarItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      calendarItems: prev.calendarItems.filter((c) => c.id !== id),
    }));
  }, []);

  // Journal
  const addJournalEntry = useCallback(
    (input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry => {
      const now = new Date().toISOString();
      const entry: JournalEntry = {
        ...input,
        id: createId('jrn'),
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, journalEntries: [entry, ...prev.journalEntries] }));
      return entry;
    },
    []
  );

  const updateJournalEntry = useCallback((id: string, patch: Partial<JournalEntry>) => {
    setState((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.map((j) =>
        j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j
      ),
    }));
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.filter((j) => j.id !== id),
    }));
  }, []);

  // Brain Dump
  const addBrainDumpEntry = useCallback(
    (text: string, category: BrainDumpEntry['category'] = 'thought'): BrainDumpEntry => {
      const entry: BrainDumpEntry = {
        id: createId('bd'),
        text,
        category,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, brainDumpEntries: [entry, ...prev.brainDumpEntries] }));
      return entry;
    },
    []
  );

  const updateBrainDumpEntry = useCallback((id: string, patch: Partial<BrainDumpEntry>) => {
    setState((prev) => ({
      ...prev,
      brainDumpEntries: prev.brainDumpEntries.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteBrainDumpEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      brainDumpEntries: prev.brainDumpEntries.filter((b) => b.id !== id),
    }));
  }, []);

  // Goals & Weekly Reset
  const addGoal = useCallback((input: Omit<PersonalGoal, 'id' | 'createdAt'>): PersonalGoal => {
    const goal: PersonalGoal = {
      ...input,
      id: createId('goal'),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
    return goal;
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<PersonalGoal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const saveWeeklyReflection = useCallback((weekKey: string, reflection: string, intention: string) => {
    setState((prev) => ({
      ...prev,
      weeklyReflections: {
        ...prev.weeklyReflections,
        [weekKey]: { reflection, intention, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  // Notifications
  const addNotification = useCallback((notif: Omit<NotificationItem, 'id'>) => {
    const item: NotificationItem = { ...notif, id: createId('ntf') };
    setState((prev) => ({ ...prev, notifications: [item, ...prev.notifications] }));
  }, []);

  const updateNotificationStatus = useCallback(
    (id: string, status: NotificationItem['status'], snoozedUntil?: string) => {
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, status, snoozedUntil } : n
        ),
      }));
    },
    []
  );

  const exportBackupJson = useCallback(() => exportNudgeBackup(state), [state]);

  const importBackupJson = useCallback((raw: string) => {
    const imported = parseImportedBackup(raw);
    if (!imported) return false;
    setState(imported);
    return true;
  }, []);

  const clearAllData = useCallback(() => {
    const fresh = clearNudgeState();
    setState(fresh);
  }, []);

  // Tiny Garden Actions
  const markGardenVisited = useCallback(() => {
    setState((prev) => {
      if (
        prev.garden.unseenActionCount === 0 &&
        prev.garden.unseenEnergyEarned === 0 &&
        prev.garden.unseenLevelUps.length === 0
      ) {
        return {
          ...prev,
          garden: {
            ...prev.garden,
            lastVisitedAt: new Date().toISOString(),
          },
        };
      }
      return {
        ...prev,
        garden: {
          ...prev.garden,
          lastVisitedAt: new Date().toISOString(),
          unseenActionCount: 0,
          unseenEnergyEarned: 0,
          unseenLevelUps: [],
        },
      };
    });
  }, []);

  const unlockGardenSpecies = useCallback(
    (speciesId: PlantSpeciesId): boolean => {
      const def = PLANT_SPECIES.find((p) => p.id === speciesId);
      if (!def) return false;
      if (state.garden.unlockedSpecies.includes(speciesId)) return true;
      if (state.garden.energy < def.unlockCost) return false;

      setState((prev) => {
        if (prev.garden.unlockedSpecies.includes(speciesId) || prev.garden.energy < def.unlockCost) {
          return prev;
        }
        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy - def.unlockCost,
            unlockedSpecies: [...prev.garden.unlockedSpecies, speciesId],
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.energy, state.garden.unlockedSpecies, triggerFeedback]
  );

  const plantSeedInSlot = useCallback(
    (slotIndex: number, speciesId: PlantSpeciesId, potStyle: PotStyleId = 'terracotta'): boolean => {
      if (slotIndex < 0 || slotIndex >= 12) return false;
      const def = PLANT_SPECIES.find((p) => p.id === speciesId);
      if (!def) return false;
      if (!state.garden.unlockedSpecies.includes(speciesId)) return false;
      if (state.garden.slots[slotIndex] !== null) return false;
      if (state.garden.energy < def.seedCost) return false;

      setState((prev) => {
        if (
          prev.garden.slots[slotIndex] !== null ||
          !prev.garden.unlockedSpecies.includes(speciesId) ||
          prev.garden.energy < def.seedCost
        ) {
          return prev;
        }
        const nextSlots = [...prev.garden.slots];
        nextSlots[slotIndex] = {
          kind: 'plant',
          id: createId('plt'),
          speciesId,
          potStyle,
          growthXp: 0,
          plantedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy - def.seedCost,
            slots: nextSlots,
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.energy, state.garden.slots, state.garden.unlockedSpecies, triggerFeedback]
  );

  const unlockGardenDecoration = useCallback(
    (decorationId: DecorationTypeId): boolean => {
      const def = GARDEN_DECORATIONS.find((d) => d.id === decorationId);
      if (!def) return false;
      if (state.garden.unlockedDecorations.includes(decorationId)) return true;
      if (state.garden.energy < def.cost) return false;

      setState((prev) => {
        if (
          prev.garden.unlockedDecorations.includes(decorationId) ||
          prev.garden.energy < def.cost
        ) {
          return prev;
        }
        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy - def.cost,
            unlockedDecorations: [...prev.garden.unlockedDecorations, decorationId],
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.energy, state.garden.unlockedDecorations, triggerFeedback]
  );

  const placeDecorationInSlot = useCallback(
    (slotIndex: number, decorationId: DecorationTypeId): boolean => {
      if (slotIndex < 0 || slotIndex >= 12) return false;
      if (!state.garden.unlockedDecorations.includes(decorationId)) return false;
      if (state.garden.slots[slotIndex] !== null) return false;

      setState((prev) => {
        if (
          prev.garden.slots[slotIndex] !== null ||
          !prev.garden.unlockedDecorations.includes(decorationId)
        ) {
          return prev;
        }
        const nextSlots = [...prev.garden.slots];
        nextSlots[slotIndex] = {
          kind: 'decoration',
          id: createId('dec'),
          decorationId,
          placedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          garden: {
            ...prev.garden,
            slots: nextSlots,
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.slots, state.garden.unlockedDecorations, triggerFeedback]
  );

  const unlockGardenBackground = useCallback(
    (bgId: GardenBackgroundId): boolean => {
      const def = GARDEN_BACKGROUNDS.find((b) => b.id === bgId);
      if (!def) return false;
      if (state.garden.unlockedBackgrounds.includes(bgId)) {
        setState((prev) => ({
          ...prev,
          garden: { ...prev.garden, activeBackground: bgId },
        }));
        return true;
      }
      if (state.garden.energy < def.cost) return false;

      setState((prev) => {
        if (prev.garden.unlockedBackgrounds.includes(bgId) || prev.garden.energy < def.cost) {
          return prev;
        }
        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy - def.cost,
            unlockedBackgrounds: [...prev.garden.unlockedBackgrounds, bgId],
            activeBackground: bgId,
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.energy, state.garden.unlockedBackgrounds, triggerFeedback]
  );

  const moveGardenSlot = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= 12 || toIndex >= 12) {
      return;
    }
    setState((prev) => {
      const nextSlots = [...prev.garden.slots];
      const temp = nextSlots[fromIndex];
      nextSlots[fromIndex] = nextSlots[toIndex];
      nextSlots[toIndex] = temp;
      return {
        ...prev,
        garden: {
          ...prev.garden,
          slots: nextSlots,
        },
      };
    });
  }, []);

  const clearGardenSlot = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 12) return;
    setState((prev) => {
      if (prev.garden.slots[slotIndex] === null) return prev;
      const nextSlots = [...prev.garden.slots];
      nextSlots[slotIndex] = null;
      return {
        ...prev,
        garden: {
          ...prev.garden,
          slots: nextSlots,
        },
      };
    });
  }, []);

  const waterPlantSlot = useCallback(
    (slotIndex: number): boolean => {
      if (slotIndex < 0 || slotIndex >= 12) return false;
      const slot = state.garden.slots[slotIndex];
      if (!slot || slot.kind !== 'plant') return false;

      setState((prev) => {
        const current = prev.garden.slots[slotIndex];
        if (!current || current.kind !== 'plant') return prev;
        const alreadyWateredToday = current.lastWateredDate === todayKey;
        const updatedPlant: PlantedSlotItem = {
          ...current,
          lastWateredDate: todayKey,
          growthXp:
            !alreadyWateredToday && current.growthXp < MAX_PLANT_XP
              ? current.growthXp + 1
              : current.growthXp,
        };
        const nextSlots = [...prev.garden.slots];
        nextSlots[slotIndex] = updatedPlant;
        return {
          ...prev,
          garden: {
            ...prev.garden,
            slots: nextSlots,
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.slots, todayKey, triggerFeedback]
  );

  const nurturePlantWithEnergy = useCallback(
    (slotIndex: number): boolean => {
      if (slotIndex < 0 || slotIndex >= 12) return false;
      const slot = state.garden.slots[slotIndex];
      if (!slot || slot.kind !== 'plant' || slot.growthXp >= MAX_PLANT_XP) return false;
      if (state.garden.energy < 1) return false;

      setState((prev) => {
        const current = prev.garden.slots[slotIndex];
        if (!current || current.kind !== 'plant' || current.growthXp >= MAX_PLANT_XP) return prev;
        if (prev.garden.energy < 1) return prev;

        const nextSlots = [...prev.garden.slots];
        nextSlots[slotIndex] = {
          ...current,
          growthXp: Math.min(MAX_PLANT_XP, current.growthXp + 1),
        };
        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy - 1,
            slots: nextSlots,
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.garden.energy, state.garden.slots, triggerFeedback]
  );

  const changePotStyle = useCallback((slotIndex: number, potStyle: PotStyleId) => {
    if (slotIndex < 0 || slotIndex >= 12) return;
    setState((prev) => {
      const current = prev.garden.slots[slotIndex];
      if (!current || current.kind !== 'plant') return prev;
      const nextSlots = [...prev.garden.slots];
      nextSlots[slotIndex] = { ...current, potStyle };
      return {
        ...prev,
        garden: {
          ...prev.garden,
          slots: nextSlots,
        },
      };
    });
  }, []);

  const updateGardenPreferences = useCallback(
    (
      patch: Partial<
        Pick<
          TinyGardenState,
          'activeBackground' | 'seasonOverride' | 'companionVisible' | 'companionName' | 'easterEggDiscovered'
        >
      >
    ) => {
      setState((prev) => ({
        ...prev,
        garden: {
          ...prev.garden,
          ...patch,
        },
      }));
    },
    []
  );

  const claimWeeklyGardenReward = useCallback(
    (weekKey: string, rewardId: string): boolean => {
      const reward = WEEKLY_GARDEN_REWARDS.find((r) => r.id === rewardId);
      if (!reward) return false;

      const weekDates = new Set(getLocalWeekDates(todayKey));
      const weeklyActions = state.completionLog.filter((r) => weekDates.has(r.date)).length;
      if (weeklyActions < reward.requiredActions) return false;

      const claimedForWeek = state.garden.claimedWeeklyRewards[weekKey] || [];
      if (claimedForWeek.includes(rewardId)) return false;

      setState((prev) => {
        const existingClaimed = prev.garden.claimedWeeklyRewards[weekKey] || [];
        if (existingClaimed.includes(rewardId)) return prev;

        const nextUnlockedSpecies =
          reward.unlockSpecies && !prev.garden.unlockedSpecies.includes(reward.unlockSpecies)
            ? [...prev.garden.unlockedSpecies, reward.unlockSpecies]
            : prev.garden.unlockedSpecies;

        const nextUnlockedDecos =
          reward.unlockDecoration && !prev.garden.unlockedDecorations.includes(reward.unlockDecoration)
            ? [...prev.garden.unlockedDecorations, reward.unlockDecoration]
            : prev.garden.unlockedDecorations;

        const nextUnlockedBgs =
          reward.unlockBackground && !prev.garden.unlockedBackgrounds.includes(reward.unlockBackground)
            ? [...prev.garden.unlockedBackgrounds, reward.unlockBackground]
            : prev.garden.unlockedBackgrounds;

        return {
          ...prev,
          garden: {
            ...prev.garden,
            energy: prev.garden.energy + reward.bonusEnergy,
            totalEnergyEarned: prev.garden.totalEnergyEarned + reward.bonusEnergy,
            unlockedSpecies: nextUnlockedSpecies,
            unlockedDecorations: nextUnlockedDecos,
            unlockedBackgrounds: nextUnlockedBgs,
            claimedWeeklyRewards: {
              ...prev.garden.claimedWeeklyRewards,
              [weekKey]: [...existingClaimed, rewardId],
            },
          },
        };
      });
      triggerFeedback();
      return true;
    },
    [state.completionLog, state.garden.claimedWeeklyRewards, todayKey, triggerFeedback]
  );

  const value: NudgeContextValue = {
    state,
    todayKey,
    daysSinceLastActive,
    dismissWelcomeBack,
    completeTutorial,
    replayTutorial,
    updateSettings,
    setEnergyLevel,
    isActionCompletedToday,
    togglePositiveAction,
    recordPositiveActionOnce,
    removeCompletionRecord,
    addRoutine,
    updateRoutine,
    duplicateRoutine,
    archiveRoutine,
    deleteRoutinePermanently,
    setRoutineActivities,
    addChecklist,
    updateChecklist,
    toggleChecklistItem,
    resetChecklist,
    duplicateChecklist,
    archiveChecklist,
    deleteChecklistPermanently,
    addBackpack,
    updateBackpack,
    toggleBackpackItem,
    resetBackpackPacking,
    duplicateBackpack,
    archiveBackpack,
    deleteBackpackPermanently,
    addCalendarItem,
    updateCalendarItem,
    overrideCalendarOccurrence,
    toggleCalendarCompletion,
    deleteCalendarItem,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addBrainDumpEntry,
    updateBrainDumpEntry,
    deleteBrainDumpEntry,
    addGoal,
    updateGoal,
    deleteGoal,
    saveWeeklyReflection,
    addNotification,
    updateNotificationStatus,
    exportBackupJson,
    importBackupJson,
    clearAllData,
    markGardenVisited,
    unlockGardenSpecies,
    plantSeedInSlot,
    unlockGardenDecoration,
    placeDecorationInSlot,
    unlockGardenBackground,
    moveGardenSlot,
    clearGardenSlot,
    waterPlantSlot,
    nurturePlantWithEnergy,
    changePotStyle,
    updateGardenPreferences,
    claimWeeklyGardenReward,
  };

  return <NudgeContext.Provider value={value}>{children}</NudgeContext.Provider>;
};

export function useNudge(): NudgeContextValue {
  const ctx = useContext(NudgeContext);
  if (!ctx) throw new Error('useNudge must be used within NudgeProvider');
  return ctx;
}
