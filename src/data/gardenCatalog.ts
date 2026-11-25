import {
  DecorationTypeId,
  GardenBackgroundId,
  GardenSeasonId,
  PlantSpeciesId,
  PotStyleId,
} from '../types/nudge';

export interface GrowthStageInfo {
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  minXp: number;
}

export const GROWTH_STAGES: GrowthStageInfo[] = [
  { stage: 1, name: 'Seed', minXp: 0 },
  { stage: 2, name: 'Sprout', minXp: 2 },
  { stage: 3, name: 'Young Plant', minXp: 5 },
  { stage: 4, name: 'Growing Plant', minXp: 9 },
  { stage: 5, name: 'Mature Plant', minXp: 14 },
  { stage: 6, name: 'Blooming', minXp: 20 },
];

export const MAX_PLANT_XP = 20;

export function getStageForXp(xp: number): GrowthStageInfo {
  let current = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) {
    if (xp >= s.minXp) current = s;
  }
  return current;
}

export interface PlantSpeciesDef {
  id: PlantSpeciesId;
  name: string;
  unlockCost: number;
  seedCost: number;
  bloomNote: string;
  palette: {
    stem: string;
    leaf: string;
    bloom: string;
    center: string;
  };
}

export const PLANT_SPECIES: PlantSpeciesDef[] = [
  {
    id: 'daisy',
    name: 'Daisy',
    unlockCost: 0,
    seedCost: 2,
    bloomNote: 'Opens bright white petals with a warm honey center—steady and cheerful.',
    palette: { stem: '#6A8B63', leaf: '#82A27A', bloom: '#FFFDF7', center: '#E5B85B' },
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    unlockCost: 0,
    seedCost: 2,
    bloomNote: 'Grows tall and turns softly toward daylight.',
    palette: { stem: '#5E8056', leaf: '#75966B', bloom: '#EBB844', center: '#6D4C3D' },
  },
  {
    id: 'wildflowers',
    name: 'Wildflowers',
    unlockCost: 4,
    seedCost: 2,
    bloomNote: 'A cozy meadow cluster of cornflowers, buttercups, and clover.',
    palette: { stem: '#688762', leaf: '#84A47D', bloom: '#7C98C8', center: '#F2CC6B' },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    unlockCost: 6,
    seedCost: 2,
    bloomNote: 'Silvery-green stems crowned with soothing violet spikes.',
    palette: { stem: '#6F8672', leaf: '#8DA390', bloom: '#9882C4', center: '#B7A5DA' },
  },
  {
    id: 'tulip',
    name: 'Tulip',
    unlockCost: 8,
    seedCost: 3,
    bloomNote: 'Sculpted coral-blush cup nestled in broad arched leaves.',
    palette: { stem: '#62835B', leaf: '#7B9D72', bloom: '#DF7F78', center: '#F3B4AD' },
  },
  {
    id: 'strawberry',
    name: 'Strawberry Plant',
    unlockCost: 10,
    seedCost: 3,
    bloomNote: 'Delicate white blossoms that ripen into sweet ruby berries.',
    palette: { stem: '#5E8254', leaf: '#759C68', bloom: '#D95D5B', center: '#FFFBF2' },
  },
  {
    id: 'cactus',
    name: 'Cactus',
    unlockCost: 12,
    seedCost: 3,
    bloomNote: 'Thrives peacefully at its own pace and tops off with a rosy desert bloom.',
    palette: { stem: '#6F9471', leaf: '#89AB8A', bloom: '#E3889C', center: '#F4C266' },
  },
  {
    id: 'monstera',
    name: 'Monstera',
    unlockCost: 14,
    seedCost: 3,
    bloomNote: 'Unfurls lush, split tropical leaves one calm day at a time.',
    palette: { stem: '#4F7753', leaf: '#628C65', bloom: '#7EA57F', center: '#B7CEB6' },
  },
  {
    id: 'rose',
    name: 'Rose',
    unlockCost: 16,
    seedCost: 4,
    bloomNote: 'Layered blush-rose petals unfolding slowly into a classic garden bloom.',
    palette: { stem: '#5A7853', leaf: '#729269', bloom: '#CE6A78', center: '#EAA0AA' },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom Tree',
    unlockCost: 20,
    seedCost: 5,
    bloomNote: 'A miniature sakura canopy bursting with soft spring blossoms.',
    palette: { stem: '#7A5C4D', leaf: '#8AA37B', bloom: '#F0B6C5', center: '#FCE2E9' },
  },
];

export const POT_STYLES: { id: PotStyleId; name: string; body: string; rim: string }[] = [
  { id: 'terracotta', name: 'Terracotta', body: '#C67D5B', rim: '#D8916F' },
  { id: 'porcelain', name: 'Porcelain', body: '#F4F1EA', rim: '#FFFFFF' },
  { id: 'sage', name: 'Sage Glaze', body: '#8CA083', rim: '#A3B69A' },
  { id: 'woven', name: 'Woven Basket', body: '#B89A74', rim: '#CCAFA0' },
];

export interface DecorationDef {
  id: DecorationTypeId;
  name: string;
  cost: number;
  note: string;
}

export const GARDEN_DECORATIONS: DecorationDef[] = [
  { id: 'rocks', name: 'Mossy Stones', cost: 2, note: 'Smooth river pebbles with soft moss.' },
  { id: 'path', name: 'Garden Path', cost: 2, note: 'Warm stepping stones through the grass.' },
  { id: 'mushrooms', name: 'Fairy Mushrooms', cost: 3, note: 'A cozy cluster of spotted toadstools.' },
  { id: 'deco-flowers', name: 'Clover Patch', cost: 3, note: 'Tiny clover blossoms scattered naturally.' },
  { id: 'fence', name: 'Wooden Fence', cost: 4, note: 'Low cedar garden border.' },
  { id: 'lantern', name: 'Warm Lantern', cost: 5, note: 'Casts a soft golden glow across the patio.' },
  { id: 'bench', name: 'Garden Bench', cost: 6, note: 'A quiet wooden seat for resting.' },
  { id: 'birdhouse', name: 'Birdhouse', cost: 6, note: 'A tiny sage-roofed cottage for visitors.' },
  { id: 'butterflies', name: 'Butterflies', cost: 7, note: 'Gentle wings drifting above the leaves.' },
  { id: 'pond', name: 'Lily Pond', cost: 8, note: 'Still water with floating lily pads.' },
];

export interface GardenBackgroundDef {
  id: GardenBackgroundId;
  name: string;
  cost: number;
  skyTop: string;
  skyBottom: string;
  groundTop: string;
  groundBottom: string;
  isDark?: boolean;
}

export const GARDEN_BACKGROUNDS: GardenBackgroundDef[] = [
  {
    id: 'meadow',
    name: 'Morning Meadow',
    cost: 0,
    skyTop: '#EAEFE6',
    skyBottom: '#F7F3E9',
    groundTop: '#DCE5D1',
    groundBottom: '#C7D5B8',
  },
  {
    id: 'greenhouse',
    name: 'Sunlit Greenhouse',
    cost: 5,
    skyTop: '#F3ECE0',
    skyBottom: '#FAF6EE',
    groundTop: '#E2E4D4',
    groundBottom: '#CED4BE',
  },
  {
    id: 'patio',
    name: 'Dusk Lantern Patio',
    cost: 8,
    skyTop: '#363B4C',
    skyBottom: '#5B515C',
    groundTop: '#4A4E43',
    groundBottom: '#393D33',
    isDark: true,
  },
  {
    id: 'starlit',
    name: 'Starlit Courtyard',
    cost: 12,
    skyTop: '#1A2232',
    skyBottom: '#2B3749',
    groundTop: '#2E3B31',
    groundBottom: '#212B24',
    isDark: true,
  },
];

export function resolveCurrentSeason(override: GardenSeasonId): Exclude<GardenSeasonId, 'auto'> {
  if (override !== 'auto') return override;
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export const COMPANION_MESSAGES = [
  'Welcome back!',
  'Something is growing.',
  'Look at those little sprouts.',
  'Take your time—there is no rush here.',
  'Every small thing you do for yourself helps the garden.',
  'Rest days are part of growing too.',
  'The soil is peaceful today.',
];

export interface WeeklyGardenReward {
  id: string;
  requiredActions: number;
  title: string;
  description: string;
  bonusEnergy: number;
  unlockDecoration?: DecorationTypeId;
  unlockSpecies?: PlantSpeciesId;
  unlockBackground?: GardenBackgroundId;
}

export const WEEKLY_GARDEN_REWARDS: WeeklyGardenReward[] = [
  {
    id: 'wk-3',
    requiredActions: 3,
    title: 'Gentle Sprout Bundle',
    description: '+3 Garden Energy & Clover Patch unlocked',
    bonusEnergy: 3,
    unlockDecoration: 'deco-flowers',
  },
  {
    id: 'wk-8',
    requiredActions: 8,
    title: 'Cozy Meadow Gift',
    description: '+5 Garden Energy & Wildflowers unlocked',
    bonusEnergy: 5,
    unlockSpecies: 'wildflowers',
  },
  {
    id: 'wk-15',
    requiredActions: 15,
    title: 'Lantern Keeper Gift',
    description: '+8 Garden Energy & Warm Lantern unlocked',
    bonusEnergy: 8,
    unlockDecoration: 'lantern',
  },
  {
    id: 'wk-22',
    requiredActions: 22,
    title: 'Sunlit Sanctuary Gift',
    description: '+10 Garden Energy & Sunlit Greenhouse backdrop unlocked',
    bonusEnergy: 10,
    unlockBackground: 'greenhouse',
  },
];
