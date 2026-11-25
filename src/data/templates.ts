import { RoutineActivity } from '../types/nudge';

export interface RoutineTemplate {
  id: string;
  kind: 'routine';
  category:
    | 'Morning'
    | 'Evening'
    | 'Self-care'
    | 'Cleaning'
    | 'Work'
    | 'School'
    | 'Fitness'
    | 'Sleep'
    | 'Wellness';
  name: string;
  emoji: string;
  color: string;
  description: string;
  activities: Omit<RoutineActivity, 'id'>[];
  lowEnergyActivities: Omit<RoutineActivity, 'id'>[];
}

export interface ChecklistTemplate {
  id: string;
  kind: 'checklist';
  category: 'Self-care' | 'Cleaning' | 'Work' | 'School' | 'Travel' | 'Organization';
  name: string;
  emoji: string;
  color: string;
  description: string;
  items: string[];
}

export interface BackpackTemplate {
  id: string;
  kind: 'backpack';
  category: 'Work' | 'School' | 'Fitness' | 'Travel' | 'Organization';
  name: string;
  emoji: string;
  color: string;
  backpackCategory: string;
  items: { name: string; quantity: number; required: boolean }[];
}

export type AnyTemplate = RoutineTemplate | ChecklistTemplate | BackpackTemplate;

export const TEMPLATE_CATEGORIES = [
  'All',
  'Morning',
  'Evening',
  'Self-care',
  'Cleaning',
  'Work',
  'School',
  'Fitness',
  'Travel',
  'Organization',
  'Sleep',
  'Wellness',
] as const;

export const TEMPLATE_LIBRARY: AnyTemplate[] = [
  {
    id: 'tpl-morning-gentle',
    kind: 'routine',
    category: 'Morning',
    name: 'Gentle Morning Routine',
    emoji: '🌅',
    color: '#788D70',
    description: 'An approachable start to ease into the day without rushing.',
    activities: [
      { title: 'Drink a glass of water', description: 'Keep it bedside if helpful', durationMinutes: 2 },
      { title: 'Open curtains for natural light', durationMinutes: 1 },
      { title: 'Wash face & brush teeth', durationMinutes: 5 },
      { title: 'Make something warm or eat breakfast', durationMinutes: 12 },
      { title: 'Check Today view for one priority', durationMinutes: 3 },
    ],
    lowEnergyActivities: [
      { title: 'Take 3 sips of water', durationMinutes: 1 },
      { title: 'Brush teeth for 30 seconds', durationMinutes: 2 },
      { title: 'Eat something simple', durationMinutes: 5 },
    ],
  },
  {
    id: 'tpl-evening-winddown',
    kind: 'routine',
    category: 'Evening',
    name: 'Evening Wind Down',
    emoji: '🌙',
    color: '#5D7A99',
    description: 'Soft landing before sleep to quiet your nervous system.',
    activities: [
      { title: 'Dim overhead lights', durationMinutes: 1 },
      { title: 'Put phone on charger away from pillow', durationMinutes: 1 },
      { title: 'Evening hygiene & skincare', durationMinutes: 7 },
      { title: 'Write 2 lines in Journal or Brain Dump', durationMinutes: 4 },
      { title: 'Read or rest quietly', durationMinutes: 15 },
    ],
    lowEnergyActivities: [
      { title: 'Brush teeth', durationMinutes: 2 },
      { title: 'Change into comfortable sleepwear', durationMinutes: 2 },
      { title: 'Turn off bright lights', durationMinutes: 1 },
    ],
  },
  {
    id: 'tpl-sleep-prep',
    kind: 'routine',
    category: 'Sleep',
    name: 'Deep Rest Sleep Prep',
    emoji: '🛌',
    color: '#6475B5',
    description: 'Consistent pre-sleep cues to help your mind settle.',
    activities: [
      { title: 'Set morning alarm & check tomorrow calendar', durationMinutes: 2 },
      { title: 'Sip herbal tea or water', durationMinutes: 5 },
      { title: 'Gentle shoulder & neck stretch', durationMinutes: 4 },
      { title: 'Three slow exhales in bed', durationMinutes: 2 },
    ],
    lowEnergyActivities: [
      { title: 'Set alarm', durationMinutes: 1 },
      { title: 'Three slow breaths in bed', durationMinutes: 2 },
    ],
  },
  {
    id: 'tpl-cleaning-reset',
    kind: 'routine',
    category: 'Cleaning',
    name: '15-Minute Space Reset',
    emoji: '🧺',
    color: '#9B7B56',
    description: 'Quick visible reset without deep-cleaning exhaustion.',
    activities: [
      { title: 'Collect obvious trash in one bag', durationMinutes: 3 },
      { title: 'Bring cups & dishes to the sink', durationMinutes: 3 },
      { title: 'Gather loose laundry into hamper', durationMinutes: 4 },
      { title: 'Clear one flat surface (desk or nightstand)', durationMinutes: 5 },
    ],
    lowEnergyActivities: [
      { title: 'Throw away 3 pieces of trash', durationMinutes: 2 },
      { title: 'Put dishes in the sink', durationMinutes: 2 },
    ],
  },
  {
    id: 'tpl-work-prep',
    kind: 'routine',
    category: 'Work',
    name: 'Calm Work Preparation',
    emoji: '💼',
    color: '#4B8E9C',
    description: 'Everything needed to step into work feeling grounded.',
    activities: [
      { title: 'Check Work Backpack items', durationMinutes: 3 },
      { title: 'Fill water bottle & prepare coffee/tea', durationMinutes: 4 },
      { title: 'Review top 2 tasks for the shift', durationMinutes: 3 },
    ],
    lowEnergyActivities: [
      { title: 'Grab keys, badge, and charger', durationMinutes: 2 },
      { title: 'Take water bottle', durationMinutes: 1 },
    ],
  },
  {
    id: 'tpl-gym-gentle',
    kind: 'routine',
    category: 'Fitness',
    name: 'Consistency-First Gym Routine',
    emoji: '🏃',
    color: '#788D70',
    description: 'Built for showing up lightly rather than burning out.',
    activities: [
      { title: 'Change into workout clothes', durationMinutes: 4 },
      { title: '5-minute gentle warm-up walk', durationMinutes: 5 },
      { title: 'Main movement block (20 min)', durationMinutes: 20 },
      { title: 'Cool down & hydrate', durationMinutes: 5 },
    ],
    lowEnergyActivities: [
      { title: 'Put on comfortable shoes', durationMinutes: 2 },
      { title: 'Walk for 10 minutes', durationMinutes: 10 },
    ],
  },
  {
    id: 'tpl-wellness-pause',
    kind: 'routine',
    category: 'Wellness',
    name: 'Midday Nervous System Reset',
    emoji: '🍵',
    color: '#A8B69B',
    description: 'A gentle afternoon pause to recalibrate energy.',
    activities: [
      { title: 'Step away from screens', durationMinutes: 1 },
      { title: 'Drink water & have a light snack', durationMinutes: 6 },
      { title: 'Look out a window or step outside', durationMinutes: 3 },
    ],
    lowEnergyActivities: [
      { title: 'Unclench shoulders & drink water', durationMinutes: 2 },
    ],
  },
  {
    id: 'tpl-check-selfcare',
    kind: 'checklist',
    category: 'Self-care',
    name: 'Daily Self-Care Essentials',
    emoji: '🌱',
    color: '#788D70',
    description: 'Kind daily basics without pressure.',
    items: [
      'Drank water',
      'Ate something nourishing',
      'Brushed teeth',
      'Stepped into daylight or fresh air',
      'Took prescribed meds / vitamins (if applicable)',
      'Took a quiet screen break',
    ],
  },
  {
    id: 'tpl-check-grocery',
    kind: 'checklist',
    category: 'Organization',
    name: 'Low-Stress Grocery List',
    emoji: '🥖',
    color: '#9B7B56',
    description: 'Easy-to-assemble staples for busy or low-energy weeks.',
    items: [
      'Easy breakfast (oats, yogurt, or toast)',
      'Ready-to-eat fruit (bananas, apples, berries)',
      'Simple protein (eggs, rotisserie chicken, tofu, beans)',
      'Comfort soup or frozen meals for hard days',
      'Tea, coffee, or favorite drink',
    ],
  },
  {
    id: 'tpl-check-cleaning',
    kind: 'checklist',
    category: 'Cleaning',
    name: 'Weekly Apartment Tidy',
    emoji: '🧽',
    color: '#5D7A99',
    description: 'Manageable rooms broken down one at a time.',
    items: [
      'Empty trash bins',
      'Run or fold one load of laundry',
      'Wipe kitchen counter & sink',
      'Refresh bathroom mirror & sink',
      'Change pillowcase or sheets',
    ],
  },
  {
    id: 'tpl-pack-work',
    kind: 'backpack',
    category: 'Work',
    name: 'Work Everyday Backpack',
    emoji: '🎒',
    color: '#4B8E9C',
    backpackCategory: 'Work',
    items: [
      { name: 'Laptop & charger', quantity: 1, required: true },
      { name: 'Keys & ID badge', quantity: 1, required: true },
      { name: 'Water bottle', quantity: 1, required: true },
      { name: 'Headphones', quantity: 1, required: false },
      { name: 'Simple snack', quantity: 1, required: false },
      { name: 'Notebook & pen', quantity: 1, required: false },
    ],
  },
  {
    id: 'tpl-pack-school',
    kind: 'backpack',
    category: 'School',
    name: 'School Day Bag',
    emoji: '📚',
    color: '#6475B5',
    backpackCategory: 'School',
    items: [
      { name: 'Laptop / tablet & charger', quantity: 1, required: true },
      { name: 'Student ID & transit pass', quantity: 1, required: true },
      { name: 'Notebooks & pens', quantity: 2, required: true },
      { name: 'Water bottle', quantity: 1, required: true },
      { name: 'Headphones', quantity: 1, required: false },
    ],
  },
  {
    id: 'tpl-pack-travel',
    kind: 'backpack',
    category: 'Travel',
    name: 'Weekend Overnight Bag',
    emoji: '🧳',
    color: '#856B8A',
    backpackCategory: 'Travel',
    items: [
      { name: 'Outfits & sleepwear', quantity: 2, required: true },
      { name: 'Toothbrush, toothpaste & toiletries', quantity: 1, required: true },
      { name: 'Phone charger & power bank', quantity: 1, required: true },
      { name: 'Medications / essentials pouch', quantity: 1, required: true },
      { name: 'Comfortable socks & layer', quantity: 2, required: false },
    ],
  },
];
