import { CompletionRecord } from '../types/nudge';
import { addDays, getStartOfWeek, parseLocalDateKey, toLocalDateKey } from '../utils/dateUtils';

export interface PositiveActionsSummary {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalCount: number;
  byCategory: { category: string; count: number }[];
  weeklyBars: { dateKey: string; label: string; count: number; isToday: boolean }[];
  recentDays: { dateKey: string; count: number; items: CompletionRecord[] }[];
  encouragementMessage: string;
}

export function computePositiveActionsSummary(
  completionLog: CompletionRecord[],
  referenceDate: Date = new Date()
): PositiveActionsSummary {
  const todayKey = toLocalDateKey(referenceDate);
  const weekStart = getStartOfWeek(referenceDate);
  const weekStartKey = toLocalDateKey(weekStart);
  const monthPrefix = todayKey.slice(0, 7); // YYYY-MM

  // Deduplicate defensively and never count future actions
  const seenKeys = new Set<string>();
  const validRecords: CompletionRecord[] = [];
  for (const record of completionLog) {
    if (!record.date || record.date > todayKey) continue;
    const dedupeKey = `${record.date}__${record.sourceType}__${record.sourceId}__${record.itemId}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    validRecords.push(record);
  }

  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  const categoryMap = new Map<string, number>();
  const byDateMap = new Map<string, CompletionRecord[]>();

  for (const r of validRecords) {
    if (r.date === todayKey) todayCount++;
    if (r.date >= weekStartKey && r.date <= todayKey) weekCount++;
    if (r.date.startsWith(monthPrefix)) monthCount++;

    const cat = r.category || 'Everyday';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);

    const existing = byDateMap.get(r.date) || [];
    existing.push(r);
    byDateMap.set(r.date, existing);
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const weeklyBars = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const key = toLocalDateKey(d);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const count = key <= todayKey ? (byDateMap.get(key)?.length || 0) : 0;
    return {
      dateKey: key,
      label,
      count,
      isToday: key === todayKey,
    };
  });

  const recentDays = Array.from(byDateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14)
    .map(([dateKey, items]) => ({
      dateKey,
      count: items.length,
      items: items.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    }));

  let encouragementMessage = 'Every small action counts.';
  if (weekCount === 0 && todayCount === 0) {
    encouragementMessage =
      "This week was quieter. That's okay. You can start with one small thing today.";
  } else if (todayCount > 0 && todayCount <= 3) {
    encouragementMessage = `${todayCount} small ${todayCount === 1 ? 'thing' : 'things'} you did for yourself today.`;
  } else if (weekCount > 0) {
    encouragementMessage = `You took ${weekCount} positive ${weekCount === 1 ? 'action' : 'actions'} this week.`;
  }

  return {
    todayCount,
    weekCount,
    monthCount,
    totalCount: validRecords.length,
    byCategory,
    weeklyBars,
    recentDays,
    encouragementMessage,
  };
}

export function formatDayLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Today';
  const d = parseLocalDateKey(dateKey);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
