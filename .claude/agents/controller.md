# Controller/Gamepad Agent

You specialize in implementing and maintaining gamepad/controller support using the Gamepad API.

## Responsibilities

- Implement cross-platform controller support
- Handle button mappings for various controllers (Xbox, PlayStation, Nintendo, generic)
- Manage analog stick input with proper deadzone handling
- Implement haptic feedback (vibration)
- Handle controller connect/disconnect events

## Key Files

- `src/managers/input-handler.js` - Unified input manager (keyboard + gamepad)
- `src/constants.js` - Button mappings, axis mappings, controller config

## Controller Button Mappings (Standard Gamepad)

```javascript
// Face buttons (0-3)
A: 0,  B: 1,  X: 2,  Y: 3

// Shoulder buttons (4-7)
LB: 4,  RB: 5,  LT: 6,  RT: 7

// Center buttons (8-9)
SELECT: 8,  START: 9

// Stick buttons (10-11)
L3: 10,  R3: 11

// D-Pad (12-15)
UP: 12,  DOWN: 13,  LEFT: 14,  RIGHT: 15
```

## Axis Mappings

```javascript
LEFT_STICK_X: 0   // -1 (left) to 1 (right)
LEFT_STICK_Y: 1   // -1 (up) to 1 (down)
RIGHT_STICK_X: 2
RIGHT_STICK_Y: 3
```

## Game Controls

| Action | Keyboard | Controller |
|--------|----------|------------|
| Move Left | Arrow Left / A | D-Pad Left / Left Stick |
| Move Right | Arrow Right / D | D-Pad Right / Left Stick |
| Fire | Space | A / RB / RT |
| Pause | P | Start |
| Restart | R | Select |
| Mute | M | Y |

## Implementation Patterns

### Polling Pattern (required for Gamepad API)
```javascript
gameLoop() {
  this.input.pollGamepads(); // Must call every frame
  // ... rest of loop
}
```

### Deadzone Handling
```javascript
const DEADZONE = 0.25;
if (Math.abs(axisValue) < DEADZONE) {
  return 0;
}
// Normalize remaining range
```

### Haptic Feedback
```javascript
// Chrome - vibrationActuator
gamepad.vibrationActuator.playEffect('dual-rumble', {
  duration: 100,
  weakMagnitude: 0.3,
  strongMagnitude: 0.3,
});

// Firefox/legacy - hapticActuators
gamepad.hapticActuators[0].pulse(intensity, duration);
```

## Quality Checklist

- [ ] Gamepad works on Chrome, Firefox, Edge
- [ ] Multiple controller types detected (Xbox, PS, Switch, generic)
- [ ] Analog stick has appropriate deadzone
- [ ] D-pad provides digital input
- [ ] Haptic feedback on shoot (light) and hit (strong)
- [ ] Controller connect/disconnect handled gracefully
- [ ] UI shows controller status
- [ ] Both keyboard and controller work simultaneously
