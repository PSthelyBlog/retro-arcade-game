/**
 * Enhanced Chiptune Music Synthesizer using Web Audio API
 * Features:
 * - NES 2A03-style multi-voice synthesis (Pulse 1, Pulse 2, Triangle, Noise)
 * - Variable duty cycle pulse waves (12.5%, 25%, 50%, 75%)
 * - Fast arpeggiation for chord simulation
 * - Vibrato and PWM modulation effects
 * - Dynamic tempo scaling based on game wave
 * - Counterpoint melodies (two distinct melodic voices)
 * - ADSR envelope presets
 */
import { MUSIC } from '../constants.js';
import { PulseOscillator } from './pulse-oscillator.js';
import { Arpeggiator, ARPEGGIO_PATTERNS } from './arpeggiator.js';

export class MusicManager {
  constructor(audioContext, masterGain) {
    this.audioContext = audioContext;
    this.masterGain = masterGain;

    // Music-specific gain node (for independent volume control)
    this.musicGain = null;
    this.volume = MUSIC.MASTER_VOLUME;
    this.muted = false;

    // Current playback state
    this.currentTrack = null;
    this.isPlaying = false;
    this.isPaused = false;

    // Sequencer state
    this.scheduledNotes = [];
    this.nextNoteTime = 0;
    this.loopId = null;
    this.scheduleAheadTime = 0.1; // Schedule 100ms ahead
    this.lookAhead = 25; // Check every 25ms

    // Active sound generators for cleanup
    this.activeOscillators = [];
    this.activeArpeggiators = [];

    // Dynamic tempo
    this.currentWave = 1;
    this.tempoMultiplier = 1.0;

    // Track definitions with enhanced melodies
    this.tracks = this._defineTracks();
  }

  /**
   * Initialize music system
   */
  init() {
    if (!this.audioContext) return;

    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = this.muted ? 0 : this.volume;
    this.musicGain.connect(this.masterGain);
  }

  /**
   * Set current wave for dynamic tempo
   * @param {number} wave - Current game wave
   */
  setWave(wave) {
    this.currentWave = wave;
    if (MUSIC.DYNAMIC_TEMPO?.ENABLED) {
      const scaling = MUSIC.DYNAMIC_TEMPO.WAVE_SCALING * (wave - 1);
      this.tempoMultiplier = Math.min(
        MUSIC.DYNAMIC_TEMPO.BASE_MULTIPLIER + scaling,
        MUSIC.DYNAMIC_TEMPO.MAX_MULTIPLIER
      );
    }
  }

  /**
   * Define all music tracks with elaborate multi-voice melodies
   * Uses counterpoint, arpeggios, and authentic NES voice allocation
   */
  _defineTracks() {
    const N = MUSIC.NOTES;
    const PW = MUSIC.PULSE_WIDTH || { THIN: 0.125, NARROW: 0.25, SQUARE: 0.5 };
    const ENV = MUSIC.ENVELOPE || {
      LEAD: { attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.1 },
      BASS: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
      STACCATO: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.01 },
    };

    return {
      // Title screen theme - Mysterious and inviting with rich harmonies
      title: {
        bpm: MUSIC.BPM.TITLE,
        loop: true,
        voices: [
          // Pulse 1: Lead melody (25% duty - slightly hollow, ethereal)
          {
            type: 'pulse',
            dutyCycle: PW.NARROW,
            gain: 0.25,
            envelope: ENV.LEAD,
            vibrato: true,
            notes: [
              // Measure 1-2: Opening phrase (A minor pentatonic)
              { note: N.A4, duration: 0.5 }, { note: N.C5, duration: 0.5 },
              { note: N.D5, duration: 0.75 }, { note: N.E5, duration: 0.25 },
              { note: N.D5, duration: 0.5 }, { note: N.C5, duration: 0.5 },
              { note: N.A4, duration: 1 }, { note: N.REST, duration: 0.5 },
              // Measure 3-4: Answering phrase
              { note: N.E4, duration: 0.25 }, { note: N.G4, duration: 0.25 },
              { note: N.A4, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              { note: N.E4, duration: 0.75 }, { note: N.D4, duration: 0.25 },
              { note: N.E4, duration: 1.5 },
              // Measure 5-6: Development with chromatic color
              { note: N.A4, duration: 0.25 }, { note: N.B4, duration: 0.25 },
              { note: N.C5, duration: 0.5 }, { note: N.D5, duration: 0.5 },
              { note: N.E5, duration: 0.5 }, { note: N.F5, duration: 0.25 },
              { note: N.E5, duration: 0.25 }, { note: N.D5, duration: 0.5 },
              { note: N.C5, duration: 0.5 }, { note: N.REST, duration: 0.5 },
              // Measure 7-8: Resolution
              { note: N.B4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.E4, duration: 0.5 },
              { note: N.A4, duration: 2 },
            ]
          },
          // Pulse 2: Counterpoint melody (12.5% duty - thin, complementary)
          {
            type: 'pulse',
            dutyCycle: PW.THIN,
            gain: 0.15,
            envelope: ENV.LEAD,
            notes: [
              // Counterpoint: Moves in contrary motion to lead
              { note: N.E4, duration: 0.5 }, { note: N.E4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.E4, duration: 0.5 },
              { note: N.D4, duration: 1 }, { note: N.REST, duration: 0.5 },
              // Answer
              { note: N.C4, duration: 0.5 }, { note: N.D4, duration: 0.5 },
              { note: N.E4, duration: 0.5 }, { note: N.D4, duration: 0.5 },
              { note: N.C4, duration: 0.5 }, { note: N.B3, duration: 0.5 },
              { note: N.A3, duration: 1.5 },
              // Development
              { note: N.C4, duration: 0.5 }, { note: N.D4, duration: 0.5 },
              { note: N.E4, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              { note: N.A4, duration: 0.5 }, { note: N.B4, duration: 0.5 },
              { note: N.C5, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.REST, duration: 0.5 },
              // Resolution
              { note: N.E4, duration: 0.5 }, { note: N.D4, duration: 0.5 },
              { note: N.C4, duration: 0.5 }, { note: N.B3, duration: 0.5 },
              { note: N.A3, duration: 2 },
            ]
          },
          // Triangle: Bass line with melodic movement
          {
            type: 'triangle',
            gain: 0.35,
            envelope: ENV.BASS,
            notes: [
              // Bass with octave jumps (characteristic NES bass style)
              { note: N.A3, duration: 0.5 }, { note: N.A4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A3, duration: 0.5 }, { note: N.G3, duration: 0.5 },
              { note: N.E3, duration: 0.5 }, { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.D3, duration: 1 }, { note: N.REST, duration: 0.5 },
              // Measure 3-4
              { note: N.C3, duration: 0.5 }, { note: N.C4, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.G3, duration: 0.5 }, { note: N.G4, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.A3, duration: 0.5 }, { note: N.A4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A3, duration: 1.5 },
              // Measure 5-6
              { note: N.A3, duration: 0.5 }, { note: N.G3, duration: 0.5 },
              { note: N.F3, duration: 0.5 }, { note: N.E3, duration: 0.5 },
              { note: N.D3, duration: 0.5 }, { note: N.C3, duration: 0.5 },
              { note: N.D3, duration: 0.5 }, { note: N.E3, duration: 0.5 },
              { note: N.F3, duration: 0.5 }, { note: N.REST, duration: 0.5 },
              // Measure 7-8
              { note: N.G3, duration: 0.5 }, { note: N.F3, duration: 0.5 },
              { note: N.E3, duration: 0.5 }, { note: N.D3, duration: 0.5 },
              { note: N.A3, duration: 2 },
            ]
          }
        ]
      },

      // Battle theme - Intense and driving with aggressive arpeggios
      battle: {
        bpm: MUSIC.BPM.BATTLE,
        loop: true,
        voices: [
          // Pulse 1: Aggressive lead melody (50% duty - punchy)
          {
            type: 'pulse',
            dutyCycle: PW.SQUARE,
            gain: 0.22,
            envelope: ENV.STACCATO,
            notes: [
              // Measure 1-2: Syncopated attack pattern
              { note: N.E5, duration: 0.25 }, { note: N.REST, duration: 0.125 },
              { note: N.E5, duration: 0.125 }, { note: N.E5, duration: 0.25 },
              { note: N.D5, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.D5, duration: 0.25 }, { note: N.E5, duration: 0.5 },
              { note: N.G5, duration: 0.25 }, { note: N.REST, duration: 0.25 },
              { note: N.E5, duration: 0.25 }, { note: N.D5, duration: 0.25 },
              { note: N.C5, duration: 0.5 }, { note: N.B4, duration: 0.25 },
              { note: N.A4, duration: 0.25 },
              // Measure 3-4: Chromatic run
              { note: N.A4, duration: 0.125 }, { note: N.B4, duration: 0.125 },
              { note: N.C5, duration: 0.125 }, { note: N.D5, duration: 0.125 },
              { note: N.E5, duration: 0.25 }, { note: N.F5, duration: 0.25 },
              { note: N.E5, duration: 0.25 }, { note: N.D5, duration: 0.25 },
              { note: N.C5, duration: 0.25 }, { note: N.B4, duration: 0.25 },
              { note: N.A4, duration: 0.5 }, { note: N.G4, duration: 0.25 },
              { note: N.A4, duration: 0.25 },
              // Measure 5-6: Power riff
              { note: N.E4, duration: 0.25 }, { note: N.G4, duration: 0.25 },
              { note: N.A4, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.D5, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.B4, duration: 0.25 }, { note: N.A4, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.A4, duration: 0.25 },
              { note: N.B4, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.D5, duration: 0.5 }, { note: N.E5, duration: 0.5 },
              // Measure 7-8: Climax
              { note: N.G5, duration: 0.25 }, { note: N.F5, duration: 0.25 },
              { note: N.E5, duration: 0.25 }, { note: N.D5, duration: 0.25 },
              { note: N.C5, duration: 0.25 }, { note: N.B4, duration: 0.25 },
              { note: N.A4, duration: 0.5 }, { note: N.E5, duration: 0.5 },
              { note: N.D5, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.B4, duration: 0.25 }, { note: N.A4, duration: 0.25 },
            ]
          },
          // Pulse 2: Arpeggio voice for chord texture
          {
            type: 'arpeggio',
            pattern: ARPEGGIO_PATTERNS.POWER,
            speed: 0.04,
            gain: 0.12,
            notes: [
              // Chord progression: Am - G - F - E (i - VII - VI - V)
              { note: N.A3, duration: 2, pattern: 'MINOR' },
              { note: N.G3, duration: 2, pattern: 'MAJOR' },
              { note: N.F3, duration: 2, pattern: 'MAJOR' },
              { note: N.E3, duration: 2, pattern: 'MAJOR' },
              // Second 4 bars
              { note: N.A3, duration: 1, pattern: 'MINOR' },
              { note: N.C4, duration: 1, pattern: 'MAJOR' },
              { note: N.D4, duration: 1, pattern: 'MINOR' },
              { note: N.E4, duration: 1, pattern: 'MAJOR' },
              { note: N.A3, duration: 2, pattern: 'POWER' },
              { note: N.E4, duration: 2, pattern: 'POWER' },
            ]
          },
          // Triangle: Driving bass with rhythmic pattern
          {
            type: 'triangle',
            gain: 0.38,
            envelope: ENV.BASS,
            notes: [
              // Measure 1-2: Pumping eighth notes
              { note: N.A3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.G3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              // Measure 3-4
              { note: N.F3, duration: 0.25 }, { note: N.F3, duration: 0.25 },
              { note: N.F4, duration: 0.25 }, { note: N.F3, duration: 0.25 },
              { note: N.F3, duration: 0.25 }, { note: N.F3, duration: 0.25 },
              { note: N.F4, duration: 0.25 }, { note: N.F3, duration: 0.25 },
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              // Measure 5-8: More melodic bass
              { note: N.A3, duration: 0.25 }, { note: N.C4, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.C4, duration: 0.25 }, { note: N.D4, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.D4, duration: 0.25 },
              { note: N.C4, duration: 0.25 }, { note: N.B3, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.F3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.D3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.A3, duration: 0.5 }, { note: N.A4, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.E4, duration: 0.5 },
              { note: N.A3, duration: 0.25 }, { note: N.E4, duration: 0.25 },
              { note: N.A3, duration: 0.5 }, { note: N.E3, duration: 0.5 },
            ]
          }
        ]
      },

      // Boss theme - Urgent and dramatic with fast arpeggios (wave 10+)
      boss: {
        bpm: MUSIC.BPM.BOSS,
        loop: true,
        voices: [
          // Pulse 1: Frantic lead with pitch bends
          {
            type: 'pulse',
            dutyCycle: PW.NARROW,
            gain: 0.2,
            envelope: ENV.STACCATO,
            vibrato: true,
            vibratoDelay: 0.05,
            notes: [
              // Measure 1: Rapid-fire chromatic attack
              { note: N.E5, duration: 0.125 }, { note: N.F5, duration: 0.125 },
              { note: N.E5, duration: 0.125 }, { note: N.D5, duration: 0.125 },
              { note: N.E5, duration: 0.125 }, { note: N.G5, duration: 0.125 },
              { note: N.E5, duration: 0.125 }, { note: N.D5, duration: 0.125 },
              // Measure 2: Descending run
              { note: N.C5, duration: 0.125 }, { note: N.B4, duration: 0.125 },
              { note: N.A4, duration: 0.125 }, { note: N.G4, duration: 0.125 },
              { note: N.A4, duration: 0.125 }, { note: N.B4, duration: 0.125 },
              { note: N.C5, duration: 0.125 }, { note: N.D5, duration: 0.125 },
              // Measure 3: Dramatic phrase
              { note: N.E5, duration: 0.25 }, { note: N.REST, duration: 0.125 },
              { note: N.E5, duration: 0.125 }, { note: N.D5, duration: 0.25 },
              { note: N.C5, duration: 0.25 },
              // Measure 4: Build tension
              { note: N.B4, duration: 0.125 }, { note: N.C5, duration: 0.125 },
              { note: N.D5, duration: 0.125 }, { note: N.E5, duration: 0.125 },
              { note: N.F5, duration: 0.25 }, { note: N.E5, duration: 0.25 },
            ]
          },
          // Pulse 2: Fast minor arpeggio for tension
          {
            type: 'arpeggio',
            pattern: ARPEGGIO_PATTERNS.MINOR,
            speed: 0.03,
            direction: 'updown',
            gain: 0.15,
            notes: [
              { note: N.A3, duration: 1, pattern: 'DIMINISHED' },
              { note: N.E3, duration: 1, pattern: 'MINOR' },
              { note: N.F3, duration: 1, pattern: 'MAJOR' },
              { note: N.E3, duration: 1, pattern: 'MAJOR' },
            ]
          },
          // Triangle: Aggressive punchy bass
          {
            type: 'triangle',
            gain: 0.4,
            envelope: ENV.BASS,
            notes: [
              // Rapid octave jumps
              { note: N.A3, duration: 0.125 }, { note: N.A4, duration: 0.125 },
              { note: N.A3, duration: 0.125 }, { note: N.REST, duration: 0.125 },
              { note: N.A3, duration: 0.125 }, { note: N.A4, duration: 0.125 },
              { note: N.A3, duration: 0.125 }, { note: N.G3, duration: 0.125 },
              { note: N.E3, duration: 0.125 }, { note: N.E4, duration: 0.125 },
              { note: N.E3, duration: 0.125 }, { note: N.REST, duration: 0.125 },
              { note: N.E3, duration: 0.125 }, { note: N.E4, duration: 0.125 },
              { note: N.E3, duration: 0.125 }, { note: N.D3, duration: 0.125 },
              // Measure 3-4
              { note: N.F3, duration: 0.125 }, { note: N.F4, duration: 0.125 },
              { note: N.F3, duration: 0.125 }, { note: N.REST, duration: 0.125 },
              { note: N.F3, duration: 0.125 }, { note: N.E3, duration: 0.125 },
              { note: N.D3, duration: 0.125 }, { note: N.C3, duration: 0.125 },
              { note: N.E3, duration: 0.25 }, { note: N.E4, duration: 0.25 },
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
            ]
          }
        ]
      },

      // Game over - Somber descending melody (one-shot)
      gameOver: {
        bpm: MUSIC.BPM.GAME_OVER,
        loop: false,
        voices: [
          // Sad descending melody
          {
            type: 'pulse',
            dutyCycle: PW.NARROW,
            gain: 0.2,
            envelope: ENV.LEAD,
            vibrato: true,
            notes: [
              { note: N.E5, duration: 0.75 }, { note: N.D5, duration: 0.75 },
              { note: N.C5, duration: 0.75 }, { note: N.B4, duration: 0.75 },
              { note: N.A4, duration: 1.5 }, { note: N.REST, duration: 0.5 },
              { note: N.G4, duration: 1 }, { note: N.E4, duration: 2 },
            ]
          },
          // Somber bass
          {
            type: 'triangle',
            gain: 0.3,
            envelope: ENV.BASS,
            notes: [
              { note: N.A3, duration: 1.5 }, { note: N.G3, duration: 1.5 },
              { note: N.F3, duration: 1.5 }, { note: N.E3, duration: 1.5 },
              { note: N.A3, duration: 2 },
            ]
          }
        ]
      },

      // Victory - Triumphant fanfare (one-shot)
      victory: {
        bpm: MUSIC.BPM.VICTORY,
        loop: false,
        voices: [
          // Triumphant melody
          {
            type: 'pulse',
            dutyCycle: PW.SQUARE,
            gain: 0.3,
            envelope: ENV.LEAD,
            notes: [
              { note: N.C5, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.G5, duration: 0.25 }, { note: N.C6, duration: 0.75 },
              { note: N.REST, duration: 0.25 },
              { note: N.G5, duration: 0.25 }, { note: N.C6, duration: 0.75 },
              { note: N.E5, duration: 0.25 }, { note: N.G5, duration: 0.25 },
              { note: N.C6, duration: 1 },
            ]
          },
          // Harmony
          {
            type: 'pulse',
            dutyCycle: PW.THIN,
            gain: 0.2,
            envelope: ENV.LEAD,
            notes: [
              { note: N.E4, duration: 0.25 }, { note: N.G4, duration: 0.25 },
              { note: N.C5, duration: 0.25 }, { note: N.E5, duration: 0.75 },
              { note: N.REST, duration: 0.25 },
              { note: N.E5, duration: 0.25 }, { note: N.G5, duration: 0.75 },
              { note: N.C5, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.G5, duration: 1 },
            ]
          },
          // Bass fanfare
          {
            type: 'triangle',
            gain: 0.35,
            notes: [
              { note: N.C3, duration: 0.5 }, { note: N.C4, duration: 0.5 },
              { note: N.G3, duration: 0.5 }, { note: N.C4, duration: 0.5 },
              { note: N.E3, duration: 0.5 }, { note: N.G3, duration: 0.5 },
              { note: N.C4, duration: 1 },
            ]
          }
        ]
      }
    };
  }

  /**
   * Play a track by name
   * @param {string} trackName - 'title', 'battle', 'boss', 'gameOver', 'victory'
   */
  playTrack(trackName) {
    if (!this.audioContext || !this.musicGain) return;

    const track = this.tracks[trackName];
    if (!track) {
      console.warn(`Unknown track: ${trackName}`);
      return;
    }

    // Stop current track first
    this.stopTrack();

    this.currentTrack = trackName;
    this.isPlaying = true;
    this.isPaused = false;
    this.nextNoteTime = this.audioContext.currentTime;

    // Start the scheduler
    this._startScheduler(track);
  }

  /**
   * Stop current track
   */
  stopTrack() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTrack = null;

    // Stop scheduler
    if (this.loopId) {
      clearInterval(this.loopId);
      this.loopId = null;
    }

    // Stop all active oscillators
    this.activeOscillators.forEach(osc => {
      try {
        if (osc.stop) osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators = [];

    // Stop all arpeggiatorsF
    this.activeArpeggiators.forEach(arp => {
      try {
        arp.stop();
      } catch (e) {}
    });
    this.activeArpeggiators = [];
  }

  /**
   * Pause current track
   */
  pause() {
    if (!this.isPlaying) return;
    this.isPaused = true;

    if (this.loopId) {
      clearInterval(this.loopId);
      this.loopId = null;
    }
  }

  /**
   * Resume paused track
   */
  resume() {
    if (!this.currentTrack || !this.isPaused) return;

    const track = this.tracks[this.currentTrack];
    if (!track) return;

    this.isPaused = false;
    this.nextNoteTime = this.audioContext.currentTime;
    this._startScheduler(track);
  }

  /**
   * Fade to a new track
   * @param {string} trackName - Target track name
   */
  fadeToTrack(trackName) {
    if (!this.audioContext || !this.musicGain) return;

    const fadeDuration = MUSIC.FADE_DURATION / 1000;
    const currentTime = this.audioContext.currentTime;

    // Fade out current
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0, currentTime + fadeDuration / 2);

    // Schedule track switch and fade in
    setTimeout(() => {
      this.stopTrack();
      this.playTrack(trackName);

      if (this.musicGain) {
        const newTime = this.audioContext.currentTime;
        this.musicGain.gain.setValueAtTime(0, newTime);
        this.musicGain.gain.linearRampToValueAtTime(
          this.muted ? 0 : this.volume,
          newTime + fadeDuration / 2
        );
      }
    }, fadeDuration * 500);
  }

  /**
   * Set music volume
   * @param {number} vol - Volume from 0 to 1
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol)) * MUSIC.MASTER_VOLUME;
    if (this.musicGain && !this.muted) {
      this.musicGain.gain.value = this.volume;
    }
  }

  /**
   * Toggle mute
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  /**
   * Set mute state directly
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = muted;
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : this.volume;
    }
  }

  /**
   * Get current muted state
   * @returns {boolean}
   */
  isMuted() {
    return this.muted;
  }

  /**
   * Start the note scheduler
   * @private
   */
  _startScheduler(track) {
    // Apply dynamic tempo
    const baseBeatDuration = 60 / track.bpm;
    const beatDuration = baseBeatDuration / this.tempoMultiplier;

    // Pre-calculate all voice sequences
    const voiceStates = track.voices.map(voice => ({
      voice,
      noteIndex: 0,
      timeInTrack: 0
    }));

    // Calculate total track duration using longest voice
    let maxDuration = 0;
    track.voices.forEach(voice => {
      const duration = this._calculateVoiceDuration(voice, beatDuration);
      if (duration > maxDuration) maxDuration = duration;
    });
    const totalDuration = maxDuration;

    this.loopId = setInterval(() => {
      if (!this.isPlaying || this.isPaused || !this.audioContext) return;

      const currentTime = this.audioContext.currentTime;

      // Schedule notes for each voice
      voiceStates.forEach(state => {
        while (state.noteIndex < state.voice.notes.length &&
               this.nextNoteTime + state.timeInTrack < currentTime + this.scheduleAheadTime) {

          const note = state.voice.notes[state.noteIndex];
          const noteDuration = note.duration * beatDuration;

          if (note.note !== 0 && note.note !== MUSIC.NOTES.REST) {
            this._scheduleVoice(
              state.voice,
              note,
              this.nextNoteTime + state.timeInTrack,
              noteDuration * 0.9
            );
          }

          state.timeInTrack += noteDuration;
          state.noteIndex++;
        }
      });

      // Check if we've completed the track
      const allVoicesComplete = voiceStates.every(s => s.noteIndex >= s.voice.notes.length);

      if (allVoicesComplete) {
        if (track.loop) {
          // Reset for loop
          this.nextNoteTime += totalDuration;
          voiceStates.forEach(state => {
            state.noteIndex = 0;
            state.timeInTrack = 0;
          });
        } else {
          // One-shot complete
          this.stopTrack();
        }
      }
    }, this.lookAhead);
  }

  /**
   * Calculate total duration of a voice's notes
   * @private
   */
  _calculateVoiceDuration(voice, beatDuration) {
    return voice.notes.reduce((total, note) => total + note.duration * beatDuration, 0);
  }

  /**
   * Schedule a voice based on its type
   * @private
   */
  _scheduleVoice(voice, note, startTime, duration) {
    if (!this.audioContext) return;

    switch (voice.type) {
      case 'pulse':
        this._schedulePulseNote(voice, note.note, startTime, duration);
        break;
      case 'arpeggio':
        this._scheduleArpeggio(voice, note, startTime, duration);
        break;
      case 'triangle':
      case 'sawtooth':
      case 'square':
      default:
        this._scheduleBasicNote(note.note, voice.type, voice.gain, startTime, duration, voice.envelope);
        break;
    }
  }

  /**
   * Schedule a pulse wave note with variable duty cycle
   * @private
   */
  _schedulePulseNote(voice, frequency, startTime, duration) {
    if (!this.audioContext) return;

    const pulseOsc = new PulseOscillator(this.audioContext, voice.dutyCycle || 0.5);
    const gainNode = this.audioContext.createGain();

    // Start the oscillator
    pulseOsc.start(frequency, this.musicGain, startTime);

    // Get the gain node for envelope
    const oscGain = pulseOsc.getGainNode();
    if (oscGain) {
      // Apply envelope
      const env = voice.envelope || { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 };
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(voice.gain, startTime + env.attack);
      oscGain.gain.linearRampToValueAtTime(voice.gain * env.sustain, startTime + env.attack + env.decay);
      oscGain.gain.setValueAtTime(voice.gain * env.sustain, startTime + duration - env.release);
      oscGain.gain.linearRampToValueAtTime(0, startTime + duration);
    }

    // Enable vibrato if specified
    if (voice.vibrato) {
      const vibratoDelay = voice.vibratoDelay || MUSIC.VIBRATO?.DELAY || 0.1;
      setTimeout(() => {
        if (pulseOsc.getOscillator()) {
          this._applyVibrato(pulseOsc.getOscillator(), startTime + vibratoDelay);
        }
      }, vibratoDelay * 1000);
    }

    // Schedule stop
    pulseOsc.stop(startTime + duration);

    this.activeOscillators.push(pulseOsc);
  }

  /**
   * Schedule an arpeggio
   * @private
   */
  _scheduleArpeggio(voice, note, startTime, duration) {
    if (!this.audioContext) return;

    // Get pattern based on note.pattern or voice.pattern
    const patternName = note.pattern || 'MAJOR';
    const pattern = ARPEGGIO_PATTERNS[patternName] || ARPEGGIO_PATTERNS.MAJOR;

    const arpeggiator = new Arpeggiator(this.audioContext);
    arpeggiator.setSpeed(voice.speed || 0.05);
    arpeggiator.setDirection(voice.direction || 'up');

    // Schedule start
    setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        arpeggiator.start(note.note, pattern, this.musicGain, 'square', voice.gain);
        this.activeArpeggiators.push(arpeggiator);
      }
    }, (startTime - this.audioContext.currentTime) * 1000);

    // Schedule stop
    setTimeout(() => {
      arpeggiator.stop();
      const index = this.activeArpeggiators.indexOf(arpeggiator);
      if (index > -1) this.activeArpeggiators.splice(index, 1);
    }, (startTime - this.audioContext.currentTime + duration) * 1000);
  }

  /**
   * Schedule a basic oscillator note (triangle, sawtooth, square)
   * @private
   */
  _scheduleBasicNote(frequency, type, gain, startTime, duration, envelope) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = type === 'noise' ? 'square' : type;
    osc.frequency.value = frequency;

    const env = envelope || { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.02 };

    // Apply ADSR envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + env.attack);
    gainNode.gain.linearRampToValueAtTime(gain * env.sustain, startTime + env.attack + env.decay);
    gainNode.gain.setValueAtTime(gain * env.sustain, startTime + duration - env.release);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    this.activeOscillators.push(osc);

    osc.onended = () => {
      const index = this.activeOscillators.indexOf(osc);
      if (index > -1) this.activeOscillators.splice(index, 1);
    };
  }

  /**
   * Apply vibrato to an oscillator
   * @private
   */
  _applyVibrato(oscillator, startTime) {
    if (!this.audioContext || !oscillator) return;

    const vibratoSettings = MUSIC.VIBRATO || { RATE: 6, DEPTH: 15 };
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = vibratoSettings.RATE;

    // Depth in cents (frequency modulation)
    const currentFreq = oscillator.frequency.value;
    const depthHz = currentFreq * (Math.pow(2, vibratoSettings.DEPTH / 1200) - 1);
    lfoGain.gain.value = depthHz;

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    try {
      lfo.start(startTime);
      this.activeOscillators.push(lfo);
    } catch (e) {
      // Oscillator may have already stopped
    }
  }

  /**
   * Get current track name
   * @returns {string|null}
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Check if music is currently playing
   * @returns {boolean}
   */
  isCurrentlyPlaying() {
    return this.isPlaying && !this.isPaused;
  }
}
