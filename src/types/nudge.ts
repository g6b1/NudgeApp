export type MainNavTab = 'today' | 'organize' | 'calendar' | 'journal' | 'progress';
export type OrganizeSubTab = 'routines' | 'checklists' | 'backpacks' | 'templates' | 'goals' | 'brain-dump' | 'weekly-reset';

export type EnergyLevel = 'high' | 'normal' | 'low' | 'very-low';

export type RoutineVersionType = 'full' | 'normal' | 'quick' | 'low-energy' | 'bare-minimum';

export type MoodType =
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'tired'
  | 'sad'
  | 'anxious'
  | 'overwhelmed'
  | 'grateful';

export type ThemePresetId =
  | 'botanical'
  | 'minimal'
  | 'warm-neutral'
  | 'pastel'
  | 'midnight'
  | 'retro'
  | 'y2k';

export type ColorMode = 'light' | 'dark' | 'system';

export type FontPreference = 'editorial' | 'sans' | 'serif';

export type BackgroundStyle = 'ambient' | 'minimal' | 'linen';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'every-n-weeks'
  | 'monthly-date'
  | 'monthly-first-weekday'
  | 'monthly-last-weekday';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  intervalWeeks?: number;
  weekdays?: number[]; // 0 (Sun) - 6 (Sat)
  monthDay?: number; // 1 - 31
  targetWeekday?: number; // 0 (Sun) - 6 (Sat) for first/last weekday of month
  endDate?: string; // YYYY-MM-DD
}

export interface RoutineActivity {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
}

export interface RoutineVersionData {
  activities: RoutineActivity[];
}

export interface RoutineSchedule {
  enabled: boolean;
  daysOfWeek: number[]; // 0 - 6
  time?: string; // HH:mm
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  activeVersion: RoutineVersionType;
  versions: Partial<Record<RoutineVersionType, RoutineVersionData>>;
  linkedBackpackId?: string;
  schedule?: RoutineSchedule;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  items: ChecklistItem[];
  archived: boolean;
  resetCount: number;
  lastResetAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackpackItem {
  id: string;
  name: string;
  quantity: number;
  required: boolean;
  packed: boolean;
}

export interface Backpack {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  items: BackpackItem[];
  lastPackedAt?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarOccurrenceOverride {
  title?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  color?: string;
  cancelled?: boolean;
}

export interface CalendarItem {
  id: string;
  title: string;
  type: 'task' | 'event' | 'routine';
  routineId?: string;
  date: string; // YYYY-MM-DD (start date)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  color: string;
  reminderMinutes?: number;
  completedDates: string[];
  recurrence?: RecurrenceRule;
  overrides?: Record<string, CalendarOccurrenceOverride>;
  createdAt: string;
}

export interface CalendarInstance {
  instanceKey: string; // `${item.id}_${date}`
  item: CalendarItem;
  date: string;
  title: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  color: string;
  completed: boolean;
  isRecurringInstance: boolean;
  isOverridden: boolean;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  mood: MoodType;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrainDumpEntry {
  id: string;
  text: string;
  category?: 'thought' | 'task' | 'idea' | 'feeling' | 'reminder';
  createdAt: string;
  convertedTo?: string;
}

export interface PersonalGoal {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  linkedRoutineIds: string[];
  linkedTaskIds: string[];
  weeklyIntention?: string;
  createdAt: string;
}

export type PositiveActionSource =
  | 'routine-activity'
  | 'checklist-item'
  | 'task'
  | 'backpack-item'
  | 'bare-minimum'
  | 'just-one-thing';

export interface CompletionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  sourceType: PositiveActionSource;
  sourceId: string;
  itemId: string;
  label: string;
  category: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'routines' | 'checklists' | 'backpacks' | 'tasks' | 'self-care' | 'journal';
  scheduledFor: string; // YYYY-MM-DD HH:mm
  status: 'pending' | 'snoozed' | 'skipped' | 'completed';
  snoozedUntil?: string;
  relatedId?: string;
}

export interface BareMinimumAction {
  id: string;
  title: string;
  emoji: string;
}

export interface GetOutOfBedStep {
  id: string;
  title: string;
}

export interface UserSettings {
  firstName: string;
  energyLevel: EnergyLevel;
  themePreset: ThemePresetId;
  colorMode: ColorMode;
  accentColor: string;
  backgroundStyle: BackgroundStyle;
  fontPreference: FontPreference;
  completionAnimations: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  countdownSeconds: number;
  countdownAutoStart: boolean;
  focusBackground: 'calm' | 'botanical' | 'deep';
  notificationsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationCategories: {
    routines: boolean;
    checklists: boolean;
    backpacks: boolean;
    tasks: boolean;
    selfCare: boolean;
    journal: boolean;
    summaries: boolean;
  };
  morningJournalReminder?: string;
  eveningJournalReminder?: string;
  eatingRemindersEnabled: boolean;
  aiConsentGranted: boolean;
  bareMinimumItems: BareMinimumAction[];
  getOutOfBedSteps: GetOutOfBedStep[];
  hygieneMode: 'minimum' | 'full';
  lastActiveDate?: string;
}

export interface NudgeState {
  schemaVersion: number;
  tutorialCompleted: boolean;
  settings: UserSettings;
  routines: Routine[];
  checklists: Checklist[];
  backpacks: Backpack[];
  calendarItems: CalendarItem[];
  journalEntries: JournalEntry[];
  brainDumpEntries: BrainDumpEntry[];
  goals: PersonalGoal[];
  completionLog: CompletionRecord[];
  notifications: NotificationItem[];
  weeklyReflections: Record<string, { reflection: string; intention: string; updatedAt: string }>;
  garden: TinyGardenState;
}

export type PlantSpeciesId =
  | 'sunflower'
  | 'daisy'
  | 'lavender'
  | 'tulip'
  | 'rose'
  | 'strawberry'
  | 'cactus'
  | 'monstera'
  | 'cherry-blossom'
  | 'wildflowers';

export type PotStyleId = 'terracotta' | 'porcelain' | 'sage' | 'woven';

export type DecorationTypeId =
  | 'path'
  | 'fence'
  | 'bench'
  | 'mushrooms'
  | 'birdhouse'
  | 'butterflies'
  | 'rocks'
  | 'deco-flowers'
  | 'lantern'
  | 'pond';

export type GardenBackgroundId = 'meadow' | 'greenhouse' | 'patio' | 'starlit';

export type GardenSeasonId = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';

export interface PlantedSlotItem {
  kind: 'plant';
  id: string;
  speciesId: PlantSpeciesId;
  potStyle: PotStyleId;
  growthXp: number;
  lastWateredDate?: string;
  plantedAt: string;
}

export interface DecorationSlotItem {
  kind: 'decoration';
  id: string;
  decorationId: DecorationTypeId;
  placedAt: string;
}

export type GardenTileContent = PlantedSlotItem | DecorationSlotItem | null;

export interface GardenContributionLog {
  id: string;
  actionId: string;
  label: string;
  energy: number;
  timestamp: string;
}

export interface TinyGardenState {
  energy: number;
  totalEnergyEarned: number;
  unlockedSpecies: PlantSpeciesId[];
  unlockedDecorations: DecorationTypeId[];
  unlockedBackgrounds: GardenBackgroundId[];
  activeBackground: GardenBackgroundId;
  seasonOverride: GardenSeasonId;
  companionVisible: boolean;
  companionName: string;
  slots: GardenTileContent[]; // 12 tiles (4x3 desktop, 3x4 mobile)
  processedActionIds: Record<string, number>; // actionId -> energy awarded
  claimedWeeklyRewards: Record<string, string[]>; // weekKey -> milestone ids claimed
  recentContributions: GardenContributionLog[];
  lastVisitedAt?: string;
  unseenActionCount: number;
  unseenEnergyEarned: number;
  unseenLevelUps: string[];
  easterEggDiscovered: boolean;
}
