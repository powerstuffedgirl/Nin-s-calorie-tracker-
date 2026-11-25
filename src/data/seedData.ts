import { AppState, LaurelNote, MealEntry, ProfileSettings, WaterEntry } from '../types/tracker';

export const BEGOVA_CORBA_PRESET = {
  name: 'Begova čorba',
  calories: 290,
  protein: 18,
  carbs: 24,
  fat: 13,
  description: 'Traditional Bosnian chicken & okra stew',
};

export const QUICK_BOSNIAN_FAVORITES = [
  { name: 'Burek sa sirom (slice)', calories: 340, protein: 14, carbs: 32, fat: 17 },
  { name: 'Ćevapi & half somun', calories: 460, protein: 28, carbs: 38, fat: 21 },
  { name: 'Kefir & berries bowl', calories: 195, protein: 12, carbs: 24, fat: 5 },
  { name: 'Šopska salata', calories: 180, protein: 7, carbs: 12, fat: 11 },
];

export const LAUREL_NOTES: LaurelNote[] = [
  {
    id: 'l-1',
    category: 'Encouragement',
    text: 'Prijatno, Nin! Every gentle check-in counts—no perfection needed, just showing up for yourself today.',
  },
  {
    id: 'l-2',
    category: 'Health fact',
    text: 'Okra in Begova čorba is packed with soluble fiber and folate, helping keep your energy steady all afternoon.',
  },
  {
    id: 'l-3',
    category: 'Encouragement',
    text: 'Bravo dušo! You are building calm, sustainable habits one warm meal and one glass of water at a time.',
  },
  {
    id: 'l-4',
    category: 'Health fact',
    text: 'Even mild dehydration (around 1–2% of body weight) can subtly dip focus and mood—a quick 250 ml glass helps.',
  },
  {
    id: 'l-5',
    category: 'Encouragement',
    text: 'Your streak is proof of your consistency, Nin. Take a deep breath and celebrate how far you have come.',
  },
  {
    id: 'l-6',
    category: 'Health fact',
    text: 'Pairing protein (20–30 g) with fiber-rich carbs at lunch helps keep afternoon cravings much quieter.',
  },
  {
    id: 'l-7',
    category: 'Encouragement',
    text: 'Whether today feels like pastel crystals, sunlit rainbows, or cozy soup weather—Laurel is cheering for you!',
  },
  {
    id: 'l-8',
    category: 'Health fact',
    text: 'Warm broths like čorba naturally slow down eating pace, giving fullness signals (~20 min) time to catch up.',
  },
];

export const DEFAULT_PROFILE: ProfileSettings = {
  name: 'Nin',
  currentWeightKg: 64.5,
  goalWeightKg: 60.0,
  dailyCalorieTarget: 1850,
  dailyWaterTargetMl: 2200,
  proteinTargetG: 115,
  carbsTargetG: 205,
  fatTargetG: 62,
  celebrationsEnabled: true,
};

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateKey(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysOffset);
  return formatLocalDateKey(d);
}

export function createSeedState(baseDate: Date = new Date()): AppState {
  const d0 = getOffsetDateKey(0, baseDate);
  const d1 = getOffsetDateKey(-1, baseDate);
  const d2 = getOffsetDateKey(-2, baseDate);
  const d3 = getOffsetDateKey(-3, baseDate);
  const d4 = getOffsetDateKey(-4, baseDate);
  const d5 = getOffsetDateKey(-5, baseDate);
  const d6 = getOffsetDateKey(-6, baseDate);

  const meals: MealEntry[] = [
    // Today (d0) — room left to log Begova čorba or dinner & hit target
    {
      id: 'm-today-1',
      date: d0,
      name: 'Oats with figs, walnuts & honey',
      mealType: 'breakfast',
      calories: 385,
      protein: 14,
      carbs: 54,
      fat: 13,
      time: '08:25',
    },
    {
      id: 'm-today-2',
      date: d0,
      name: 'Grilled chicken & Šopska salata',
      mealType: 'lunch',
      calories: 470,
      protein: 42,
      carbs: 22,
      fat: 22,
      time: '12:50',
    },
    {
      id: 'm-today-3',
      date: d0,
      name: 'Kefir & fresh raspberries',
      mealType: 'snacks',
      calories: 195,
      protein: 12,
      carbs: 24,
      fat: 5,
      time: '15:40',
    },

    // Yesterday (d1)
    {
      id: 'm-d1-1',
      date: d1,
      name: 'Soft-boiled eggs & sourdough toast',
      mealType: 'breakfast',
      calories: 390,
      protein: 22,
      carbs: 38,
      fat: 16,
      time: '08:15',
    },
    {
      id: 'm-d1-2',
      date: d1,
      name: 'Begova čorba',
      mealType: 'lunch',
      calories: 290,
      protein: 18,
      carbs: 24,
      fat: 13,
      time: '13:05',
      isBegovaCorba: true,
    },
    {
      id: 'm-d1-3',
      date: d1,
      name: 'Roasted salmon & herbed potatoes',
      mealType: 'dinner',
      calories: 640,
      protein: 44,
      carbs: 56,
      fat: 25,
      time: '19:15',
    },
    {
      id: 'm-d1-4',
      date: d1,
      name: 'Dark chocolate & almonds',
      mealType: 'snacks',
      calories: 260,
      protein: 8,
      carbs: 20,
      fat: 17,
      time: '16:30',
    },

    // d2
    {
      id: 'm-d2-1',
      date: d2,
      name: 'Greek yogurt & homemade granola',
      mealType: 'breakfast',
      calories: 410,
      protein: 20,
      carbs: 52,
      fat: 13,
      time: '08:30',
    },
    {
      id: 'm-d2-2',
      date: d2,
      name: 'Punjene paprike (stuffed peppers)',
      mealType: 'lunch',
      calories: 590,
      protein: 34,
      carbs: 58,
      fat: 22,
      time: '13:10',
    },
    {
      id: 'm-d2-3',
      date: d2,
      name: 'Tomato basil soup & feta toast',
      mealType: 'dinner',
      calories: 520,
      protein: 21,
      carbs: 56,
      fat: 22,
      time: '19:00',
    },
    {
      id: 'm-d2-4',
      date: d2,
      name: 'Apple slices & peanut butter',
      mealType: 'snacks',
      calories: 240,
      protein: 7,
      carbs: 28,
      fat: 12,
      time: '16:15',
    },

    // d3
    {
      id: 'm-d3-1',
      date: d3,
      name: 'Spinach zeljanica (small piece)',
      mealType: 'breakfast',
      calories: 430,
      protein: 18,
      carbs: 44,
      fat: 20,
      time: '08:45',
    },
    {
      id: 'm-d3-2',
      date: d3,
      name: 'Begova čorba',
      mealType: 'lunch',
      calories: 290,
      protein: 18,
      carbs: 24,
      fat: 13,
      time: '12:45',
      isBegovaCorba: true,
    },
    {
      id: 'm-d3-3',
      date: d3,
      name: 'Turkey & roasted veggie quinoa bowl',
      mealType: 'dinner',
      calories: 690,
      protein: 48,
      carbs: 72,
      fat: 21,
      time: '19:20',
    },
    {
      id: 'm-d3-4',
      date: d3,
      name: 'Cottage cheese & peach',
      mealType: 'snacks',
      calories: 220,
      protein: 19,
      carbs: 22,
      fat: 5,
      time: '15:50',
    },

    // d4
    {
      id: 'm-d4-1',
      date: d4,
      name: 'Berry protein smoothie',
      mealType: 'breakfast',
      calories: 360,
      protein: 28,
      carbs: 46,
      fat: 7,
      time: '08:10',
    },
    {
      id: 'm-d4-2',
      date: d4,
      name: 'Ćevapi & half somun with kajmak',
      mealType: 'lunch',
      calories: 610,
      protein: 34,
      carbs: 48,
      fat: 30,
      time: '13:20',
    },
    {
      id: 'm-d4-3',
      date: d4,
      name: 'Lentil stew & crisp greens',
      mealType: 'dinner',
      calories: 560,
      protein: 29,
      carbs: 74,
      fat: 14,
      time: '19:05',
    },
    {
      id: 'm-d4-4',
      date: d4,
      name: 'Walnuts & dried apricots',
      mealType: 'snacks',
      calories: 210,
      protein: 5,
      carbs: 22,
      fat: 12,
      time: '16:10',
    },

    // d5
    {
      id: 'm-d5-1',
      date: d5,
      name: 'Avocado & poached egg toast',
      mealType: 'breakfast',
      calories: 440,
      protein: 19,
      carbs: 39,
      fat: 23,
      time: '09:00',
    },
    {
      id: 'm-d5-2',
      date: d5,
      name: 'Begova čorba',
      mealType: 'lunch',
      calories: 290,
      protein: 18,
      carbs: 24,
      fat: 13,
      time: '13:00',
      isBegovaCorba: true,
    },
    {
      id: 'm-d5-3',
      date: d5,
      name: 'Grilled sea bream & blitva',
      mealType: 'dinner',
      calories: 620,
      protein: 46,
      carbs: 48,
      fat: 24,
      time: '19:30',
    },
    {
      id: 'm-d5-4',
      date: d5,
      name: 'Hummus & cucumber sticks',
      mealType: 'snacks',
      calories: 190,
      protein: 7,
      carbs: 20,
      fat: 9,
      time: '16:00',
    },

    // d6
    {
      id: 'm-d6-1',
      date: d6,
      name: 'Warm porridge with cinnamon & pear',
      mealType: 'breakfast',
      calories: 370,
      protein: 13,
      carbs: 60,
      fat: 9,
      time: '08:30',
    },
    {
      id: 'm-d6-2',
      date: d6,
      name: 'Bosanski lonac (slow vegetable stew)',
      mealType: 'lunch',
      calories: 540,
      protein: 32,
      carbs: 52,
      fat: 21,
      time: '13:15',
    },
    {
      id: 'm-d6-3',
      date: d6,
      name: 'Caprese pasta & basil',
      mealType: 'dinner',
      calories: 680,
      protein: 26,
      carbs: 84,
      fat: 24,
      time: '19:10',
    },
  ];

  const waterLogs: WaterEntry[] = [
    // Today (d0) — 1250 ml logged so far
    { id: 'w-d0-1', date: d0, amountMl: 350, label: 'Morning lemon water', time: '08:00' },
    { id: 'w-d0-2', date: d0, amountMl: 500, label: 'Desk bottle', time: '11:15' },
    { id: 'w-d0-3', date: d0, amountMl: 400, label: 'Afternoon glass', time: '14:30' },
    // Previous days
    { id: 'w-d1-1', date: d1, amountMl: 2250, label: 'Daily hydration', time: '18:00' },
    { id: 'w-d2-1', date: d2, amountMl: 2000, label: 'Daily hydration', time: '18:00' },
    { id: 'w-d3-1', date: d3, amountMl: 2350, label: 'Daily hydration', time: '18:00' },
    { id: 'w-d4-1', date: d4, amountMl: 1850, label: 'Daily hydration', time: '18:00' },
    { id: 'w-d5-1', date: d5, amountMl: 2200, label: 'Daily hydration', time: '18:00' },
    { id: 'w-d6-1', date: d6, amountMl: 1950, label: 'Daily hydration', time: '18:00' },
  ];

  return {
    theme: 'unicorn',
    meals,
    waterLogs,
    profile: { ...DEFAULT_PROFILE },
    laurelDismissed: false,
    laurelMinimized: false,
    laurelNoteIndex: 0,
    celebratedMilestones: [],
  };
}

export function createEmptyTrackerState(
  currentState?: Pick<
    AppState,
    'theme' | 'profile' | 'laurelDismissed' | 'laurelMinimized' | 'laurelNoteIndex'
  >
): AppState {
  return {
    theme: currentState?.theme ?? 'unicorn',
    meals: [],
    waterLogs: [],
    profile: currentState?.profile ? { ...currentState.profile } : { ...DEFAULT_PROFILE },
    laurelDismissed: currentState?.laurelDismissed ?? false,
    laurelMinimized: currentState?.laurelMinimized ?? false,
    laurelNoteIndex: currentState?.laurelNoteIndex ?? 0,
    celebratedMilestones: [],
  };
}
