/**
 * Arpeggiator - Rapidly cycles through chord notes to imply harmony
 * Classic NES technique to create chords with limited oscillators
 */
export class Arpeggiator {
  /**
   * @param {AudioContext} audioContext
   */
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.isPlaying = false;
    this.intervalId = null;
    this.currentNoteIndex = 0;

    // Default arpeggio settings
    this.pattern = [0, 4, 7]; // Major chord (semitones from root)
    this.speed = 0.05; // 50ms per step
    this.baseFrequency = 440; // Root note
    this.direction = 'up'; // 'up', 'down', 'updown', 'random'
    this.octaveRange = 1; // How many octaves to span

    // Current oscillator
    this.oscillator = null;
    this.gainNode = null;

    // For 'updown' direction
    this.goingUp = true;
  }

  /**
   * Convert semitone offset to frequency multiplier
   * @param {number} semitones - Offset in semitones
   * @returns {number} Frequency multiplier
   */
  _semitoneToMultiplier(semitones) {
    return Math.pow(2, semitones / 12);
  }

  /**
   * Get the next note in the arpeggio sequence
   * @returns {number} Frequency of next note
   */
  _getNextNote() {
    const notes = this._expandPattern();

    switch (this.direction) {
      case 'down':
        this.currentNoteIndex = (this.currentNoteIndex - 1 + notes.length) % notes.length;
        break;
      case 'updown':
        if (this.goingUp) {
          this.currentNoteIndex++;
          if (this.currentNoteIndex >= notes.length - 1) {
            this.goingUp = false;
          }
        } else {
          this.currentNoteIndex--;
          if (this.currentNoteIndex <= 0) {
            this.goingUp = true;
          }
        }
        break;
      case 'random':
        this.currentNoteIndex = Math.floor(Math.random() * notes.length);
        break;
      case 'up':
      default:
        this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
        break;
    }

    return this.baseFrequency * this._semitoneToMultiplier(notes[this.currentNoteIndex]);
  }

  /**
   * Expand pattern across octave range
   * @returns {number[]} Array of semitone offsets
   */
  _expandPattern() {
    const expanded = [...this.pattern];
    for (let octave = 1; octave < this.octaveRange; octave++) {
      this.pattern.forEach(note => {
        expanded.push(note + (12 * octave));
      });
    }
    return expanded;
  }

  /**
   * Start the arpeggiator
   * @param {number} rootFrequency - Base frequency (Hz)
   * @param {number[]} pattern - Array of semitone offsets [0, 4, 7] for major
   * @param {GainNode} destination - Output node
   * @param {string} waveform - 'square', 'sawtooth', 'triangle'
   * @param {number} gain - Volume (0-1)
   */
  start(rootFrequency, pattern, destination, waveform = 'square', gain = 0.3) {
    if (!this.audioContext) return;

    this.baseFrequency = rootFrequency;
    this.pattern = pattern;
    this.currentNoteIndex = 0;
    this.goingUp = true;

    // Create oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.type = waveform;
    this.oscillator.frequency.value = rootFrequency;
    this.gainNode.gain.value = gain;

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(destination);

    this.oscillator.start();
    this.isPlaying = true;

    // Start stepping through notes
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;

      const nextFreq = this._getNextNote();
      if (this.oscillator) {
        this.oscillator.frequency.setTargetAtTime(nextFreq, this.audioContext.currentTime, 0.005);
      }
    }, this.speed * 1000);

    return this;
  }

  /**
   * Stop the arpeggiator
   */
  stop() {
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {}
      this.oscillator = null;
    }

    this.gainNode = null;
  }

  /**
   * Set the arpeggio speed
   * @param {number} speed - Seconds per step (0.05 = 50ms)
   */
  setSpeed(speed) {
    this.speed = speed;
    // If playing, restart with new speed
    if (this.isPlaying && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        if (!this.isPlaying) return;
        const nextFreq = this._getNextNote();
        if (this.oscillator) {
          this.oscillator.frequency.setTargetAtTime(nextFreq, this.audioContext.currentTime, 0.005);
        }
      }, this.speed * 1000);
    }
  }

  /**
   * Set arpeggio direction
   * @param {'up'|'down'|'updown'|'random'} direction
   */
  setDirection(direction) {
    this.direction = direction;
    this.currentNoteIndex = 0;
    this.goingUp = true;
  }

  /**
   * Set octave range
   * @param {number} range - Number of octaves to span
   */
  setOctaveRange(range) {
    this.octaveRange = Math.max(1, Math.min(4, range));
  }

  /**
   * Change root note while playing
   * @param {number} frequency - New root frequency
   */
  setRootFrequency(frequency) {
    this.baseFrequency = frequency;
  }

  /**
   * Change pattern while playing
   * @param {number[]} pattern - New pattern array
   */
  setPattern(pattern) {
    this.pattern = pattern;
    this.currentNoteIndex = 0;
  }

  /**
   * Get the gain node for external envelope control
   * @returns {GainNode}
   */
  getGainNode() {
    return this.gainNode;
  }
}

// Common arpeggio patterns (semitone offsets)
export const ARPEGGIO_PATTERNS = {
  MAJOR: [0, 4, 7],           // C-E-G
  MINOR: [0, 3, 7],           // C-Eb-G
  DIMINISHED: [0, 3, 6],      // C-Eb-Gb
  AUGMENTED: [0, 4, 8],       // C-E-G#
  SUS4: [0, 5, 7],            // C-F-G
  SUS2: [0, 2, 7],            // C-D-G
  MAJOR7: [0, 4, 7, 11],      // C-E-G-B
  MINOR7: [0, 3, 7, 10],      // C-Eb-G-Bb
  DOM7: [0, 4, 7, 10],        // C-E-G-Bb
  POWER: [0, 7, 12],          // C-G-C
  OCTAVE: [0, 12],            // C-C
  SIXTH: [0, 4, 7, 9],        // C-E-G-A
};
