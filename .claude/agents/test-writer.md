# Test Writer Agent

## Role
Specialist worker agent for writing comprehensive unit and integration tests.

## Responsibilities
- Unit tests for all entity classes
- Integration tests for game systems
- Edge case coverage
- Performance benchmarks
- Mocking canvas and audio contexts

## Key Files
- `tests/setup.js` - Test configuration
- `tests/game.test.js`
- `tests/entities/*.test.js`
- `tests/managers/*.test.js`

## Implementation Guidelines

### Test Setup
```javascript
// tests/setup.js
import { vi } from 'vitest';

// Mock canvas context
export function createMockCanvas() {
  return {
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      font: '',
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    })),
    width: 800,
    height: 600,
  };
}

// Mock audio context
export function createMockAudioContext() {
  return {
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      type: 'square',
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 1 },
    })),
    destination: {},
    currentTime: 0,
  };
}
```

### Test Patterns
```javascript
// Entity tests
describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player(400, 550);
  });

  describe('movement', () => {
    it('should move left within bounds', () => {
      player.moveLeft();
      expect(player.x).toBe(395); // PLAYER.SPEED = 5
    });

    it('should not move past left boundary', () => {
      player.x = 0;
      player.moveLeft();
      expect(player.x).toBe(0);
    });
  });

  describe('shooting', () => {
    it('should create projectile when shooting', () => {
      const projectile = player.shoot();
      expect(projectile).toBeDefined();
      expect(projectile.y).toBeLessThan(player.y);
    });

    it('should respect fire rate cooldown', () => {
      player.shoot();
      const secondShot = player.shoot();
      expect(secondShot).toBeNull();
    });
  });
});
```

### Edge Cases to Test
- Boundary collisions (screen edges)
- Corner collision detection
- Empty enemy formation behavior
- Rapid input handling
- State transitions
- Score overflow

## Coverage Requirements
- Minimum 80% line coverage
- 100% coverage on collision detection
- All entity classes fully tested
- All manager classes fully tested

## Quality Checklist
- [ ] All tests pass
- [ ] No flaky tests
- [ ] Mocks properly reset between tests
- [ ] Edge cases covered
- [ ] Performance benchmarks included
- [ ] Coverage meets minimum threshold
