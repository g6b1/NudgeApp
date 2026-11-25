import { MoodType } from '../types/nudge';

export interface MotivationalTip {
  id: string;
  category: 'getting-started' | 'self-care' | 'organization' | 'motivation' | 'rest';
  text: string;
}

export const CALM_SUBTITLES = [
  "Let's take today one step at a time.",
  'Here is your gentle view of today.',
  "There's no need to do everything at once.",
  'Small, steady steps are more than enough.',
  'Move at the pace your day allows.',
];

export const MOTIVATIONAL_TIPS: MotivationalTip[] = [
  { id: 't1', category: 'getting-started', text: "You don't need motivation to begin. Sometimes beginning creates motivation." },
  { id: 't2', category: 'getting-started', text: 'Make the first step almost ridiculously easy.' },
  { id: 't3', category: 'motivation', text: "You don't have to finish everything you start." },
  { id: 't4', category: 'organization', text: 'Picking up one thing is still cleaning.' },
  { id: 't5', category: 'self-care', text: 'Eating something simple is still taking care of yourself.' },
  { id: 't6', category: 'motivation', text: "You are allowed to make today's version of a task smaller." },
  { id: 't7', category: 'getting-started', text: 'Starting for 30 seconds is still starting.' },
  { id: 't8', category: 'rest', text: 'Resting is different from giving up.' },
  { id: 't-garden-1', category: 'motivation', text: 'A little secret: tap the Nudge logo five times to discover your own Tiny Garden.' },
  { id: 't9', category: 'motivation', text: "You don't have to catch up on everything you missed." },
  { id: 't10', category: 'getting-started', text: 'Focus on the next action, not the entire process.' },
  { id: 't11', category: 'motivation', text: 'A little progress is still progress.' },
  { id: 't12', category: 'getting-started', text: "You can stop after the first step if that's all you have today." },
  { id: 't13', category: 'self-care', text: 'A sip of water counts as a win.' },
  { id: 't14', category: 'self-care', text: 'Washing your face instead of a full shower is still caring for yourself.' },
  { id: 't15', category: 'organization', text: 'Clear just the corner in front of you, not the whole room.' },
  { id: 't16', category: 'rest', text: 'Quiet recovery prepares you for tomorrow better than forcing exhaustion today.' },
  { id: 't17', category: 'getting-started', text: 'Set a 10-second timer just to open the tab or stand up.' },
  { id: 't-garden-2', category: 'getting-started', text: "Feeling curious? Try tapping the Nudge logo five times. There's a little surprise waiting." },
  { id: 't18', category: 'organization', text: 'Putting things in a basket to sort later is a valid system.' },
  { id: 't19', category: 'self-care', text: 'Warm tea, toast, or fruit is a real meal when energy is low.' },
  { id: 't20', category: 'motivation', text: 'Done imperfectly beats abandoned perfection every time.' },
  { id: 't21', category: 'rest', text: 'Your worth is not measured by a checklist.' },
  { id: 't22', category: 'getting-started', text: 'If a task feels heavy, shrink it until your shoulders drop.' },
  { id: 't23', category: 'organization', text: 'One trash bag around the room for two minutes makes a visible difference.' },
  { id: 't24', category: 'self-care', text: 'Fresh air for sixty seconds can gently reset a heavy afternoon.' },
  { id: 't25', category: 'motivation', text: 'Consistency means returning gently, not never pausing.' },
  { id: 't26', category: 'rest', text: 'Closing your eyes for five minutes without scrolling is real rest.' },
  { id: 't-garden-3', category: 'rest', text: 'Your little corner of Nudge has a secret. Tap the logo five times to find it.' },
  { id: 't27', category: 'getting-started', text: 'Write down the messy version first—you can tidy it later.' },
  { id: 't28', category: 'organization', text: 'Packing one essential item tonight saves decision energy tomorrow morning.' },
  { id: 't29', category: 'self-care', text: 'Changing into clean, comfortable clothes is a gentle reset.' },
  { id: 't30', category: 'motivation', text: 'Half a routine on a hard day is a full victory.' },
  { id: 't31', category: 'rest', text: 'Low-energy days deserve low-energy expectations.' },
  { id: 't32', category: 'getting-started', text: 'Stand up and stretch your arms—momentum often starts in the body.' },
  { id: 't33', category: 'organization', text: 'Keep the things you use most within arm’s reach.' },
  { id: 't34', category: 'self-care', text: 'Notice what would feel 5% kinder to yourself right now.' },
  { id: 't35', category: 'motivation', text: 'You only have to handle the hour you are in.' },
  { id: 't-garden-4', category: 'motivation', text: 'Five taps on the Nudge logo might just grow something lovely.' },
  { id: 't36', category: 'rest', text: 'Stopping before burnout is a skill, not a shortcoming.' },
  { id: 't37', category: 'getting-started', text: 'Name just one thing you want to exist on the other side of today.' },
  { id: 't38', category: 'organization', text: 'Empty one surface—a nightstand, a desk edge, or the sink.' },
  { id: 't39', category: 'self-care', text: 'Brushing your teeth for 30 seconds is still better than not at all.' },
  { id: 't40', category: 'motivation', text: 'Progress rarely looks dramatic while it is happening.' },
  { id: 't41', category: 'rest', text: 'Let tonight be soft. Tomorrow can hold its own plans.' },
  { id: 't42', category: 'getting-started', text: 'Choose the smallest possible starting line.' },
  { id: 't43', category: 'organization', text: 'If everything feels urgent, pick the one thing that relieves the most pressure.' },
  { id: 't44', category: 'self-care', text: 'Unclench your jaw and drop your shoulders for one slow breath.' },
  { id: 't-garden-5', category: 'self-care', text: "Psst... there's a Tiny Garden hiding behind the Nudge logo. Tap it five times." },
  { id: 't45', category: 'motivation', text: 'Every small action you take for yourself counts.' },
];

export interface JustOneThingPrompt {
  id: string;
  originalGoal: string;
  tinyStep: string;
}

export const JUST_ONE_THING_PROMPTS: JustOneThingPrompt[] = [
  { id: 'j1', originalGoal: 'Clean your room', tinyStep: 'Pick up one piece of clothing.' },
  { id: 'j2', originalGoal: 'Eat breakfast', tinyStep: 'Take your first bite of something simple.' },
  { id: 'j3', originalGoal: 'Take a shower', tinyStep: 'Walk to the bathroom and turn on the light.' },
  { id: 'j4', originalGoal: 'Hydrate', tinyStep: 'Take three sips of water.' },
  { id: 'j5', originalGoal: 'Do the dishes', tinyStep: 'Wash or rinse just one cup or plate.' },
  { id: 'j6', originalGoal: 'Answer messages', tinyStep: 'Open one thread and write a single sentence.' },
  { id: 'j7', originalGoal: 'Get fresh air', tinyStep: 'Open a window or step outside for 30 seconds.' },
  { id: 'j8', originalGoal: 'Tidy your desk', tinyStep: 'Throw away one piece of trash.' },
  { id: 'j9', originalGoal: 'Take care of hygiene', tinyStep: 'Splash cool water on your face or brush for 30 seconds.' },
  { id: 'j10', originalGoal: 'Start a work task', tinyStep: 'Open the document and read the first line.' },
  { id: 'j11', originalGoal: 'Prepare for tomorrow', tinyStep: 'Set your keys or bag near the door.' },
  { id: 'j12', originalGoal: 'Rest gently', tinyStep: 'Put your phone face-down for two quiet minutes.' },
];

export interface NudgeMeOption {
  id: string;
  needLabel: string;
  suggestionTitle: string;
  suggestionBody: string;
  actionLabel: string;
  actionType: 'just-one-thing' | 'brain-dump' | 'bare-minimum' | 'countdown' | 'out-of-bed';
}

export const NUDGE_ME_OPTIONS: NudgeMeOption[] = [
  {
    id: 'nm-energy',
    needLabel: 'I have no energy',
    suggestionTitle: 'Switch to gentle essentials',
    suggestionBody: 'Drink a few sips of water and pick just one comfort step from your Bare Minimum list. Nothing else is required right now.',
    actionLabel: 'Open Bare Minimum Day',
    actionType: 'bare-minimum',
  },
  {
    id: 'nm-overwhelmed',
    needLabel: 'My brain feels overwhelmed',
    suggestionTitle: 'Empty your head onto paper',
    suggestionBody: 'Put everything swirling around in Brain Dump for 60 seconds without organizing it yet. Getting it out of your head lightens the load.',
    actionLabel: 'Open Brain Dump',
    actionType: 'brain-dump',
  },
  {
    id: 'nm-difficult',
    needLabel: "I'm having a difficult day",
    suggestionTitle: 'One tiny kindness first',
    suggestionBody: 'On heavy days, getting out of bed or drinking something warm is a real accomplishment. Take a breath—you do not have to catch up today.',
    actionLabel: 'Open Get Me Out of Bed',
    actionType: 'out-of-bed',
  },
  {
    id: 'nm-done',
    needLabel: 'I need to get something done',
    suggestionTitle: 'Shrink the starting line',
    suggestionBody: 'Use the 10-Second Start to cross the threshold into just the first tiny step—you only have to commit to starting.',
    actionLabel: 'Start Countdown',
    actionType: 'countdown',
  },
  {
    id: 'nm-tiny',
    needLabel: 'I need a tiny starting point',
    suggestionTitle: 'Do just one micro-action',
    suggestionBody: 'Instead of looking at the whole mountain, complete one tiny action that takes under 30 seconds.',
    actionLabel: 'Try Just One Thing',
    actionType: 'just-one-thing',
  },
  {
    id: 'nm-thoughts',
    needLabel: 'I need to organize my thoughts',
    suggestionTitle: 'Capture now, sort gently later',
    suggestionBody: 'Write a quick Brain Dump entry. You can keep it as a note or turn any single line into a gentle task when ready.',
    actionLabel: 'Open Brain Dump',
    actionType: 'brain-dump',
  },
];

export const EASY_MEAL_SUGGESTIONS = [
  { title: 'Toast with butter, peanut butter, or cheese', note: 'Under 2 minutes, warm and steady.' },
  { title: 'A handful of crackers, fruit, or nuts', note: 'Zero cooking required.' },
  { title: 'Yogurt cup with a spoonful of honey or oats', note: 'Gentle and easy to grab.' },
  { title: 'Instant soup, broth, or cup noodles', note: 'Warm and comforting with minimal dishes.' },
  { title: 'Banana or apple with nut butter', note: 'Quick energy without decisions.' },
  { title: 'Microwave scrambled egg or cheese quesadilla', note: 'Simple protein in 3 minutes.' },
  { title: 'Glass of milk, smoothie, or warm tea with a snack', note: 'Counts as nourishing yourself.' },
];

export const HYGIENE_ROUTINES = {
  minimum: [
    'Splash warm or cool water on your face',
    'Brush teeth (even 30 seconds counts)',
    'Put on clean deodorant or lip balm',
    'Change into fresh, comfortable clothes',
  ],
  full: [
    'Take a warm shower or bath',
    'Wash face with gentle cleanser',
    'Brush and floss teeth',
    'Apply moisturizer or lip balm',
    'Brush hair and put on fresh clothes',
  ],
};

export const JOURNAL_MOODS: { id: MoodType; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '🌿' },
  { id: 'grateful', label: 'Grateful', emoji: '💛' },
  { id: 'neutral', label: 'Neutral', emoji: '😌' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'anxious', label: 'Anxious', emoji: '🌀' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌧️' },
  { id: 'sad', label: 'Sad', emoji: '🫧' },
];

export const JOURNAL_PROMPTS = [
  'What is one small thing that felt okay today?',
  'What is taking up space in my mind right now?',
  'What would make tomorrow feel 5% lighter?',
  'One gentle thing I did for myself today:',
  'What do I need permission to let go of tonight?',
  'Who or what brought a quiet moment of warmth today?',
];

export function buildLocalTaskBreakdown(taskTitle: string): string[] {
  const clean = taskTitle.trim() || 'this task';
  return [
    `Take one slow breath and look at where "${clean}" begins.`,
    `Set up just the first tool or space you need for "${clean}".`,
    `Do the smallest 30-second piece of "${clean}".`,
    'Pause and check how your energy feels—stop or do one more tiny step.',
  ];
}
