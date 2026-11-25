import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { MealType } from '../types/tracker';
import { loadStoredGeminiApiKey } from './storage';
import { NormalizedAiMealItem, normalizeAiMealItems } from './trackerLogic';

export interface NutritionEstimateResult {
  items: NormalizedAiMealItem[];
  note: string;
}

export class NutritionEstimateError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'NutritionEstimateError';
    this.code = code;
  }
}

const NUTRITION_SYSTEM_INSTRUCTION =
  'You are a registered clinical dietitian and global culinary nutrition specialist (including Bosnian, Balkan, Mediterranean, Asian, Middle Eastern, Latin American, and everyday home-cooked meals). ' +
  'Parse the user input into one or more distinct food/drink items matching the exact portion, weight (g/ml), count, or household measure specified. ' +
  'If a dish contains multiple components mentioned together (e.g., "5 cevapi in half a somun with kajmak and a glass of jogurt"), split them into clear items or keep as one combined dish only when it is a single unified dish (e.g., "1 bowl of Begova corba"). ' +
  'Use accurate USDA / European food composition values so calories closely align with 4*protein + 4*carbs + 9*fat. ' +
  'Always return clean, concise item names in Title Case, explicit metric-friendly portion descriptions (e.g. "1 bowl (~320 ml)", "2 slices (~180 g)"), integer kcal/protein/carbs/fat, and a brief 1-sentence helpful note on how the portion was estimated.';

const NUTRITION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: 'Parsed food items with accurate portion-based nutrition estimates.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Clean dish or food name.',
          },
          portion: {
            type: Type.STRING,
            description: 'Normalized portion description with approximate metric weight or volume.',
          },
          calories: {
            type: Type.INTEGER,
            description: 'Total kilocalories for this portion.',
          },
          protein: {
            type: Type.INTEGER,
            description: 'Protein in grams.',
          },
          carbs: {
            type: Type.INTEGER,
            description: 'Total carbohydrates in grams.',
          },
          fat: {
            type: Type.INTEGER,
            description: 'Total fat in grams.',
          },
          confidence: {
            type: Type.STRING,
            description: 'Either "high" or "medium".',
          },
        },
        required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
      },
    },
    note: {
      type: Type.STRING,
      description: 'One short friendly sentence explaining the portion assumption.',
    },
  },
  required: ['items', 'note'],
};

function sanitizeApiKey(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'MY_GEMINI_API_KEY') return null;
  return trimmed;
}

/**
 * Resolves the client-side Gemini API key, prioritizing build-time
 * VITE_GEMINI_API_KEY and falling back to the user-provided key in localStorage.
 */
export function resolveClientGeminiApiKey(
  envKey?: string | null,
  storedKey?: string | null
): string | null {
  return sanitizeApiKey(envKey) ?? sanitizeApiKey(storedKey);
}

/**
 * Detects static GitHub Pages hosting where no Express /api/* backend exists.
 */
export function isStaticPagesHost(hostname: string): boolean {
  return hostname.toLowerCase().endsWith('.github.io');
}

/**
 * Determines whether the browser should call Gemini directly (on GitHub Pages
 * or whenever a client key is explicitly configured via env or localStorage)
 * rather than using the full-stack /api/nutrition/estimate proxy.
 */
export function shouldUseClientGemini(options: {
  hostname: string;
  envKey?: string | null;
  storedKey?: string | null;
}): boolean {
  if (isStaticPagesHost(options.hostname)) {
    return true;
  }
  return Boolean(resolveClientGeminiApiKey(options.envKey, options.storedKey));
}

export function getBuildTimeGeminiApiKey(): string | null {
  return sanitizeApiKey(
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)
      : undefined
  );
}

async function estimateNutritionDirect(
  query: string,
  mealType: MealType,
  apiKey: string
): Promise<NutritionEstimateResult> {
  const ai = new GoogleGenAI({ apiKey });
  const schemaConfig = {
    systemInstruction: NUTRITION_SYSTEM_INSTRUCTION,
    responseMimeType: 'application/json',
    responseSchema: NUTRITION_RESPONSE_SCHEMA,
  };
  const promptContents = `Estimate realistic nutrition facts for this meal entry (default meal context: ${mealType}): "${query}"`;

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptContents,
        config: {
          ...schemaConfig,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    } catch (primaryErr: unknown) {
      const status = (primaryErr as { status?: number } | null)?.status;
      if (status === 503 || status === 500 || status === 404) {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: promptContents,
          config: schemaConfig,
        });
      } else {
        throw primaryErr;
      }
    }

    const rawText = (response.text ?? '')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    if (!rawText) {
      throw new NutritionEstimateError(
        'Could not read a nutrition estimate from Gemini. Please try again.',
        'EMPTY_RESPONSE'
      );
    }

    const parsed = JSON.parse(rawText) as { items?: unknown; note?: unknown };
    const items = normalizeAiMealItems(parsed?.items);
    if (items.length === 0) {
      throw new NutritionEstimateError(
        'No recognizable foods were found. Try describing the dish and portion size.',
        'NO_ITEMS'
      );
    }

    return {
      items,
      note: typeof parsed?.note === 'string' ? parsed.note : '',
    };
  } catch (err: unknown) {
    if (err instanceof NutritionEstimateError) {
      throw err;
    }
    const errObj = err as { status?: number; message?: string } | null;
    const status = typeof errObj?.status === 'number' ? errObj.status : 0;
    const message = err instanceof Error ? err.message : String(err ?? '');

    if (
      status === 401 ||
      status === 403 ||
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('API key not valid')
    ) {
      throw new NutritionEstimateError(
        'Your Gemini API key was rejected. Please double-check or update it in the Profile tab.',
        'AUTH_ERROR'
      );
    }
    if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new NutritionEstimateError(
        'Gemini rate limit reached. Please wait a moment and try again.',
        'RATE_LIMIT'
      );
    }
    if (status === 400 || message.includes('INVALID_ARGUMENT')) {
      throw new NutritionEstimateError(
        'Could not process that meal query. Please rephrase with a clear dish and portion.',
        'INVALID_REQUEST'
      );
    }
    throw new NutritionEstimateError(
      'Unable to reach Gemini right now. Please check your connection or use manual entry.',
      'UPSTREAM_ERROR'
    );
  }
}

export async function estimateNutrition(
  query: string,
  mealType: MealType
): Promise<NutritionEstimateResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    throw new NutritionEstimateError(
      'Please describe a meal and portion (for example, "2 slices of burek sa sirom").',
      'INVALID_INPUT'
    );
  }
  if (trimmed.length > 400) {
    throw new NutritionEstimateError(
      'Please keep your meal description under 400 characters.',
      'INVALID_INPUT'
    );
  }

  const envKey = getBuildTimeGeminiApiKey();
  const storedKey = loadStoredGeminiApiKey();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (shouldUseClientGemini({ hostname, envKey, storedKey })) {
    const clientApiKey = resolveClientGeminiApiKey(envKey, storedKey);
    if (!clientApiKey) {
      throw new NutritionEstimateError(
        'Add your Gemini API key in the Profile tab to enable AI meal estimation on GitHub Pages.',
        'MISSING_KEY'
      );
    }
    return estimateNutritionDirect(trimmed, mealType, clientApiKey);
  }

  // Full-stack mode (AI Studio / Express server proxy)
  let response: Response;
  try {
    response = await fetch('/api/nutrition/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, mealType }),
    });
  } catch {
    throw new NutritionEstimateError(
      'Network issue reaching the nutrition estimator. If hosted statically, add your Gemini API key in Profile.',
      'MISSING_KEY'
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 404 || response.status === 405 || !isJson) {
      throw new NutritionEstimateError(
        'Add your Gemini API key in the Profile tab to enable AI meal estimation on static hosting.',
        'MISSING_KEY'
      );
    }
    const message =
      (payload && typeof payload.error === 'string' && payload.error) ||
      'Could not estimate that meal right now. Please try again.';
    throw new NutritionEstimateError(message, payload?.code ?? 'SERVER_ERROR');
  }

  const items = normalizeAiMealItems(payload?.items);
  if (items.length === 0) {
    throw new NutritionEstimateError(
      'Could not recognize foods in that entry. Try adding a portion size.',
      'NO_ITEMS'
    );
  }

  return {
    items,
    note: typeof payload?.note === 'string' ? payload.note : '',
  };
}
