/** NHL week representation */
export interface Week {
  /** Week number in the season */
  weekNumber: number;

  /** Week start date (Monday, YYYY-MM-DD) */
  startDate: string;

  /** Week end date (Sunday, YYYY-MM-DD) */
  endDate: string;

  /** Display label (e.g., "Week 12: Jan 13 - Jan 19") */
  label: string;
}

/** Days of the week for display */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Get all dates in a week as array of YYYY-MM-DD strings */
export function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
}

/** Format a date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Parse a YYYY-MM-DD string to Date */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Get the Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust for Sunday (0) being end of week
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Get the Sunday of the week containing the given date */
export function getWeekEnd(date: Date): Date {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/** Format a week date range for display (e.g., "Jan 13 - Jan 19") */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/** Create a Week object from a start date */
export function createWeek(startDate: string, weekNumber: number): Week {
  const dates = getWeekDates(startDate);
  const endDate = dates[6];

  return {
    weekNumber,
    startDate,
    endDate,
    label: `Week ${weekNumber}: ${formatWeekRange(startDate, endDate)}`,
  };
}

/** Get the weekday index (0 = Mon, 6 = Sun) for a date */
export function getWeekdayIndex(dateStr: string): number {
  const date = parseDate(dateStr);
  const day = date.getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return day === 0 ? 6 : day - 1;
}

/** Get the weekday name for a date */
export function getWeekdayName(dateStr: string): Weekday {
  return WEEKDAYS[getWeekdayIndex(dateStr)];
}
