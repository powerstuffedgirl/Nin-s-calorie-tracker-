import { AppState } from '../types/tracker';
import { createSeedState } from '../data/seedData';

const STORAGE_KEY = 'nins-calorie-tracker-v1';

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const fallback = createSeedState();
    return {
      theme: parsed.theme === 'unicorn' || parsed.theme === 'thunder' || parsed.theme === 'soup'
        ? parsed.theme
        : fallback.theme,
      meals: Array.isArray(parsed.meals) ? parsed.meals : fallback.meals,
      waterLogs: Array.isArray(parsed.waterLogs) ? parsed.waterLogs : fallback.waterLogs,
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
