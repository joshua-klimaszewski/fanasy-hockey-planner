import { describe, it, expect } from 'vitest';
import {
  isSkaterPosition,
  isGoaliePosition,
  canFillSlot,
  SKATER_POSITIONS,
} from '../Position';

describe('Position', () => {
  describe('isSkaterPosition', () => {
    it('should return true for skater positions', () => {
      expect(isSkaterPosition('C')).toBe(true);
      expect(isSkaterPosition('LW')).toBe(true);
      expect(isSkaterPosition('RW')).toBe(true);
      expect(isSkaterPosition('D')).toBe(true);
    });

    it('should return false for non-skater positions', () => {
      expect(isSkaterPosition('G')).toBe(false);
      expect(isSkaterPosition('B')).toBe(false);
      expect(isSkaterPosition('U')).toBe(false);
    });
  });

  describe('isGoaliePosition', () => {
    it('should return true only for G', () => {
      expect(isGoaliePosition('G')).toBe(true);
      expect(isGoaliePosition('C')).toBe(false);
      expect(isGoaliePosition('D')).toBe(false);
    });
  });

  describe('canFillSlot', () => {
    it('should allow matching positions', () => {
      expect(canFillSlot('C', ['C'])).toBe(true);
      expect(canFillSlot('LW', ['LW', 'RW'])).toBe(true);
      expect(canFillSlot('G', ['G'])).toBe(true);
    });

    it('should allow skaters in utility slot', () => {
      SKATER_POSITIONS.forEach((pos) => {
        expect(canFillSlot('U', [pos])).toBe(true);
      });
    });

    it('should not allow goalies in utility slot', () => {
      expect(canFillSlot('U', ['G'])).toBe(false);
    });

    it('should allow any player in bench slot', () => {
      expect(canFillSlot('B', ['C'])).toBe(true);
      expect(canFillSlot('B', ['G'])).toBe(true);
      expect(canFillSlot('B', ['D', 'RW'])).toBe(true);
    });

    it('should allow any player in IR slots', () => {
      expect(canFillSlot('IR', ['C'])).toBe(true);
      expect(canFillSlot('IR+', ['G'])).toBe(true);
    });

    it('should reject mismatched positions', () => {
      expect(canFillSlot('C', ['LW'])).toBe(false);
      expect(canFillSlot('G', ['D'])).toBe(false);
      expect(canFillSlot('D', ['C', 'LW'])).toBe(false);
    });
  });
});
