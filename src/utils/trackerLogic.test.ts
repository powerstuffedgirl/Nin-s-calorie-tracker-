import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyBurnedKcal,
  calculateDailyTotals,
  calculateDailyWaterMl,
  calculateDailyWorkoutBreakdown,
  calculateMacroCalorieSplit,
  calculateNetCalories,
  calculateStreak,
  calculateWeeklyOverview,
  clampBubblePosition,
  detectCalorieMilestone,
  detectWaterMilestone,
  formatWaterLiters,
  getNetCalorieStatus,
  isEditablePastDate,
  normalizeAiMealItems,
  normalizeAiWorkoutResult,
  scaleMealMacros,
  summarizeWeeklyHydration,
  validateExerciseInput,
  validateMealForm,
  validateNormalWalkInput,
  validateProfileForm,
  validateTreadmillInput,
} from './trackerLogic';
import { MealEntry, WaterEntry, WorkoutEntry } from '../types/tracker';
import {
  isStaticPagesHost,
  resolveClientGeminiApiKey,
  shouldUseClientGemini,
} from './nutritionClient';
import { createEmptyTrackerState, createSeedState } from '../data/seedData';

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

test('createEmptyTrackerState clears all meals, water logs, streak, and weekly stats to 0 while keeping profile & theme', () => {
  const seeded = createSeedState(new Date(2026, 4, 15));
  const customized = {
    ...seeded,
    theme: 'copper' as const,
    darkMode: true,
    profile: { ...seeded.profile, currentWeightKg: 61.2, dailyCalorieTarget: 1700 },
  };

  const empty = createEmptyTrackerState(customized);
  const todayKey = '2026-05-15';

  assert.equal(empty.meals.length, 0);
  assert.equal(empty.waterLogs.length, 0);
  assert.equal(empty.celebratedMilestones.length, 0);
  assert.equal(empty.theme, 'copper');
  assert.equal(empty.darkMode, true);
  assert.equal(empty.profile.currentWeightKg, 61.2);
  assert.equal(empty.profile.dailyCalorieTarget, 1700);

  const totals = calculateDailyTotals(empty.meals, todayKey);
  assert.equal(totals.calories, 0);
  assert.equal(totals.protein, 0);
  assert.equal(totals.carbs, 0);
  assert.equal(totals.fat, 0);
  assert.equal(calculateDailyWaterMl(empty.waterLogs, todayKey), 0);
  assert.equal(calculateStreak(empty.meals, empty.waterLogs, todayKey), 0);

  const weekly = calculateWeeklyOverview(empty.meals, empty.waterLogs, todayKey, 1700);
  assert.equal(weekly.avgCalories, 0);
  assert.equal(weekly.avgWaterMl, 0);
  assert.equal(weekly.daysOnTrack, 0);
  assert.equal(weekly.totalBegovaBowls, 0);
});

test('summarizeWeeklyHydration computes goal-met days, averages, and Y-axis ceiling accurately', () => {
  const overview = calculateWeeklyOverview(sampleMeals, sampleWater, '2026-11-25', 1850);
  const summary = summarizeWeeklyHydration(overview.days, 2000);
  assert.equal(summary.loggedDaysCount, 2);
  assert.equal(summary.goalMetDays, 1);
  assert.equal(summary.avgWaterMl, 1625);
  assert.equal(summary.avgDeltaMl, -375);
  assert.equal(summary.yAxisMaxMl, 2500);

  const emptySummary = summarizeWeeklyHydration([], 2200);
  assert.equal(emptySummary.loggedDaysCount, 0);
  assert.equal(emptySummary.goalMetDays, 0);
  assert.equal(emptySummary.avgWaterMl, 0);
  assert.equal(emptySummary.yAxisMaxMl, 3000);
});

test('workout burn totals, net calorie intake, and streak include workout sessions accurately', () => {
  const sampleWorkouts: WorkoutEntry[] = [
    {
      id: 'wk-1',
      date: '2026-11-25',
      time: '09:00',
      kind: 'treadmill',
      name: 'Treadmill Walk',
      caloriesBurned: 180,
      durationMin: 30,
      details: '30 min · 6 km/h · 3 km',
    },
    {
      id: 'wk-2',
      date: '2026-11-25',
      time: '18:00',
      kind: 'exercise',
      name: 'Goblet Squats',
      caloriesBurned: 95,
      durationMin: 15,
      details: '3 × 12 · 10 kg · 15 min',
    },
    {
      id: 'wk-3',
      date: '2026-11-22',
      time: '17:00',
      kind: 'walking',
      name: 'Brisk Walk',
      caloriesBurned: 120,
      durationMin: 25,
      details: '25 min · Brisk walk',
    },
  ];

  assert.equal(calculateDailyBurnedKcal(sampleWorkouts, '2026-11-25'), 275);
  const breakdown = calculateDailyWorkoutBreakdown(sampleWorkouts, '2026-11-25');
  assert.equal(breakdown.totalBurned, 275);
  assert.equal(breakdown.walkingBurned, 180);
  assert.equal(breakdown.exerciseBurned, 95);
  assert.equal(breakdown.totalMinutes, 45);
  assert.equal(breakdown.sessionCount, 2);

  assert.equal(calculateNetCalories(1450, 275), 1175);
  assert.equal(calculateNetCalories(100, 250), -150);

  // Streak extends to 4 days via wk-3 on 2026-11-22
  assert.equal(calculateStreak(sampleMeals, sampleWater, '2026-11-25', sampleWorkouts), 4);

  const overview = calculateWeeklyOverview(sampleMeals, sampleWater, '2026-11-25', 1850, sampleWorkouts);
  assert.equal(overview.days[6].burnedCalories, 275);
  assert.equal(overview.days[6].netCalories, 640 - 275);
  assert.equal(overview.totalBurnedCalories, 395);
});

test('validateTreadmillInput and validateNormalWalkInput validate metrics and auto-derive missing third field', () => {
  const autoDist = validateTreadmillInput({ timeMin: '30', speedKmh: '6', distanceKm: '' });
  assert.equal(autoDist.valid, true);
  assert.equal(autoDist.parsed?.distanceKm, 3);

  const allThree = validateTreadmillInput({ timeMin: '45', speedKmh: '5.6', distanceKm: '4.2' });
  assert.equal(allThree.valid, true);
  assert.equal(allThree.parsed?.timeMin, 45);

  assert.equal(validateTreadmillInput({ timeMin: '30', speedKmh: '', distanceKm: '' }).valid, false);
  assert.equal(validateTreadmillInput({ timeMin: '-5', speedKmh: '6', distanceKm: '3' }).valid, false);

  const walkOk = validateNormalWalkInput({ timeMin: '25', pace: 'brisk' });
  assert.equal(walkOk.valid, true);
  assert.equal(walkOk.parsed?.pace, 'brisk');
  assert.equal(validateNormalWalkInput({ timeMin: '0', pace: 'normal' }).valid, false);
});

test('validateExerciseInput supports weighted strength exercises and timed holds like Plank', () => {
  const weighted = validateExerciseInput({
    exerciseName: 'Goblet Squats',
    trackingMode: 'weighted',
    sets: '3',
    reps: '12',
    weightKg: '12.5',
    timeValue: '12',
    timeUnit: 'min',
  });
  assert.equal(weighted.valid, true);
  assert.equal(weighted.parsed?.weightKg, 12.5);
  assert.equal(weighted.parsed?.details, '3 × 12 · 12.5 kg · 12 min');

  // Weighted exercise requires weight
  assert.equal(
    validateExerciseInput({
      exerciseName: 'Goblet Squats',
      trackingMode: 'weighted',
      sets: '3',
      reps: '12',
      weightKg: '',
      timeValue: '',
      timeUnit: 'min',
    }).valid,
    false
  );

  // Timed exercise (Plank) tracks time in seconds/minutes
  const plank = validateExerciseInput({
    exerciseName: 'Plank',
    trackingMode: 'timed',
    sets: '2',
    reps: '',
    weightKg: '',
    timeValue: '60',
    timeUnit: 'sec',
  });
  assert.equal(plank.valid, true);
  assert.equal(plank.parsed?.durationSec, 120);
  assert.equal(plank.parsed?.details, '2 × 60 sec');
});

test('normalizeAiWorkoutResult sanitizes AI workout payloads and rejects invalid calories', () => {
  const ok = normalizeAiWorkoutResult({
    caloriesBurned: 142.6,
    estimatedDurationMin: 25,
    intensity: 'moderate',
    note: 'Great brisk walk!',
  });
  assert.deepEqual(ok, {
    caloriesBurned: 143,
    estimatedDurationMin: 25,
    intensity: 'moderate',
    note: 'Great brisk walk!',
  });

  assert.equal(normalizeAiWorkoutResult({ caloriesBurned: 0 }), null);
  assert.equal(normalizeAiWorkoutResult(null), null);
});

test('getNetCalorieStatus returns in-range at or below limit and over when exceeding limit', () => {
  assert.equal(getNetCalorieStatus(0, 1850), 'in-range');
  assert.equal(getNetCalorieStatus(1200, 1850), 'in-range');
  assert.equal(getNetCalorieStatus(1850, 1850), 'in-range');
  assert.equal(getNetCalorieStatus(1851, 1850), 'over');
  assert.equal(getNetCalorieStatus(2400, 1850), 'over');
});

test('isEditablePastDate allows only 1 day before today and locks older dates and today', () => {
  const today = '2026-11-26';
  assert.equal(isEditablePastDate('2026-11-25', today), true);
  assert.equal(isEditablePastDate('2026-11-26', today), false);
  assert.equal(isEditablePastDate('2026-11-24', today), false);
  assert.equal(isEditablePastDate('2026-11-20', today), false);
  assert.equal(isEditablePastDate('2026-11-27', today), false);
  assert.equal(isEditablePastDate('2026-11-30', '2026-12-01'), true);
  assert.equal(isEditablePastDate('2026-11-29', '2026-12-01'), false);
});



