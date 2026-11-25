import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyTotals,
  calculateDailyWaterMl,
  calculateMacroCalorieSplit,
  calculateStreak,
  calculateWeeklyOverview,
  clampBubblePosition,
  detectCalorieMilestone,
  detectWaterMilestone,
  formatWaterLiters,
  normalizeAiMealItems,
  scaleMealMacros,
  validateMealForm,
  validateProfileForm,
} from './trackerLogic';
import { MealEntry, WaterEntry } from '../types/tracker';
import {
  isStaticPagesHost,
  resolveClientGeminiApiKey,
  shouldUseClientGemini,
} from './nutritionClient';

const sampleMeals: MealEntry[] = [
  {
    id: '1',
    date: '2026-11-25',
    name: 'Oats',
    mealType: 'breakfast',
    calories: 350,
    protein: 12,
    carbs: 55,
    fat: 9,
    time: '08:00',
  },
  {
    id: '2',
    date: '2026-11-25',
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
    id: '3',
    date: '2026-11-24',
    name: 'Dinner bowl',
    mealType: 'dinner',
    calories: 1700,
    protein: 90,
    carbs: 170,
    fat: 60,
    time: '19:00',
  },
];

const sampleWater: WaterEntry[] = [
  { id: 'w1', date: '2026-11-25', amountMl: 500, label: 'Bottle', time: '09:00' },
  { id: 'w2', date: '2026-11-25', amountMl: 750, label: 'Refill', time: '14:00' },
  { id: 'w3', date: '2026-11-23', amountMl: 2000, label: 'All day', time: '18:00' },
];

test('calculateDailyTotals sums calories, macros, and meal buckets accurately', () => {
  const totals = calculateDailyTotals(sampleMeals, '2026-11-25');
  assert.equal(totals.calories, 640);
  assert.equal(totals.protein, 30);
  assert.equal(totals.carbs, 79);
  assert.equal(totals.fat, 22);
  assert.equal(totals.byMealType.breakfast, 350);
  assert.equal(totals.byMealType.lunch, 290);
  assert.equal(totals.byMealType.dinner, 0);
  assert.equal(totals.mealCount, 2);
});

test('calculateMacroCalorieSplit returns 100% total percentage across macros', () => {
  const split = calculateMacroCalorieSplit({ protein: 100, carbs: 150, fat: 50 });
  assert.equal(split.proteinPct + split.carbsPct + split.fatPct, 100);
  assert.equal(split.proteinKcal, 400);
  assert.equal(split.carbsKcal, 600);
  assert.equal(split.fatKcal, 450);
});

test('calculateStreak counts consecutive days across meals and water logs', () => {
  assert.equal(calculateStreak(sampleMeals, sampleWater, '2026-11-25'), 3);
  assert.equal(calculateStreak([], [], '2026-11-25'), 0);
});

test('calculateWeeklyOverview summarizes 7 days including Begova čorba bowls', () => {
  const overview = calculateWeeklyOverview(sampleMeals, sampleWater, '2026-11-25', 1850);
  assert.equal(overview.days.length, 7);
  assert.equal(overview.totalBegovaBowls, 1);
  assert.equal(overview.daysOnTrack, 1);
  assert.equal(overview.days[6].date, '2026-11-25');
  assert.equal(overview.days[6].waterMl, 1250);
});

test('water metric helpers and milestone detection trigger once at 50% and 100%', () => {
  assert.equal(calculateDailyWaterMl(sampleWater, '2026-11-25'), 1250);
  assert.equal(formatWaterLiters(1250), '1.25 L');

  const half = detectWaterMilestone(900, 1150, 2200, '2026-11-25', []);
  assert.ok(half);
  assert.equal(half.id, 'water-50-2026-11-25');

  const alreadyDone = detectWaterMilestone(900, 1150, 2200, '2026-11-25', ['water-50-2026-11-25']);
  assert.equal(alreadyDone, null);

  const full = detectWaterMilestone(1900, 2250, 2200, '2026-11-25', ['water-50-2026-11-25']);
  assert.ok(full);
  assert.equal(full.id, 'water-100-2026-11-25');
});

test('calorie milestone fires when crossing 90% of daily target', () => {
  const hit = detectCalorieMilestone(1400, 1690, 1850, '2026-11-25', []);
  assert.ok(hit);
  assert.equal(hit.id, 'kcal-target-2026-11-25');
});

test('form validators reject invalid inputs and parse valid entries cleanly', () => {
  assert.equal(validateMealForm({ name: '', calories: '200', protein: '', carbs: '', fat: '' }).valid, false);
  assert.equal(validateMealForm({ name: 'Soup', calories: '0', protein: '', carbs: '', fat: '' }).valid, false);
  const mealRes = validateMealForm({ name: '  Begova čorba  ', calories: '290', protein: '18', carbs: '24', fat: '13' });
  assert.equal(mealRes.valid, true);
  assert.equal(mealRes.parsed?.name, 'Begova čorba');

  assert.equal(
    validateProfileForm({
      currentWeightKg: '10',
      goalWeightKg: '60',
      dailyCalorieTarget: '1850',
      dailyWaterTargetMl: '2200',
    }).valid,
    false
  );
  const profRes = validateProfileForm({
    currentWeightKg: '63.4',
    goalWeightKg: '59.5',
    dailyCalorieTarget: '1900',
    dailyWaterTargetMl: '2400',
  });
  assert.equal(profRes.valid, true);
  assert.equal(profRes.parsed?.currentWeightKg, 63.4);
});

test('clampBubblePosition keeps floating Laurel bubble within viewport bounds', () => {
  const clamped = clampBubblePosition(2000, -50, 300, 180, 1440, 900, 12);
  assert.equal(clamped.x, 1128);
  assert.equal(clamped.y, 12);
});

test('normalizeAiMealItems sanitizes multi-item AI nutrition payloads and drops invalid rows', () => {
  const items = normalizeAiMealItems([
    {
      name: '  Burek sa sirom ',
      portion: '2 slices (~180 g)',
      calories: 560.4,
      protein: 22.2,
      carbs: 54.8,
      fat: 28.1,
      confidence: 'high',
    },
    {
      name: '',
      calories: 200,
    },
    {
      name: 'Plain Jogurt',
      portion: '250 ml glass',
      calories: 150,
      protein: 9,
      carbs: 12,
      fat: 7,
      confidence: 'medium',
    },
  ]);

  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Burek sa sirom');
  assert.equal(items[0].calories, 560);
  assert.equal(items[0].carbs, 55);
  assert.equal(items[1].portion, '250 ml glass');
  assert.equal(items[1].confidence, 'medium');
});

test('scaleMealMacros scales calories and macros proportionally for portion adjustments', () => {
  const scaledHalf = scaleMealMacros({ calories: 400, protein: 24, carbs: 40, fat: 16 }, 0.5);
  assert.deepEqual(scaledHalf, { calories: 200, protein: 12, carbs: 20, fat: 8 });

  const scaledLarge = scaleMealMacros({ calories: 300, protein: 20, carbs: 30, fat: 10 }, 1.5);
  assert.deepEqual(scaledLarge, { calories: 450, protein: 30, carbs: 45, fat: 15 });
});

test('resolveClientGeminiApiKey prefers VITE_GEMINI_API_KEY and falls back to stored localStorage key', () => {
  assert.equal(resolveClientGeminiApiKey('env-key-123', 'local-key-456'), 'env-key-123');
  assert.equal(resolveClientGeminiApiKey('', '  local-key-456  '), 'local-key-456');
  assert.equal(resolveClientGeminiApiKey('MY_GEMINI_API_KEY', 'local-key-456'), 'local-key-456');
  assert.equal(resolveClientGeminiApiKey('   ', ''), null);
});

test('shouldUseClientGemini routes github.io or explicit client keys to browser Gemini SDK and keeps localhost on server proxy by default', () => {
  assert.equal(isStaticPagesHost('nin.github.io'), true);
  assert.equal(isStaticPagesHost('localhost'), false);

  assert.equal(
    shouldUseClientGemini({ hostname: 'nin.github.io', envKey: '', storedKey: '' }),
    true
  );
  assert.equal(
    shouldUseClientGemini({ hostname: 'localhost', envKey: '', storedKey: '' }),
    false
  );
  assert.equal(
    shouldUseClientGemini({ hostname: 'localhost', envKey: '', storedKey: 'AIza-user-key' }),
    true
  );
});


