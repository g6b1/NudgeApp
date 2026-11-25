import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getAIClient(): GoogleGenAI | null {
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

function sanitizeString(value: unknown, maxLen = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/ai/status', (_req, res) => {
    const client = getAIClient();
    res.json({ configured: Boolean(client), provider: 'Google Gemini' });
  });

  app.post('/api/ai/routine', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet. You can still build or edit routines manually or from templates.',
      });
    }

    const prompt = sanitizeString(req.body?.prompt, 1000);
    const energyLevel = sanitizeString(req.body?.energyLevel, 40) || 'normal';
    if (!prompt) {
      return res.status(400).json({ error: 'Please describe the routine you want to create.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create a supportive, realistic routine for: "${prompt}". Current user energy level: ${energyLevel}. Also provide a shorter low-energy version of the same routine.`,
        config: {
          systemInstruction:
            'You are Nudge AI, a gentle, practical everyday life assistant. Design routines with humane, approachable steps, realistic durations in minutes, and zero guilt. Return valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              emoji: { type: Type.STRING },
              description: { type: Type.STRING },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER },
                  },
                  required: ['title', 'durationMinutes'],
                },
              },
              lowEnergyActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER },
                  },
                  required: ['title', 'durationMinutes'],
                },
              },
            },
            required: ['name', 'emoji', 'description', 'activities', 'lowEnergyActivities'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format. Please try phrasing your request again.' });
      }
      return res.json({ routine: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/checklist', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet. You can create checklists manually or from templates.',
      });
    }

    const prompt = sanitizeString(req.body?.prompt, 1000);
    if (!prompt) {
      return res.status(400).json({ error: 'Please describe the checklist you want to create.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create a practical, concise checklist for: "${prompt}".`,
        config: {
          systemInstruction:
            'You are Nudge AI, a calm and practical everyday assistant. Create clear, bite-sized checklist items. Return valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              emoji: { type: Type.STRING },
              description: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['name', 'emoji', 'items'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format. Please try again.' });
      }
      return res.json({ checklist: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/backpack', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet. You can build a packing list manually or from templates.',
      });
    }

    const prompt = sanitizeString(req.body?.prompt, 1000);
    if (!prompt) {
      return res.status(400).json({ error: 'Please describe what you are packing for.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create a reusable packing list (backpack) for: "${prompt}".`,
        config: {
          systemInstruction:
            'You are Nudge AI. Generate practical packing items with sensible quantities and mark truly essential items as required: true. Return valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              emoji: { type: Type.STRING },
              category: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    required: { type: Type.BOOLEAN },
                  },
                  required: ['name', 'quantity', 'required'],
                },
              },
            },
            required: ['name', 'emoji', 'category', 'items'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format. Please try again.' });
      }
      return res.json({ backpack: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/breakdown', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet.',
      });
    }

    const task = sanitizeString(req.body?.task, 500);
    const energyLevel = sanitizeString(req.body?.energyLevel, 40) || 'low';
    if (!task) {
      return res.status(400).json({ error: 'Please provide a task to make easier.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Break this task into 4 to 6 tiny, low-friction steps so someone with ${energyLevel} energy can start gently: "${task}".`,
        config: {
          systemInstruction:
            'You are Nudge AI, a gentle assistant for people who feel overwhelmed or low on energy. Make the very first step almost ridiculously easy. No guilt, no preaching.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              encouragement: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['encouragement', 'steps'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format.' });
      }
      return res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/brain-dump', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet. You can still organize thoughts manually in Brain Dump.',
      });
    }

    const text = sanitizeString(req.body?.text, 4000);
    const todayDate = sanitizeString(req.body?.todayDate, 20);
    if (!text) {
      return res.status(400).json({ error: 'Please enter some thoughts to sort.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Today's local date is ${todayDate || 'today'}. Parse this unstructured Brain Dump into actionable, optional suggestions:\n\n${text}`,
        config: {
          systemInstruction:
            'You are Nudge AI. Extract clear items from unstructured thoughts. Categorize each as one of: task, reminder, appointment, goal, idea, routine, shopping. Keep titles concise and supportive.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    kind: {
                      type: Type.STRING,
                      enum: ['task', 'reminder', 'appointment', 'goal', 'idea', 'routine', 'shopping'],
                    },
                    suggestedDate: { type: Type.STRING },
                    suggestedTime: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['title', 'kind'],
                },
              },
            },
            required: ['summary', 'suggestions'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format.' });
      }
      return res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/daily-plan', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet.',
      });
    }

    const targetDate = sanitizeString(req.body?.targetDate, 20);
    const energyLevel = sanitizeString(req.body?.energyLevel, 40) || 'normal';
    const preferences = sanitizeString(req.body?.preferences, 800);
    const existingEvents = Array.isArray(req.body?.existingEvents)
      ? req.body.existingEvents.slice(0, 30)
      : [];

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Help me plan ${targetDate || 'tomorrow'}. Energy level: ${energyLevel}. Preferences: ${preferences || 'balanced with gentle breaks and free time'}. Existing scheduled events: ${JSON.stringify(existingEvents)}.`,
        config: {
          systemInstruction:
            'You are Nudge AI. Propose a realistic, spacious schedule around existing events. Always leave generous breathing room, breaks, meals, and downtime. Return blocks as JSON for user approval.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['task', 'event'] },
                    description: { type: Type.STRING },
                  },
                  required: ['title', 'startTime', 'endTime', 'type'],
                },
              },
            },
            required: ['overview', 'blocks'],
          },
        },
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed) {
        return res.status(502).json({ error: 'AI returned an unreadable format.' });
      }
      return res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'Nudge AI is not configured on the server yet. All planning, routines, calendar, and self-care tools remain fully usable offline.',
      });
    }

    const message = sanitizeString(req.body?.message, 2500);
    const context = sanitizeString(req.body?.context, 1500);
    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .slice(-10)
          .map((item: { role?: unknown; text?: unknown }) => ({
            role: item.role === 'model' ? 'model' : 'user',
            parts: [{ text: sanitizeString(item.text, 1500) }],
          }))
      : [];

    if (!message) {
      return res.status(400).json({ error: 'Please write a message for Nudge AI.' });
    }

    try {
      const chat = ai.chats.create({
        model: MODEL_NAME,
        history,
        config: {
          systemInstruction: `You are Nudge AI, a warm, concise, practical, and nonjudgmental everyday assistant. Your philosophy is "A little push toward a better day" — productivity never comes at the expense of well-being. Offer small, realistic next steps. Never lecture or shame. Do not claim to be a medical or therapeutic provider. ${context ? `Optional context shared with consent: ${context}` : ''}`,
        },
      });

      const result = await chat.sendMessage({ message });
      return res.json({ reply: result.text ?? '' });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unable to reach Gemini API.';
      return res.status(502).json({ error: errMsg });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nudge server listening on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start Nudge server:', err);
  process.exit(1);
});
