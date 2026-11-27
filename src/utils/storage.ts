import { AppState } from '../types/tracker';
import { createEmptyTrackerState, createSeedState } from '../data/seedData';

const STORAGE_KEY = 'nins-calorie-tracker-v1';

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }
    const parsed = JSON.parse(raw) as Omit<Partial<AppState>, 'theme'> & { theme?: string };
    const fallback = createSeedState();
    const legacyDarkTheme = parsed.theme === 'dark';
    return {
      theme:
        parsed.theme === 'unicorn' ||
        parsed.theme === 'thunder' ||
        parsed.theme === 'soup' ||
        parsed.theme === 'copper'
          ? parsed.theme
          : fallback.theme,
      darkMode:
        typeof parsed.darkMode === 'boolean' ? parsed.darkMode : legacyDarkTheme,
      meals: Array.isArray(parsed.meals) ? parsed.meals : fallback.meals,
      waterLogs: Array.isArray(parsed.waterLogs) ? parsed.waterLogs : fallback.waterLogs,
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
      customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
      profile: parsed.profile ? { ...fallback.profile, ...parsed.profile } : fallback.profile,
      laurelDismissed: typeof parsed.laurelDismissed === 'boolean' ? parsed.laurelDismissed : false,
      laurelMinimized: typeof parsed.laurelMinimized === 'boolean' ? parsed.laurelMinimized : false,
      laurelNoteIndex: typeof parsed.laurelNoteIndex === 'number' ? parsed.laurelNoteIndex : 0,
      celebratedMilestones: Array.isArray(parsed.celebratedMilestones)
        ? parsed.celebratedMilestones
        : [],
    };
  } catch {
    return createSeedState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}

export function resetAppState(): AppState {
  const fresh = createSeedState();
  saveAppState(fresh);
  return fresh;
}

export function clearTrackerDataToZero(currentState: AppState): AppState {
  const empty = createEmptyTrackerState(currentState);
  saveAppState(empty);
  return empty;
}

export const GEMINI_API_KEY_STORAGE_KEY = 'nins-calorie-tracker-gemini-api-key';

export function loadStoredGeminiApiKey(): string {
  try {
    return (window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function saveStoredGeminiApiKey(apiKey: string): void {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
    }
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}

export function clearStoredGeminiApiKey(): void {
  try {
    window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch {
    // Ignore storage errors gracefully
  }
}

