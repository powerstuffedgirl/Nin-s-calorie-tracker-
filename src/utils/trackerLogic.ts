import {
  DailyTotals,
  MealEntry,
  MealType,
  MilestoneEvent,
  ProfileSettings,
  WaterEntry,
  WeeklyDayStat,
  WeeklyOverview,
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
 * Computes consecutive daily logging streak ending on todayKey (or yesterdayKey
 * if the user hasn't logged anything yet today). A day counts if at least 1 meal
 * or 1 water entry was logged on that date.
 */
export function calculateStreak(
  meals: MealEntry[],
  waterLogs: WaterEntry[],
  todayKey: string
): number {
  const activeDates = new Set<string>();
  for (const m of meals) activeDates.add(m.date);
  for (const w of waterLogs) activeDates.add(w.date);

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

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function calculateWeeklyOverview(
  meals: MealEntry[],
  waterLogs: WaterEntry[],
  todayKey: string,
  calorieTarget: number
): WeeklyOverview {
  const days: WeeklyDayStat[] = [];
  let sumCalories = 0;
  let sumWaterMl = 0;
  let totalBegovaBowls = 0;
  let daysOnTrack = 0;
  let loggedDaysCount = 0;

  for (let offset = -6; offset <= 0; offset += 1) {
    const dateKey = shiftDateKey(todayKey, offset);
    const localDate = parseDateKeyToLocal(dateKey);
    const totals = calculateDailyTotals(meals, dateKey);
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
    sumWaterMl += waterMl;
    totalBegovaBowls += begovaCount;
    if (onTrack) daysOnTrack += 1;

    days.push({
      date: dateKey,
      dayShort: SHORT_WEEKDAYS[localDate.getDay()],
      dayNumber: localDate.getDate(),
      calories: totals.calories,
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

