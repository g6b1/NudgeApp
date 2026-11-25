import {
  CompletionRecord,
  GardenContributionLog,
  JournalEntry,
  PlantedSlotItem,
  TinyGardenState,
} from '../types/nudge';
import { getStageForXp, MAX_PLANT_XP, PLANT_SPECIES } from '../data/gardenCatalog';

const ENERGY_PER_POSITIVE_ACTION = 2; // 1 passive plant growth + 1 spendable energy
const JOURNAL_DAILY_BONUS = 2;

export function createInitialGardenState(): TinyGardenState {
  const slots = Array.from({ length: 12 }, () => null) as TinyGardenState['slots'];
  // Starter cozy pot with a Daisy seed ready to grow from the user's very first positive action
  slots[4] = {
    kind: 'plant',
    id: 'starter_daisy',
    speciesId: 'daisy',
    potStyle: 'terracotta',
    growthXp: 0,
    plantedAt: new Date().toISOString(),
  };

  return {
    energy: 4,
    totalEnergyEarned: 4,
    unlockedSpecies: ['daisy', 'sunflower'],
    unlockedDecorations: ['rocks'],
    unlockedBackgrounds: ['meadow'],
    activeBackground: 'meadow',
    seasonOverride: 'auto',
    companionVisible: true,
    companionName: 'Pip',
    slots,
    processedActionIds: {},
    claimedWeeklyRewards: {},
    recentContributions: [],
    unseenActionCount: 0,
    unseenEnergyEarned: 0,
    unseenLevelUps: [],
    easterEggDiscovered: false,
  };
}

/**
 * Reconciles TinyGardenState with real Positive Actions (`completionLog`) and Journal dates.
 * - Never double-counts existing actions on refresh.
 * - Passively nurtures planted, non-maxed plants when new positive actions arrive.
 * - Cleanly reverses energy & unspent plant XP when an accidental completion is undone,
 *   without ever removing previously unlocked permanent content or killing plants.
 */
export function reconcileGardenWithActions(
  garden: TinyGardenState,
  completionLog: CompletionRecord[],
  journalEntries: JournalEntry[],
  todayKey: string
): TinyGardenState {
  const validActions = completionLog.filter((r) => r.date <= todayKey);
  const currentActionMap = new Map<string, CompletionRecord>();
  for (const rec of validActions) {
    currentActionMap.set(rec.id, rec);
  }

  // Unique journal dates up to today give an optional gentle +2 bonus once per date
  const journalDateKeys = new Set<string>();
  for (const j of journalEntries) {
    if (j.date <= todayKey) journalDateKeys.add(`journal_${j.date}`);
  }

  let nextEnergy = garden.energy;
  let nextTotalEarned = garden.totalEnergyEarned;
  const nextProcessed = { ...garden.processedActionIds };
  let nextSlots = [...garden.slots];
  let nextRecent = [...garden.recentContributions];
  let nextUnseenActions = garden.unseenActionCount;
  let nextUnseenEnergy = garden.unseenEnergyEarned;
  const nextLevelUps = [...garden.unseenLevelUps];
  let changed = false;

  // 1. Reverse undone Positive Actions cleanly (without touching permanent unlocks)
  for (const [processedId, awarded] of Object.entries(nextProcessed)) {
    const isJournalKey = processedId.startsWith('journal_');
    const stillExists = isJournalKey
      ? journalDateKeys.has(processedId)
      : currentActionMap.has(processedId);

    if (!stillExists) {
      delete nextProcessed[processedId];
      // Deduct up to what's available in spendable energy & un-maxed plant XP
      const spendableDeduction = Math.min(nextEnergy, Math.ceil(awarded / 2));
      nextEnergy = Math.max(0, nextEnergy - spendableDeduction);
      nextTotalEarned = Math.max(0, nextTotalEarned - awarded);
      nextUnseenActions = Math.max(0, nextUnseenActions - 1);
      nextUnseenEnergy = Math.max(0, nextUnseenEnergy - awarded);
      nextRecent = nextRecent.filter((c) => c.actionId !== processedId);

      // Gently reverse 1 passive XP from the most recently grown non-maxed plant if possible
      const growIdx = nextSlots.findIndex(
        (s): s is PlantedSlotItem => s !== null && s.kind === 'plant' && s.growthXp > 0 && s.growthXp < MAX_PLANT_XP
      );
      if (growIdx !== -1) {
        const plant = nextSlots[growIdx] as PlantedSlotItem;
        nextSlots[growIdx] = { ...plant, growthXp: Math.max(0, plant.growthXp - 1) };
      }
      changed = true;
    }
  }

  // Helper to passively nurture one planted plant by 1 XP
  const applyPassiveGrowth = (xpGain: number) => {
    let remaining = xpGain;
    while (remaining > 0) {
      const idx = nextSlots.findIndex(
        (s): s is PlantedSlotItem => s !== null && s.kind === 'plant' && s.growthXp < MAX_PLANT_XP
      );
      if (idx === -1) break;
      const plant = nextSlots[idx] as PlantedSlotItem;
      const prevStage = getStageForXp(plant.growthXp).stage;
      const updatedXp = Math.min(MAX_PLANT_XP, plant.growthXp + 1);
      const nextStageInfo = getStageForXp(updatedXp);
      nextSlots[idx] = { ...plant, growthXp: updatedXp };
      if (nextStageInfo.stage > prevStage) {
        const spName = PLANT_SPECIES.find((p) => p.id === plant.speciesId)?.name || 'Plant';
        const msg = `${spName} reached ${nextStageInfo.name}!`;
        if (!nextLevelUps.includes(msg)) nextLevelUps.push(msg);
      }
      remaining--;
    }
  };

  // 2. Award growth for newly recorded Positive Actions
  for (const rec of validActions) {
    if (nextProcessed[rec.id] !== undefined) continue;
    nextProcessed[rec.id] = ENERGY_PER_POSITIVE_ACTION;

    // 1 passive plant XP + 1 spendable Garden Energy (or 2 spendable if all plants are blooming!)
    const hasGrowingPlant = nextSlots.some(
      (s): s is PlantedSlotItem => s !== null && s.kind === 'plant' && s.growthXp < MAX_PLANT_XP
    );
    if (hasGrowingPlant) {
      applyPassiveGrowth(1);
      nextEnergy += 1;
    } else {
      nextEnergy += ENERGY_PER_POSITIVE_ACTION;
    }

    nextTotalEarned += ENERGY_PER_POSITIVE_ACTION;
    nextUnseenActions += 1;
    nextUnseenEnergy += ENERGY_PER_POSITIVE_ACTION;

    const entry: GardenContributionLog = {
      id: `gc_${rec.id}`,
      actionId: rec.id,
      label: rec.label,
      energy: ENERGY_PER_POSITIVE_ACTION,
      timestamp: rec.timestamp,
    };
    nextRecent = [entry, ...nextRecent].slice(0, 20);
    changed = true;
  }

  // 3. Optional gentle bonus for journal entries (once per local day)
  for (const jKey of journalDateKeys) {
    if (nextProcessed[jKey] !== undefined) continue;
    nextProcessed[jKey] = JOURNAL_DAILY_BONUS;
    nextEnergy += JOURNAL_DAILY_BONUS;
    nextTotalEarned += JOURNAL_DAILY_BONUS;
    nextUnseenEnergy += JOURNAL_DAILY_BONUS;

    const entry: GardenContributionLog = {
      id: `gc_${jKey}`,
      actionId: jKey,
      label: `Journal reflection (${jKey.replace('journal_', '')})`,
      energy: JOURNAL_DAILY_BONUS,
      timestamp: new Date().toISOString(),
    };
    nextRecent = [entry, ...nextRecent].slice(0, 20);
    changed = true;
  }

  if (!changed) return garden;

  return {
    ...garden,
    energy: nextEnergy,
    totalEnergyEarned: nextTotalEarned,
    slots: nextSlots,
    processedActionIds: nextProcessed,
    recentContributions: nextRecent,
    unseenActionCount: nextUnseenActions,
    unseenEnergyEarned: nextUnseenEnergy,
    unseenLevelUps: nextLevelUps,
  };
}
