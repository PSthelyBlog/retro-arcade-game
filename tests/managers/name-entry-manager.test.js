import { describe, it, expect, beforeEach } from 'vitest';
import { NameEntryManager } from '../../src/managers/name-entry-manager.js';
import { NAME_ENTRY } from '../../src/constants.js';

describe('NameEntryManager', () => {
  let nameEntry;

  beforeEach(() => {
    nameEntry = new NameEntryManager();
  });

  describe('initialization', () => {
    it('should initialize with default characters', () => {
      expect(nameEntry.getInitials()).toBe('AAA');
      expect(nameEntry.getCurrentPosition()).toBe(0);
      expect(nameEntry.isConfirmed()).toBe(false);
    });

    it('should have correct allowed characters', () => {
      expect(nameEntry.allowedChars).toBe(NAME_ENTRY.ALLOWED_CHARS);
      expect(nameEntry.allowedChars).toContain('A');
      expect(nameEntry.allowedChars).toContain('Z');
      expect(nameEntry.allowedChars).toContain('0');
      expect(nameEntry.allowedChars).toContain('9');
      expect(nameEntry.allowedChars).toContain(' ');
    });
  });

  describe('character navigation', () => {
    it('should cycle to next character with nextChar()', () => {
      nameEntry.nextChar();
      expect(nameEntry.getCharAt(0)).toBe('B');
    });

    it('should cycle to previous character with prevChar()', () => {
      nameEntry.prevChar();
      // Should wrap around to end of allowed characters
      const lastChar = NAME_ENTRY.ALLOWED_CHARS[NAME_ENTRY.ALLOWED_CHARS.length - 1];
      expect(nameEntry.getCharAt(0)).toBe(lastChar);
    });

    it('should wrap around at end of character list', () => {
      // Move to last character
      const lastIndex = NAME_ENTRY.ALLOWED_CHARS.length - 1;
      for (let i = 0; i < lastIndex; i++) {
        nameEntry.nextChar();
      }
      const lastChar = NAME_ENTRY.ALLOWED_CHARS[lastIndex];
      expect(nameEntry.getCharAt(0)).toBe(lastChar);

      // One more should wrap to 'A'
      nameEntry.nextChar();
      expect(nameEntry.getCharAt(0)).toBe('A');
    });
  });

  describe('cursor position', () => {
    it('should move cursor to next position', () => {
      expect(nameEntry.getCurrentPosition()).toBe(0);
      nameEntry.nextPosition();
      expect(nameEntry.getCurrentPosition()).toBe(1);
      nameEntry.nextPosition();
      expect(nameEntry.getCurrentPosition()).toBe(2);
    });

    it('should not move past last position', () => {
      nameEntry.nextPosition();
      nameEntry.nextPosition();
      const result = nameEntry.nextPosition();
      expect(result).toBe(false);
      expect(nameEntry.getCurrentPosition()).toBe(2);
    });

    it('should move cursor to previous position', () => {
      nameEntry.nextPosition();
      nameEntry.nextPosition();
      expect(nameEntry.getCurrentPosition()).toBe(2);
      nameEntry.prevPosition();
      expect(nameEntry.getCurrentPosition()).toBe(1);
    });

    it('should not move before first position', () => {
      const result = nameEntry.prevPosition();
      expect(result).toBe(false);
      expect(nameEntry.getCurrentPosition()).toBe(0);
    });
  });

  describe('character modification at positions', () => {
    it('should modify character at current position only', () => {
      nameEntry.nextChar(); // First position -> B
      expect(nameEntry.getInitials()).toBe('BAA');

      nameEntry.nextPosition();
      nameEntry.nextChar(); // Second position -> B
      expect(nameEntry.getInitials()).toBe('BBA');

      nameEntry.nextPosition();
      nameEntry.nextChar(); // Third position -> B
      expect(nameEntry.getInitials()).toBe('BBB');
    });

    it('should allow setting character directly', () => {
      expect(nameEntry.setChar('X')).toBe(true);
      expect(nameEntry.getCharAt(0)).toBe('X');
    });

    it('should reject invalid characters', () => {
      expect(nameEntry.setChar('!')).toBe(false);
      expect(nameEntry.getCharAt(0)).toBe('A');
    });

    it('should handle lowercase input', () => {
      expect(nameEntry.setChar('z')).toBe(true);
      expect(nameEntry.getCharAt(0)).toBe('Z');
    });
  });

  describe('confirm behavior', () => {
    it('should advance position on confirm until end', () => {
      expect(nameEntry.confirm()).toBe(false);
      expect(nameEntry.getCurrentPosition()).toBe(1);

      expect(nameEntry.confirm()).toBe(false);
      expect(nameEntry.getCurrentPosition()).toBe(2);

      expect(nameEntry.confirm()).toBe(true);
      expect(nameEntry.isConfirmed()).toBe(true);
    });

    it('should not allow changes after confirmation', () => {
      nameEntry.confirm();
      nameEntry.confirm();
      nameEntry.confirm(); // Now confirmed

      nameEntry.nextChar();
      expect(nameEntry.getInitials()).toBe('AAA'); // No change
    });

    it('should not allow cursor movement after confirmation', () => {
      nameEntry.confirm();
      nameEntry.confirm();
      nameEntry.confirm();

      expect(nameEntry.nextPosition()).toBe(false);
      expect(nameEntry.prevPosition()).toBe(false);
    });
  });

  describe('inputChar (direct input with auto-advance)', () => {
    it('should set character and advance position', () => {
      expect(nameEntry.inputChar('J')).toBe(false);
      expect(nameEntry.getCharAt(0)).toBe('J');
      expect(nameEntry.getCurrentPosition()).toBe(1);
    });

    it('should complete entry after third character', () => {
      nameEntry.inputChar('A');
      nameEntry.inputChar('B');
      expect(nameEntry.inputChar('C')).toBe(true);
      expect(nameEntry.getInitials()).toBe('ABC');
      expect(nameEntry.isConfirmed()).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(nameEntry.inputChar('!')).toBe(false);
      expect(nameEntry.getCurrentPosition()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      nameEntry.inputChar('X');
      nameEntry.inputChar('Y');
      nameEntry.inputChar('Z');
      expect(nameEntry.isConfirmed()).toBe(true);

      nameEntry.reset();

      expect(nameEntry.getInitials()).toBe('AAA');
      expect(nameEntry.getCurrentPosition()).toBe(0);
      expect(nameEntry.isConfirmed()).toBe(false);
    });
  });

  describe('confirmation delay', () => {
    it('should track confirmation delay timer', () => {
      nameEntry.confirm();
      nameEntry.confirm();
      nameEntry.confirm(); // Confirmed

      expect(nameEntry.isDelayComplete()).toBe(false);

      // Simulate time passing
      nameEntry.update(NAME_ENTRY.CONFIRM_DELAY - 1);
      expect(nameEntry.isDelayComplete()).toBe(false);

      nameEntry.update(2);
      expect(nameEntry.isDelayComplete()).toBe(true);
    });

    it('should not track delay until confirmed', () => {
      expect(nameEntry.update(1000)).toBe(false);
      expect(nameEntry.isDelayComplete()).toBe(false);
    });
  });
});
