import {
  DailyTotals,
  ExerciseTrackingMode,
  MealEntry,
  MealType,
  MilestoneEvent,
  ProfileSettings,
  WalkPace,
  WaterEntry,
  WeeklyDayStat,
  WeeklyOverview,
  WorkoutEntry,
} from '../types/tracker';
import { formatLocalDateKey } from '../data/seedData';

export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
];

export function calculateDailyTotals(meals: MealEntry[], dateKey: string): DailyTotals {
  const byMealType: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0,
  };

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let mealCount = 0;

  for (const meal of meals) {
    if (meal.date !== dateKey) continue;
    calories += Math.max(0, Math.round(meal.calories));
    protein += Math.max(0, Math.round(meal.protein));
    carbs += Math.max(0, Math.round(meal.carbs));
    fat += Math.max(0, Math.round(meal.fat));
    byMealType[meal.mealType] += Math.max(0, Math.round(meal.calories));
    mealCount += 1;
  }

  return { calories, protein, carbs, fat, byMealType, mealCount };
}

export function calculateMacroCalorieSplit(totals: Pick<DailyTotals, 'protein' | 'carbs' | 'fat'>) {
  const proteinKcal = totals.protein * 4;
  const carbsKcal = totals.carbs * 4;
  const fatKcal = totals.fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  if (totalMacroKcal <= 0) {
    return {
      proteinPct: 0,
      carbsPct: 0,
      fatPct: 0,
      proteinKcal: 0,
      carbsKcal: 0,
      fatKcal: 0,
    };
  }

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return {
    proteinPct,
    carbsPct,
    fatPct,
    proteinKcal,
    carbsKcal,
    fatKcal,
  };
}

export function calculateDailyWaterMl(waterLogs: WaterEntry[], dateKey: string): number {
  let total = 0;
  for (const entry of waterLogs) {
    if (entry.date === dateKey) {
      total += Math.max(0, Math.round(entry.amountMl));
    }
  }
  return total;
}

export function formatWaterLiters(ml: number): string {
  return `${(Math.max(0, ml) / 1000).toFixed(2)} L`;
}

export function formatWaterMetric(ml: number): string {
  const safe = Math.max(0, Math.round(ml));
  if (safe >= 1000) {
    return `${(safe / 1000).toFixed(2)} L (${safe.toLocaleString('en-US')} ml)`;
  }
  return `${safe.toLocaleString('en-US')} ml`;
}

export function calculateProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.round((current / target) * 100));
}

export function parseDateKeyToLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const d = parseDateKeyToLocal(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalDateKey(d);
}

/**
 * Only the date exactly 1 day before today (yesterday) is editable as a past date.
 * Once midnight passes and that date becomes 2+ days old, it is no longer editable.
 */
export function isEditablePastDate(dateKey: string, todayKey: string): boolean {
  return dateKey === shiftDateKey(todayKey, -1);
}

/**
 * Returns 'over' when net calorie intake exceeds the daily calorie limit,
 * or 'in-range' when it is at or below the daily limit.
 */
export function getNetCalorieStatus(
  netCalories: number,
  dailyCalorieTarget: number
): 'in-range' | 'over' {
  return netCalories > dailyCalorieTarget ? 'over' : 'in-range';
}

/**
 * Computes consecutive daily logging streak ending on todayKey (or yesterdayKey
 * if the user hasn't logged anything yet today). A day counts if at least 1 meal,
 * 1 water entry, or 1 workout was logged on that date.
 */
export function calculateStreak(
  meals: MealEntry[],
  waterLogs: WaterEntry[],
  todayKey: string,
  workouts: WorkoutEntry[] = []
): number {
  const activeDates = new Set<string>();
  for (const m of meals) activeDates.add(m.date);
  for (const w of waterLogs) activeDates.add(w.date);
  for (const wk of workouts) activeDates.add(wk.date);

  if (activeDates.size === 0) return 0;

  let cursor = todayKey;
  if (!activeDates.has(cursor)) {
    const yesterday = shiftDateKey(todayKey, -1);
    if (!activeDates.has(yesterday)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function calculateDailyBurnedKcal(workouts: WorkoutEntry[], dateKey: string): number {
  let total = 0;
  for (const entry of workouts) {
    if (entry.date === dateKey) {
      total += Math.max(0, Math.round(entry.caloriesBurned));
    }
  }
  return total;
}

export function calculateDailyWorkoutBreakdown(workouts: WorkoutEntry[], dateKey: string) {
  let totalBurned = 0;
  let walkingBurned = 0;
  let exerciseBurned = 0;
  let totalMinutes = 0;
  let sessionCount = 0;

  for (const entry of workouts) {
    if (entry.date !== dateKey) continue;
    const kcal = Math.max(0, Math.round(entry.caloriesBurned));
    const mins = Math.max(0, Math.round(entry.durationMin));
    totalBurned += kcal;
    if (entry.kind === 'treadmill' || entry.kind === 'walking') {
      walkingBurned += kcal;
    } else {
      exerciseBurned += kcal;
    }
    totalMinutes += mins;
    sessionCount += 1;
  }

  return { totalBurned, walkingBurned, exerciseBurned, totalMinutes, sessionCount };
}

export function calculateNetCalories(consumedKcal: number, burnedKcal: number): number {
  return Math.round(consumedKcal) - Math.max(0, Math.round(burnedKcal));
}

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function calculateWeeklyOverview(
  meals: MealEntry[],
  waterLogs: WaterEntry[],
  todayKey: string,
  calorieTarget: number,
  workouts: WorkoutEntry[] = []
): WeeklyOverview {
  const days: WeeklyDayStat[] = [];
  let sumCalories = 0;
  let sumBurnedCalories = 0;
  let sumWaterMl = 0;
  let totalBegovaBowls = 0;
  let daysOnTrack = 0;
  let loggedDaysCount = 0;

  for (let offset = -6; offset <= 0; offset += 1) {
    const dateKey = shiftDateKey(todayKey, offset);
    const localDate = parseDateKeyToLocal(dateKey);
    const totals = calculateDailyTotals(meals, dateKey);
    const burnedCalories = calculateDailyBurnedKcal(workouts, dateKey);
    const netCalories = calculateNetCalories(totals.calories, burnedCalories);
    const waterMl = calculateDailyWaterMl(waterLogs, dateKey);
    const begovaCount = meals.filter(
      (m) =>
        m.date === dateKey &&
        (m.isBegovaCorba || m.name.toLowerCase().includes('begova'))
    ).length;

    const minTrack = Math.round(calorieTarget * 0.75);
    const maxTrack = Math.round(calorieTarget * 1.12);
    const onTrack = totals.calories >= minTrack && totals.calories <= maxTrack;

    if (totals.calories > 0) {
      sumCalories += totals.calories;
      loggedDaysCount += 1;
    }
    sumBurnedCalories += burnedCalories;
    sumWaterMl += waterMl;
    totalBegovaBowls += begovaCount;
    if (onTrack) daysOnTrack += 1;

    days.push({
      date: dateKey,
      dayShort: SHORT_WEEKDAYS[localDate.getDay()],
      dayNumber: localDate.getDate(),
      calories: totals.calories,
      burnedCalories,
      netCalories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      waterMl,
      begovaCount,
      onTrack,
    });
  }

  return {
    days,
    avgCalories: loggedDaysCount > 0 ? Math.round(sumCalories / loggedDaysCount) : 0,
    avgBurnedCalories: Math.round(sumBurnedCalories / 7),
    totalBurnedCalories: sumBurnedCalories,
    avgWaterMl: Math.round(sumWaterMl / 7),
    totalBegovaBowls,
    daysOnTrack,
  };
}

export interface WeeklyHydrationSummary {
  loggedDaysCount: number;
  goalMetDays: number;
  avgWaterMl: number;
  avgDeltaMl: number;
  yAxisMaxMl: number;
}

export function summarizeWeeklyHydration(
  days: WeeklyDayStat[],
  dailyWaterTargetMl: number
): WeeklyHydrationSummary {
  const safeTarget = Math.max(500, Math.round(dailyWaterTargetMl));
  let loggedDaysCount = 0;
  let goalMetDays = 0;
  let sumWaterMl = 0;
  let maxDayMl = 0;

  for (const day of days) {
    const ml = Math.max(0, Math.round(day.waterMl));
    if (ml > 0) {
      loggedDaysCount += 1;
      sumWaterMl += ml;
    }
    if (ml >= safeTarget) {
      goalMetDays += 1;
    }
    if (ml > maxDayMl) {
      maxDayMl = ml;
    }
  }

  const avgWaterMl = loggedDaysCount > 0 ? Math.round(sumWaterMl / loggedDaysCount) : 0;
  const avgDeltaMl = avgWaterMl - safeTarget;
  const peak = Math.max(safeTarget * 1.15, maxDayMl, 1000);
  const yAxisMaxMl = Math.ceil(peak / 500) * 500;

  return {
    loggedDaysCount,
    goalMetDays,
    avgWaterMl,
    avgDeltaMl,
    yAxisMaxMl,
  };
}

export function detectCalorieMilestone(
  prevCalories: number,
  nextCalories: number,
  target: number,
  dateKey: string,
  alreadyCelebrated: string[]
): MilestoneEvent | null {
  if (target <= 0) return null;
  const targetId = `kcal-target-${dateKey}`;
  const threshold = Math.round(target * 0.9);
  if (prevCalories < threshold && nextCalories >= threshold && !alreadyCelebrated.includes(targetId)) {
    return {
      id: targetId,
      title: 'Daily calorie goal reached',
      subtitle: `You crossed ${nextCalories.toLocaleString('en-US')} kcal toward your ${target.toLocaleString('en-US')} kcal target.`,
    };
  }
  return null;
}

export function detectWaterMilestone(
  prevMl: number,
  nextMl: number,
  targetMl: number,
  dateKey: string,
  alreadyCelebrated: string[]
): MilestoneEvent | null {
  if (targetMl <= 0) return null;
  const fullId = `water-100-${dateKey}`;
  if (prevMl < targetMl && nextMl >= targetMl && !alreadyCelebrated.includes(fullId)) {
    return {
      id: fullId,
      title: 'Hydration goal complete!',
      subtitle: `Wonderful job, Nin — you reached ${formatWaterLiters(nextMl)} today.`,
    };
  }
  const halfId = `water-50-${dateKey}`;
  const halfTarget = Math.round(targetMl * 0.5);
  if (prevMl < halfTarget && nextMl >= halfTarget && !alreadyCelebrated.includes(halfId)) {
    return {
      id: halfId,
      title: 'Halfway hydrated',
      subtitle: `${formatWaterLiters(nextMl)} down — steady sips keep your energy bright.`,
    };
  }
  return null;
}

export interface MealFormValidationInput {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export function validateMealForm(input: MealFormValidationInput): {
  valid: boolean;
  error?: string;
  parsed?: { name: string; calories: number; protein: number; carbs: number; fat: number };
} {
  const name = input.name.trim();
  if (!name) {
    return { valid: false, error: 'Please enter a meal or food name.' };
  }
  const calories = Number(input.calories);
  if (!input.calories.trim() || Number.isNaN(calories) || calories <= 0 || calories > 5000) {
    return { valid: false, error: 'Enter calories between 1 and 5,000 kcal.' };
  }
  const protein = input.protein.trim() === '' ? 0 : Number(input.protein);
  const carbs = input.carbs.trim() === '' ? 0 : Number(input.carbs);
  const fat = input.fat.trim() === '' ? 0 : Number(input.fat);

  if (
    Number.isNaN(protein) ||
    Number.isNaN(carbs) ||
    Number.isNaN(fat) ||
    protein < 0 ||
    carbs < 0 ||
    fat < 0
  ) {
    return { valid: false, error: 'Macros must be 0 or greater.' };
  }

  return {
    valid: true,
    parsed: {
      name,
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    },
  };
}

export function validateProfileForm(profile: {
  currentWeightKg: string;
  goalWeightKg: string;
  dailyCalorieTarget: string;
  dailyWaterTargetMl: string;
}): {
  valid: boolean;
  error?: string;
  parsed?: Pick<
    ProfileSettings,
    'currentWeightKg' | 'goalWeightKg' | 'dailyCalorieTarget' | 'dailyWaterTargetMl' | 'proteinTargetG' | 'carbsTargetG' | 'fatTargetG'
  >;
} {
  const currentWeightKg = Number(profile.currentWeightKg);
  const goalWeightKg = Number(profile.goalWeightKg);
  const dailyCalorieTarget = Number(profile.dailyCalorieTarget);
  const dailyWaterTargetMl = Number(profile.dailyWaterTargetMl);

  if (Number.isNaN(currentWeightKg) || currentWeightKg < 25 || currentWeightKg > 300) {
    return { valid: false, error: 'Current weight must be between 25 and 300 kg.' };
  }
  if (Number.isNaN(goalWeightKg) || goalWeightKg < 25 || goalWeightKg > 300) {
    return { valid: false, error: 'Goal weight must be between 25 and 300 kg.' };
  }
  if (Number.isNaN(dailyCalorieTarget) || dailyCalorieTarget < 900 || dailyCalorieTarget > 6000) {
    return { valid: false, error: 'Daily calorie target must be between 900 and 6,000 kcal.' };
  }
  if (Number.isNaN(dailyWaterTargetMl) || dailyWaterTargetMl < 500 || dailyWaterTargetMl > 6000) {
    return { valid: false, error: 'Daily water target must be between 500 and 6,000 ml.' };
  }

  // Balanced macro targets derived from calorie target (25% P, 45% C, 30% F)
  const proteinTargetG = Math.round((dailyCalorieTarget * 0.25) / 4);
  const carbsTargetG = Math.round((dailyCalorieTarget * 0.45) / 4);
  const fatTargetG = Math.round((dailyCalorieTarget * 0.3) / 9);

  return {
    valid: true,
    parsed: {
      currentWeightKg: Math.round(currentWeightKg * 10) / 10,
      goalWeightKg: Math.round(goalWeightKg * 10) / 10,
      dailyCalorieTarget: Math.round(dailyCalorieTarget),
      dailyWaterTargetMl: Math.round(dailyWaterTargetMl),
      proteinTargetG,
      carbsTargetG,
      fatTargetG,
    },
  };
}

export function clampBubblePosition(
  x: number,
  y: number,
  bubbleWidth: number,
  bubbleHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  margin: number = 12
): { x: number; y: number } {
  const maxX = Math.max(margin, viewportWidth - bubbleWidth - margin);
  const maxY = Math.max(margin, viewportHeight - bubbleHeight - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY),
  };
}

export interface RawAiMealItem {
  name?: unknown;
  portion?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  confidence?: unknown;
}

export interface NormalizedAiMealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium';
}

export function normalizeAiMealItems(rawItems: unknown): NormalizedAiMealItem[] {
  if (!Array.isArray(rawItems)) return [];
  const normalized: NormalizedAiMealItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as RawAiMealItem;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const calories = Math.round(Number(raw.calories));
    if (!name || Number.isNaN(calories) || calories <= 0) continue;

    const protein = Math.max(0, Math.round(Number(raw.protein) || 0));
    const carbs = Math.max(0, Math.round(Number(raw.carbs) || 0));
    const fat = Math.max(0, Math.round(Number(raw.fat) || 0));
    const portion =
      typeof raw.portion === 'string' && raw.portion.trim()
        ? raw.portion.trim()
        : '1 serving';
    const confidence = raw.confidence === 'medium' ? 'medium' : 'high';

    normalized.push({
      name,
      portion,
      calories: Math.min(5000, calories),
      protein,
      carbs,
      fat,
      confidence,
    });
  }

  return normalized;
}

export function scaleMealMacros(
  meal: Pick<MealEntry, 'calories' | 'protein' | 'carbs' | 'fat'>,
  multiplier: number
): Pick<MealEntry, 'calories' | 'protein' | 'carbs' | 'fat'> {
  const safeMultiplier = Math.max(0.25, Math.min(4, multiplier));
  return {
    calories: Math.max(1, Math.round(meal.calories * safeMultiplier)),
    protein: Math.max(0, Math.round(meal.protein * safeMultiplier)),
    carbs: Math.max(0, Math.round(meal.carbs * safeMultiplier)),
    fat: Math.max(0, Math.round(meal.fat * safeMultiplier)),
  };
}

export interface ParsedTreadmillInput {
  timeMin: number;
  speedKmh: number;
  distanceKm: number;
}

export function validateTreadmillInput(input: {
  timeMin: string;
  speedKmh: string;
  distanceKm: string;
}): { valid: boolean; error?: string; parsed?: ParsedTreadmillInput } {
  const hasTime = input.timeMin.trim() !== '';
  const hasSpeed = input.speedKmh.trim() !== '';
  const hasDist = input.distanceKm.trim() !== '';

  const providedCount = Number(hasTime) + Number(hasSpeed) + Number(hasDist);
  if (providedCount < 2) {
    return {
      valid: false,
      error: 'Enter time, speed, and distance (or any two and the third will calculate automatically).',
    };
  }

  let timeMin = hasTime ? Number(input.timeMin) : NaN;
  let speedKmh = hasSpeed ? Number(input.speedKmh) : NaN;
  let distanceKm = hasDist ? Number(input.distanceKm) : NaN;

  if ((hasTime && (Number.isNaN(timeMin) || timeMin <= 0)) ||
      (hasSpeed && (Number.isNaN(speedKmh) || speedKmh <= 0)) ||
      (hasDist && (Number.isNaN(distanceKm) || distanceKm <= 0))) {
    return { valid: false, error: 'Time, speed, and distance must all be positive numbers.' };
  }

  if (!hasDist && hasTime && hasSpeed) {
    distanceKm = (speedKmh * timeMin) / 60;
  } else if (!hasTime && hasDist && hasSpeed) {
    timeMin = (distanceKm / speedKmh) * 60;
  } else if (!hasSpeed && hasDist && hasTime) {
    speedKmh = distanceKm / (timeMin / 60);
  }

  if (timeMin < 1 || timeMin > 360) {
    return { valid: false, error: 'Treadmill time must be between 1 and 360 minutes.' };
  }
  if (speedKmh < 0.5 || speedKmh > 25) {
    return { valid: false, error: 'Treadmill speed must be between 0.5 and 25 km/h.' };
  }
  if (distanceKm < 0.05 || distanceKm > 60) {
    return { valid: false, error: 'Treadmill distance must be between 0.05 and 60 km.' };
  }

  return {
    valid: true,
    parsed: {
      timeMin: Math.round(timeMin * 10) / 10,
      speedKmh: Math.round(speedKmh * 10) / 10,
      distanceKm: Math.round(distanceKm * 100) / 100,
    },
  };
}

export function validateNormalWalkInput(input: {
  timeMin: string;
  pace: WalkPace;
}): { valid: boolean; error?: string; parsed?: { timeMin: number; pace: WalkPace } } {
  const timeMin = Number(input.timeMin);
  if (!input.timeMin.trim() || Number.isNaN(timeMin) || timeMin < 1 || timeMin > 360) {
    return { valid: false, error: 'Enter walking time between 1 and 360 minutes.' };
  }
  const pace: WalkPace = input.pace === 'brisk' ? 'brisk' : 'normal';
  return {
    valid: true,
    parsed: {
      timeMin: Math.round(timeMin * 10) / 10,
      pace,
    },
  };
}

export interface ParsedExerciseInput {
  exerciseName: string;
  trackingMode: ExerciseTrackingMode;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationMin?: number;
  durationSec?: number;
  details: string;
}

export function validateExerciseInput(input: {
  exerciseName: string;
  trackingMode: ExerciseTrackingMode;
  sets: string;
  reps: string;
  weightKg: string;
  timeValue: string;
  timeUnit: 'min' | 'sec';
}): { valid: boolean; error?: string; parsed?: ParsedExerciseInput } {
  const exerciseName = input.exerciseName.trim();
  if (!exerciseName) {
    return { valid: false, error: 'Please select or add an exercise first.' };
  }

  if (input.trackingMode === 'timed') {
    const rawTime = Number(input.timeValue);
    if (!input.timeValue.trim() || Number.isNaN(rawTime) || rawTime <= 0) {
      return { valid: false, error: `Enter how long you did ${exerciseName}.` };
    }
    const sets = input.sets.trim() === '' ? 1 : Number(input.sets);
    if (Number.isNaN(sets) || sets < 1 || sets > 20) {
      return { valid: false, error: 'Sets/rounds must be between 1 and 20.' };
    }
    const roundedSets = Math.round(sets);
    if (input.timeUnit === 'sec') {
      if (rawTime < 5 || rawTime > 7200) {
        return { valid: false, error: 'Duration must be between 5 and 7,200 seconds.' };
      }
      const totalSec = Math.round(rawTime * roundedSets);
      const durationMin = Math.max(0.25, Math.round((totalSec / 60) * 100) / 100);
      const details =
        roundedSets > 1
          ? `${roundedSets} × ${Math.round(rawTime)} sec`
          : `${Math.round(rawTime)} sec`;
      return {
        valid: true,
        parsed: {
          exerciseName,
          trackingMode: 'timed',
          sets: roundedSets,
          durationSec: totalSec,
          durationMin,
          details,
        },
      };
    }

    if (rawTime < 0.5 || rawTime > 240) {
      return { valid: false, error: 'Duration must be between 0.5 and 240 minutes.' };
    }
    const totalMin = Math.round(rawTime * roundedSets * 10) / 10;
    const details =
      roundedSets > 1
        ? `${roundedSets} × ${Math.round(rawTime * 10) / 10} min`
        : `${Math.round(rawTime * 10) / 10} min`;
    return {
      valid: true,
      parsed: {
        exerciseName,
        trackingMode: 'timed',
        sets: roundedSets,
        durationMin: totalMin,
        durationSec: Math.round(totalMin * 60),
        details,
      },
    };
  }

  const sets = Number(input.sets);
  const reps = Number(input.reps);
  if (!input.sets.trim() || Number.isNaN(sets) || sets < 1 || sets > 30) {
    return { valid: false, error: 'Enter sets between 1 and 30.' };
  }
  if (!input.reps.trim() || Number.isNaN(reps) || reps < 1 || reps > 500) {
    return { valid: false, error: 'Enter reps between 1 and 500.' };
  }

  let weightKg: number | undefined;
  if (input.trackingMode === 'weighted') {
    const parsedWeight = Number(input.weightKg);
    if (!input.weightKg.trim() || Number.isNaN(parsedWeight) || parsedWeight < 0.5 || parsedWeight > 500) {
      return { valid: false, error: 'Enter weight between 0.5 and 500 kg.' };
    }
    weightKg = Math.round(parsedWeight * 10) / 10;
  }

  let durationMin: number | undefined;
  if (input.timeValue.trim() !== '') {
    const parsedTime = Number(input.timeValue);
    if (Number.isNaN(parsedTime) || parsedTime < 0.5 || parsedTime > 240) {
      return { valid: false, error: 'Optional exercise time must be between 0.5 and 240 minutes.' };
    }
    durationMin = Math.round(parsedTime * 10) / 10;
  }

  const roundedSets = Math.round(sets);
  const roundedReps = Math.round(reps);
  const parts = [`${roundedSets} × ${roundedReps}`];
  if (weightKg !== undefined) parts.push(`${weightKg} kg`);
  if (durationMin !== undefined) parts.push(`${durationMin} min`);

  return {
    valid: true,
    parsed: {
      exerciseName,
      trackingMode: input.trackingMode,
      sets: roundedSets,
      reps: roundedReps,
      weightKg,
      durationMin,
      details: parts.join(' · '),
    },
  };
}

export interface NormalizedAiWorkoutResult {
  caloriesBurned: number;
  estimatedDurationMin: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  note: string;
}

export function normalizeAiWorkoutResult(raw: unknown): NormalizedAiWorkoutResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as {
    caloriesBurned?: unknown;
    estimatedDurationMin?: unknown;
    intensity?: unknown;
    note?: unknown;
  };
  const caloriesBurned = Math.round(Number(obj.caloriesBurned));
  if (Number.isNaN(caloriesBurned) || caloriesBurned <= 0) return null;

  const rawDuration = Number(obj.estimatedDurationMin);
  const estimatedDurationMin =
    !Number.isNaN(rawDuration) && rawDuration > 0 ? Math.min(360, Math.max(1, Math.round(rawDuration))) : 10;

  const intensity =
    obj.intensity === 'light' || obj.intensity === 'vigorous' ? obj.intensity : 'moderate';

  const note = typeof obj.note === 'string' ? obj.note.trim() : '';

  return {
    caloriesBurned: Math.min(3500, caloriesBurned),
    estimatedDurationMin,
    intensity,
    note,
  };
}

