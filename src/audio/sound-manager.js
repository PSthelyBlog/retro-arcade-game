/**
 * 8-bit sound effect synthesizer using Web Audio API
 */
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.muted = false;
    this.initialized = false;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Resume audio context if suspended
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Toggle mute
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }

  /**
   * Set mute state
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.3;
    }
  }

  /**
   * Play player shoot sound
   */
  playShoot() {
    if (!this.initialized || this.muted) return;

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

  /**
   * Play enemy shoot sound
   */
  playEnemyShoot() {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * Play explosion sound (enemy destroyed)
   */
  playExplosion() {
    if (!this.initialized || this.muted) return;

    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  /**
   * Play player hit sound
   */
  playPlayerHit() {
    if (!this.initialized || this.muted) return;

    // Low rumble + noise
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.4);

    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.4);

    // Add noise burst
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
    }

    const source = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();

    source.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    source.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    source.start();
  }

  /**
   * Play mystery ship sound
   */
  playMysteryShip() {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);

    // Wobble effect
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 8;
    lfoGain.gain.value = 50;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    lfo.start();

    // Stop after 0.5s
    osc.stop(this.audioContext.currentTime + 0.5);
    lfo.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * Play power up sound
   */
  playPowerUp() {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';

    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    let time = this.audioContext.currentTime;

    for (const note of notes) {
      osc.frequency.setValueAtTime(note, time);
      time += 0.08;
    }

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.4);
  }

  /**
   * Play game over sound
   */
  playGameOver() {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';

    // Descending sad melody
    const notes = [392, 349.23, 329.63, 293.66, 261.63]; // G4, F4, E4, D4, C4
    let time = this.audioContext.currentTime;

    for (const note of notes) {
      osc.frequency.setValueAtTime(note, time);
      time += 0.2;
    }

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 1);
  }

  /**
   * Play level complete sound
   */
  playLevelComplete() {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';

    // Victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1046.50]; // C5 E5 G5 C6 E6 C6
    let time = this.audioContext.currentTime;

    for (let i = 0; i < notes.length; i++) {
      osc.frequency.setValueAtTime(notes[i], time);
      time += i === notes.length - 1 ? 0.3 : 0.12;
    }

    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioContext.currentTime + 1);
  }
}
