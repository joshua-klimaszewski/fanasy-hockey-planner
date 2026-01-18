import { describe, it, expect } from 'vitest';
import {
  getWeekDates,
  formatDate,
  parseDate,
  getWeekStart,
  getWeekEnd,
  createWeek,
  getWeekdayIndex,
  getWeekdayName,
} from '../Week';

describe('Week', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });
  });

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD string to Date', () => {
      const date = parseDate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });
  });

  describe('getWeekDates', () => {
    it('should return 7 consecutive dates', () => {
      const dates = getWeekDates('2024-01-15');
      expect(dates).toHaveLength(7);
      expect(dates[0]).toBe('2024-01-15');
      expect(dates[6]).toBe('2024-01-21');
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday for any day in the week', () => {
      // Wednesday Jan 17, 2024
      const wed = new Date(2024, 0, 17);
      const monday = getWeekStart(wed);
      expect(monday.getDay()).toBe(1); // Monday
      expect(formatDate(monday)).toBe('2024-01-15');
    });

    it('should handle Sunday correctly', () => {
      // Sunday Jan 21, 2024
      const sun = new Date(2024, 0, 21);
      const monday = getWeekStart(sun);
      expect(formatDate(monday)).toBe('2024-01-15');
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday of the week', () => {
      const wed = new Date(2024, 0, 17);
      const sunday = getWeekEnd(wed);
      expect(sunday.getDay()).toBe(0); // Sunday
      expect(formatDate(sunday)).toBe('2024-01-21');
    });
  });

  describe('createWeek', () => {
    it('should create a Week object with correct properties', () => {
      const week = createWeek('2024-01-15', 12);
      expect(week.weekNumber).toBe(12);
      expect(week.startDate).toBe('2024-01-15');
      expect(week.endDate).toBe('2024-01-21');
      expect(week.label).toContain('Week 12');
    });
  });

  describe('getWeekdayIndex', () => {
    it('should return 0 for Monday', () => {
      expect(getWeekdayIndex('2024-01-15')).toBe(0); // Monday
    });

    it('should return 6 for Sunday', () => {
      expect(getWeekdayIndex('2024-01-21')).toBe(6); // Sunday
    });
  });

  describe('getWeekdayName', () => {
    it('should return correct weekday name', () => {
      expect(getWeekdayName('2024-01-15')).toBe('Mon');
      expect(getWeekdayName('2024-01-17')).toBe('Wed');
      expect(getWeekdayName('2024-01-21')).toBe('Sun');
    });
  });
});
