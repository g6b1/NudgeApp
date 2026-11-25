import { CalendarInstance, CalendarItem } from '../types/nudge';

export function toLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return next;
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toLocalDateKey(addDays(parseLocalDateKey(dateKey), days));
}

export function differenceInCalendarDays(laterKey: string, earlierKey: string): number {
  const a = parseLocalDateKey(laterKey);
  const b = parseLocalDateKey(earlierKey);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / (1000 * 60 * 60 * 24));
}

export function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  return addDays(date, -day);
}

export function getMonthGridDates(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startDay);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(gridStart, i));
  }
  return cells;
}

export function formatReadableDate(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime12h(time24?: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const name = firstName.trim() || 'Friend';
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 17) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

function isFirstWeekdayOfMonth(date: Date, targetWeekday: number): boolean {
  return date.getDay() === targetWeekday && date.getDate() <= 7;
}

function isLastWeekdayOfMonth(date: Date, targetWeekday: number): boolean {
  if (date.getDay() !== targetWeekday) return false;
  const nextWeek = addDays(date, 7);
  return nextWeek.getMonth() !== date.getMonth();
}

export function doesCalendarItemOccurOn(item: CalendarItem, dateKey: string): boolean {
  if (dateKey < item.date) return false;

  const override = item.overrides?.[dateKey];
  if (override?.cancelled) return false;

  const rule = item.recurrence;
  if (!rule || rule.frequency === 'none') {
    return item.date === dateKey;
  }

  if (rule.endDate && dateKey > rule.endDate) {
    return false;
  }

  const targetDate = parseLocalDateKey(dateKey);
  const startDate = parseLocalDateKey(item.date);
  const diffDays = differenceInCalendarDays(dateKey, item.date);

  switch (rule.frequency) {
    case 'daily':
      return diffDays >= 0;

    case 'weekly': {
      const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [startDate.getDay()];
      return weekdays.includes(targetDate.getDay());
    }

    case 'biweekly': {
      const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [startDate.getDay()];
      if (!weekdays.includes(targetDate.getDay())) return false;
      const startWeekSunday = getStartOfWeek(startDate);
      const targetWeekSunday = getStartOfWeek(targetDate);
      const weekDiff = Math.round(
        differenceInCalendarDays(toLocalDateKey(targetWeekSunday), toLocalDateKey(startWeekSunday)) / 7
      );
      return weekDiff >= 0 && weekDiff % 2 === 0;
    }

    case 'every-n-weeks': {
      const interval = Math.max(1, rule.intervalWeeks || 1);
      const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [startDate.getDay()];
      if (!weekdays.includes(targetDate.getDay())) return false;
      const startWeekSunday = getStartOfWeek(startDate);
      const targetWeekSunday = getStartOfWeek(targetDate);
      const weekDiff = Math.round(
        differenceInCalendarDays(toLocalDateKey(targetWeekSunday), toLocalDateKey(startWeekSunday)) / 7
      );
      return weekDiff >= 0 && weekDiff % interval === 0;
    }

    case 'monthly-date': {
      const desiredDay = rule.monthDay || startDate.getDate();
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const effectiveDay = Math.min(desiredDay, daysInMonth);
      return targetDate.getDate() === effectiveDay;
    }

    case 'monthly-first-weekday': {
      const wd = rule.targetWeekday ?? startDate.getDay();
      return isFirstWeekdayOfMonth(targetDate, wd);
    }

    case 'monthly-last-weekday': {
      const wd = rule.targetWeekday ?? startDate.getDay();
      return isLastWeekdayOfMonth(targetDate, wd);
    }

    default:
      return item.date === dateKey;
  }
}

export function getCalendarInstancesForDate(items: CalendarItem[], dateKey: string): CalendarInstance[] {
  const instances: CalendarInstance[] = [];
  for (const item of items) {
    if (!doesCalendarItemOccurOn(item, dateKey)) continue;
    const override = item.overrides?.[dateKey];
    instances.push({
      instanceKey: `${item.id}_${dateKey}`,
      item,
      date: dateKey,
      title: override?.title ?? item.title,
      startTime: override?.startTime ?? item.startTime,
      endTime: override?.endTime ?? item.endTime,
      description: override?.description ?? item.description,
      color: override?.color ?? item.color,
      completed: item.completedDates.includes(dateKey),
      isRecurringInstance: Boolean(item.recurrence && item.recurrence.frequency !== 'none'),
      isOverridden: Boolean(override),
    });
  }

  return instances.sort((a, b) => {
    if (!a.startTime && !b.startTime) return a.title.localeCompare(b.title);
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function getLocalWeekDates(referenceDateKey: string): string[] {
  const ref = parseLocalDateKey(referenceDateKey);
  const start = getStartOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => toLocalDateKey(addDays(start, i)));
}
