export type ThemeId = 'unicorn' | 'thunder' | 'soup' | 'copper';

export type PageId = 'home' | 'water' | 'stats' | 'profile';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string; // HH:mm
  portion?: string;
  aiEstimated?: boolean;
  isBegovaCorba?: boolean;
}

export interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  label: string;
  time: string; // HH:mm
}

export interface ProfileSettings {
  name: string;
  currentWeightKg: number;
  goalWeightKg: number;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  celebrationsEnabled: boolean;
}

export interface LaurelNote {
  id: string;
  category: 'Encouragement' | 'Health fact';
  text: string;
}

export interface MilestoneEvent {
  id: string;
  title: string;
  subtitle: string;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  byMealType: Record<MealType, number>;
  mealCount: number;
}

export interface WeeklyDayStat {
  date: string;
  dayShort: string;
  dayNumber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  begovaCount: number;
  onTrack: boolean;
}

export interface WeeklyOverview {
  days: WeeklyDayStat[];
  avgCalories: number;
  avgWaterMl: number;
  totalBegovaBowls: number;
  daysOnTrack: number;
}

export interface AppState {
  theme: ThemeId;
  darkMode: boolean;
  meals: MealEntry[];
  waterLogs: WaterEntry[];
  profile: ProfileSettings;
  laurelDismissed: boolean;
  laurelMinimized: boolean;
  laurelNoteIndex: number;
  celebratedMilestones: string[];
}
