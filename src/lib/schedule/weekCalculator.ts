import { Week, createWeek, formatDate, parseDate, getWeekStart } from '@/models';

/** NHL season start date (approximate) */
const NHL_SEASON_START = '2024-10-07'; // Monday of first week

/** NHL season end date (approximate) */
const NHL_SEASON_END = '2025-04-17';

/** Get the NHL week number for a given date */
export function getNHLWeekNumber(date: Date): number {
  const seasonStart = parseDate(NHL_SEASON_START);
  const weekStart = getWeekStart(date);

  const diffTime = weekStart.getTime() - seasonStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return Math.max(1, weekNumber);
}

/** Get the Week object for the current date */
export function getCurrentWeek(): Week {
  const today = new Date();
  const monday = getWeekStart(today);
  const startDate = formatDate(monday);
  const weekNumber = getNHLWeekNumber(today);

  return createWeek(startDate, weekNumber);
}

/** Get all weeks in the NHL season */
export function getSeasonWeeks(): Week[] {
  const weeks: Week[] = [];
  const seasonStart = parseDate(NHL_SEASON_START);
  const seasonEnd = parseDate(NHL_SEASON_END);

  const currentDate = new Date(seasonStart);
  let weekNumber = 1;

  while (currentDate <= seasonEnd) {
    weeks.push(createWeek(formatDate(currentDate), weekNumber));
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;
  }

  return weeks;
}

/** Get the previous week */
export function getPreviousWeek(week: Week): Week {
  const currentStart = parseDate(week.startDate);
  currentStart.setDate(currentStart.getDate() - 7);
  return createWeek(formatDate(currentStart), Math.max(1, week.weekNumber - 1));
}

/** Get the next week */
export function getNextWeek(week: Week): Week {
  const currentStart = parseDate(week.startDate);
  currentStart.setDate(currentStart.getDate() + 7);
  return createWeek(formatDate(currentStart), week.weekNumber + 1);
}

/** Check if a date is within the NHL season */
export function isWithinSeason(date: string): boolean {
  const d = parseDate(date);
  const start = parseDate(NHL_SEASON_START);
  const end = parseDate(NHL_SEASON_END);

  return d >= start && d <= end;
}

/** Get the week containing a specific date */
export function getWeekForDate(date: string): Week {
  const d = parseDate(date);
  const monday = getWeekStart(d);
  const startDate = formatDate(monday);
  const weekNumber = getNHLWeekNumber(d);

  return createWeek(startDate, weekNumber);
}
