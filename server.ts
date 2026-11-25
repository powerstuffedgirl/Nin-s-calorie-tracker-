import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/nutrition/estimate', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const mealTypeHint =
      typeof req.body?.mealType === 'string' ? req.body.mealType.trim() : 'lunch';

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Please describe a meal and portion (for example, "2 slices of burek sa sirom").',
      });
    }

    if (query.length > 400) {
      return res.status(400).json({
        error: 'Please keep your meal description under 400 characters.',
      });
    }

    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'AI nutrition estimation is not configured yet. Please check that GEMINI_API_KEY is set in Settings > Secrets.',
      });
    }

    try {
      const schemaConfig = {
        systemInstruction:
          'You are a registered clinical dietitian and global culinary nutrition specialist (including Bosnian, Balkan, Mediterranean, Asian, Middle Eastern, Latin American, and everyday home-cooked meals). ' +
          'Parse the user input into one or more distinct food/drink items matching the exact portion, weight (g/ml), count, or household measure specified. ' +
          'If a dish contains multiple components mentioned together (e.g., "5 cevapi in half a somun with kajmak and a glass of jogurt"), split them into clear items or keep as one combined dish only when it is a single unified dish (e.g., "1 bowl of Begova corba"). ' +
          'Use accurate USDA / European food composition values so calories closely align with 4*protein + 4*carbs + 9*fat. ' +
          'Always return clean, concise item names in Title Case, explicit metric-friendly portion descriptions (e.g. "1 bowl (~320 ml)", "2 slices (~180 g)"), integer kcal/protein/carbs/fat, and a brief 1-sentence helpful note on how the portion was estimated.',
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
      };

      const promptContents = `Estimate realistic nutrition facts for this meal entry (default meal context: ${mealTypeHint}): "${query}"`;

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
        return res.status(502).json({
          code: 'EMPTY_RESPONSE',
          error: 'Could not read a nutrition estimate from the AI service. Please try again.',
        });
      }

      const parsed = JSON.parse(rawText);
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        return res.status(422).json({
          code: 'NO_ITEMS',
          error: 'No recognizable foods were found. Try describing the dish and portion size.',
        });
      }

      return res.json(parsed);
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string; code?: string } | null;
      const status = typeof errObj?.status === 'number' ? errObj.status : 0;
      const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
      console.error('Gemini nutrition estimation error:', { status, message });

      if (
        status === 403 ||
        status === 401 ||
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403')
      ) {
        return res.status(403).json({
          code: 'AUTH_ERROR',
          error: 'Please check your Gemini API key in Settings > Secrets.',
        });
      }
      if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          code: 'RATE_LIMIT',
          error: 'AI estimation rate limit reached. Please wait a moment and try again.',
        });
      }
      if (status === 404 || message.includes('NOT_FOUND') || message.includes('404')) {
        return res.status(502).json({
          code: 'MODEL_NOT_FOUND',
          error: 'The AI nutrition model is temporarily unavailable. Please try again shortly.',
        });
      }
      if (status === 400 || message.includes('INVALID_ARGUMENT')) {
        return res.status(400).json({
          code: 'INVALID_REQUEST',
          error: 'Could not process that meal query. Please rephrase with a clear dish and portion.',
        });
      }
      return res.status(500).json({
        code: status ? `UPSTREAM_${status}` : 'UPSTREAM_ERROR',
        error: 'Unable to estimate this meal right now. Please try again or use manual entry.',
      });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nin's Calorie Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
