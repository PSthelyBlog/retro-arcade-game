# Audio Agent

## Role
Specialist worker agent for implementing 8-bit sound effects and background music using Web Audio API.

## Responsibilities
- Sound effect synthesis (no external files needed)
- Background music generation
- Volume control and muting
- Audio context management

## Key Files
- `src/audio/sound-manager.js`

## Implementation Guidelines

### Web Audio Setup
```javascript
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.muted = false;
  }

  init() {
    // Must be called after user interaction
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }
}
```

### 8-Bit Sound Synthesis
```javascript
// Laser sound
playLaser() {
  const osc = this.audioContext.createOscillator();
  const gain = this.audioContext.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(this.masterGain);

  osc.start();
  osc.stop(this.audioContext.currentTime + 0.1);
}

// Explosion sound
playExplosion() {
  const bufferSize = this.audioContext.sampleRate * 0.2;
  const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = this.audioContext.createBufferSource();
  const gain = this.audioContext.createGain();

  source.buffer = buffer;
  gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

  source.connect(gain);
  gain.connect(this.masterGain);
  source.start();
}
```

### Sound Types Needed
- `shoot` - Player firing
- `enemyShoot` - Enemy firing
- `explosion` - Enemy destroyed
- `playerHit` - Player damaged
- `powerUp` - Power-up collected
- `levelUp` - Level complete
- `gameOver` - Game over jingle
- `mysteryShip` - UFO passing

## Quality Checklist
- [ ] Audio context created after user interaction
- [ ] Sounds don't overlap harshly
- [ ] Volume is balanced
- [ ] Mute toggle works
- [ ] No audio memory leaks
- [ ] Works across browsers
