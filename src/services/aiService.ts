export interface AIStatusResponse {
  configured: boolean;
  provider: string;
}

export interface AIRoutineDraft {
  name: string;
  emoji: string;
  description: string;
  activities: { title: string; description?: string; durationMinutes: number }[];
  lowEnergyActivities: { title: string; description?: string; durationMinutes: number }[];
}

export interface AIChecklistDraft {
  name: string;
  emoji: string;
  description?: string;
  items: string[];
}

export interface AIBackpackDraft {
  name: string;
  emoji: string;
  category: string;
  items: { name: string; quantity: number; required: boolean }[];
}

export interface AIBrainDumpSuggestion {
  title: string;
  kind: 'task' | 'reminder' | 'appointment' | 'goal' | 'idea' | 'routine' | 'shopping';
  suggestedDate?: string;
  suggestedTime?: string;
  notes?: string;
}

export interface AIDailyPlanBlock {
  title: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event';
  description?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchAIStatus(): Promise<AIStatusResponse> {
  const res = await fetch('/api/ai/status');
  if (!res.ok) {
    return { configured: false, provider: 'Google Gemini' };
  }
  return res.json();
}

export async function generateAIRoutine(prompt: string, energyLevel: string): Promise<AIRoutineDraft> {
  const data = await postJson<{ routine: AIRoutineDraft }>('/api/ai/routine', { prompt, energyLevel });
  return data.routine;
}

export async function generateAIChecklist(prompt: string): Promise<AIChecklistDraft> {
  const data = await postJson<{ checklist: AIChecklistDraft }>('/api/ai/checklist', { prompt });
  return data.checklist;
}

export async function generateAIBackpack(prompt: string): Promise<AIBackpackDraft> {
  const data = await postJson<{ backpack: AIBackpackDraft }>('/api/ai/backpack', { prompt });
  return data.backpack;
}

export async function generateTaskBreakdown(
  task: string,
  energyLevel: string
): Promise<{ encouragement: string; steps: string[] }> {
  return postJson('/api/ai/breakdown', { task, energyLevel });
}

export async function parseBrainDumpWithAI(
  text: string,
  todayDate: string
): Promise<{ summary: string; suggestions: AIBrainDumpSuggestion[] }> {
  return postJson('/api/ai/brain-dump', { text, todayDate });
}

export async function generateDailyPlanWithAI(params: {
  targetDate: string;
  energyLevel: string;
  preferences: string;
  existingEvents: { title: string; startTime?: string; endTime?: string }[];
}): Promise<{ overview: string; blocks: AIDailyPlanBlock[] }> {
  return postJson('/api/ai/daily-plan', params);
}

export async function sendAIChatMessage(params: {
  message: string;
  history: { role: 'user' | 'model'; text: string }[];
  context?: string;
}): Promise<{ reply: string }> {
  return postJson('/api/ai/chat', params);
}
