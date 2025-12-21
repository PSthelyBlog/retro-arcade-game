/**
 * Chiptune music synthesizer using Web Audio API
 * Plays looping background music with authentic 8-bit sound
 */
import { MUSIC } from '../constants.js';

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
    this.currentStep = 0;
    this.loopId = null;
    this.scheduleAheadTime = 0.1; // Schedule 100ms ahead
    this.lookAhead = 25; // Check every 25ms

    // Active oscillators for cleanup
    this.activeOscillators = [];

    // Track definitions
    this.tracks = this._defineTrack();
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
   * Define all music tracks with melodies, bass lines, and rhythms
   */
  _defineTrack() {
    const N = MUSIC.NOTES;

    return {
      // Title screen theme - mysterious and inviting
      title: {
        bpm: MUSIC.BPM.TITLE,
        loop: true,
        voices: [
          // Lead melody (square wave)
          {
            type: 'square',
            gain: 0.3,
            notes: [
              // Measure 1-2: Opening phrase
              { note: N.E4, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              { note: N.A4, duration: 1 }, { note: N.REST, duration: 0.5 },
              { note: N.E4, duration: 0.25 }, { note: N.G4, duration: 0.25 },
              { note: N.B4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              // Measure 3-4: Response
              { note: N.G4, duration: 1 }, { note: N.E4, duration: 0.5 },
              { note: N.D4, duration: 0.5 }, { note: N.E4, duration: 1 },
              { note: N.REST, duration: 1 },
              // Measure 5-6: Variation
              { note: N.A4, duration: 0.5 }, { note: N.B4, duration: 0.5 },
              { note: N.C5, duration: 1 }, { note: N.B4, duration: 0.5 },
              { note: N.A4, duration: 0.25 }, { note: N.G4, duration: 0.25 },
              { note: N.E4, duration: 1 }, { note: N.REST, duration: 0.5 },
              // Measure 7-8: Resolution
              { note: N.D4, duration: 0.5 }, { note: N.E4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.E4, duration: 2 },
            ]
          },
          // Bass line (triangle wave)
          {
            type: 'triangle',
            gain: 0.4,
            notes: [
              // Measure 1-2
              { note: N.A3, duration: 2 }, { note: N.E3, duration: 2 },
              // Measure 3-4
              { note: N.G3, duration: 2 }, { note: N.A3, duration: 2 },
              // Measure 5-6
              { note: N.A3, duration: 2 }, { note: N.C4, duration: 2 },
              // Measure 7-8
              { note: N.G3, duration: 2 }, { note: N.A3, duration: 2 },
            ]
          }
        ]
      },

      // Battle theme - intense and driving
      battle: {
        bpm: MUSIC.BPM.BATTLE,
        loop: true,
        voices: [
          // Lead melody
          {
            type: 'square',
            gain: 0.25,
            notes: [
              // Measure 1-2: Intense opening
              { note: N.E5, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.REST, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.REST, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.E5, duration: 0.5 }, { note: N.G5, duration: 0.5 },
              { note: N.REST, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              // Measure 3-4: Descent
              { note: N.C5, duration: 0.5 }, { note: N.REST, duration: 0.25 },
              { note: N.G4, duration: 0.5 }, { note: N.REST, duration: 0.25 },
              { note: N.E4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.B4, duration: 0.5 }, { note: N.A4, duration: 0.25 },
              { note: N.G4, duration: 0.25 },
              // Measure 5-6: Rise
              { note: N.E4, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              { note: N.A4, duration: 0.5 }, { note: N.G4, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.D4, duration: 0.5 },
              { note: N.E4, duration: 0.5 }, { note: N.G4, duration: 0.5 },
              { note: N.A4, duration: 0.5 },
              // Measure 7-8: Climax
              { note: N.B4, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.D5, duration: 0.5 }, { note: N.E5, duration: 0.5 },
              { note: N.D5, duration: 0.25 }, { note: N.C5, duration: 0.25 },
              { note: N.B4, duration: 0.5 }, { note: N.A4, duration: 0.5 },
              { note: N.G4, duration: 0.5 }, { note: N.E4, duration: 0.5 },
            ]
          },
          // Driving bass
          {
            type: 'triangle',
            gain: 0.35,
            notes: [
              // Measure 1-2
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.G3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.G4, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              // Measure 3-4
              { note: N.C3, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.C4, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.C3, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.C4, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.A4, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.B3, duration: 0.25 }, { note: N.B3, duration: 0.25 },
              { note: N.B4, duration: 0.25 }, { note: N.B3, duration: 0.25 },
              // Measure 5-8: Repeat with variation
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.E4, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.G3, duration: 0.25 }, { note: N.G3, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.B3, duration: 0.5 }, { note: N.C4, duration: 0.5 },
              { note: N.B3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.G3, duration: 0.5 }, { note: N.E3, duration: 0.5 },
              { note: N.D3, duration: 0.5 }, { note: N.E3, duration: 1.5 },
            ]
          }
        ]
      },

      // Boss theme - urgent and dramatic (wave 10+)
      boss: {
        bpm: MUSIC.BPM.BOSS,
        loop: true,
        voices: [
          // Aggressive lead
          {
            type: 'sawtooth',
            gain: 0.2,
            notes: [
              // Measure 1: Aggressive arpeggio
              { note: N.E4, duration: 0.125 }, { note: N.G4, duration: 0.125 },
              { note: N.B4, duration: 0.125 }, { note: N.E5, duration: 0.125 },
              { note: N.B4, duration: 0.125 }, { note: N.G4, duration: 0.125 },
              { note: N.E4, duration: 0.125 }, { note: N.D4, duration: 0.125 },
              // Measure 2
              { note: N.C4, duration: 0.125 }, { note: N.E4, duration: 0.125 },
              { note: N.G4, duration: 0.125 }, { note: N.C5, duration: 0.125 },
              { note: N.G4, duration: 0.125 }, { note: N.E4, duration: 0.125 },
              { note: N.C4, duration: 0.125 }, { note: N.B3, duration: 0.125 },
              // Measure 3
              { note: N.A3, duration: 0.125 }, { note: N.C4, duration: 0.125 },
              { note: N.E4, duration: 0.125 }, { note: N.A4, duration: 0.125 },
              { note: N.E4, duration: 0.125 }, { note: N.C4, duration: 0.125 },
              { note: N.A3, duration: 0.125 }, { note: N.G3, duration: 0.125 },
              // Measure 4: Build up
              { note: N.E4, duration: 0.125 }, { note: N.E4, duration: 0.125 },
              { note: N.F4, duration: 0.125 }, { note: N.F4, duration: 0.125 },
              { note: N.G4, duration: 0.125 }, { note: N.G4, duration: 0.125 },
              { note: N.A4, duration: 0.25 },
            ]
          },
          // Heavy bass
          {
            type: 'triangle',
            gain: 0.4,
            notes: [
              { note: N.E3, duration: 0.25 }, { note: N.REST, duration: 0.25 },
              { note: N.E3, duration: 0.25 }, { note: N.E3, duration: 0.25 },
              { note: N.C3, duration: 0.25 }, { note: N.REST, duration: 0.25 },
              { note: N.C3, duration: 0.25 }, { note: N.C3, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.REST, duration: 0.25 },
              { note: N.A3, duration: 0.25 }, { note: N.A3, duration: 0.25 },
              { note: N.B3, duration: 0.5 }, { note: N.E3, duration: 0.5 },
            ]
          }
        ]
      },

      // Game over - somber (one-shot)
      gameOver: {
        bpm: MUSIC.BPM.GAME_OVER,
        loop: false,
        voices: [
          {
            type: 'sawtooth',
            gain: 0.25,
            notes: [
              { note: N.G4, duration: 0.5 }, { note: N.F4, duration: 0.5 },
              { note: N.E4, duration: 0.5 }, { note: N.D4, duration: 0.5 },
              { note: N.C4, duration: 1 }, { note: N.REST, duration: 0.5 },
              { note: N.G3, duration: 1.5 },
            ]
          }
        ]
      },

      // Victory - triumphant (one-shot)
      victory: {
        bpm: MUSIC.BPM.VICTORY,
        loop: false,
        voices: [
          {
            type: 'square',
            gain: 0.3,
            notes: [
              { note: N.C5, duration: 0.25 }, { note: N.E5, duration: 0.25 },
              { note: N.G5, duration: 0.25 }, { note: N.C6, duration: 0.75 },
              { note: N.G5, duration: 0.25 }, { note: N.C6, duration: 0.75 },
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
    this.currentStep = 0;
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
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators = [];
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

    const fadeDuration = MUSIC.FADE_DURATION / 1000; // Convert to seconds
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
    }, fadeDuration * 500); // Half the fade duration
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
    // Calculate beat duration from BPM
    const beatDuration = 60 / track.bpm;

    // Pre-calculate all voice sequences
    const voiceStates = track.voices.map(voice => ({
      voice,
      noteIndex: 0,
      timeInTrack: 0
    }));

    // Calculate total track duration
    const totalDuration = this._calculateTrackDuration(track.voices[0], beatDuration);

    this.loopId = setInterval(() => {
      if (!this.isPlaying || this.isPaused || !this.audioContext) return;

      const currentTime = this.audioContext.currentTime;

      // Schedule notes for each voice
      voiceStates.forEach(state => {
        while (state.noteIndex < state.voice.notes.length &&
               this.nextNoteTime + state.timeInTrack < currentTime + this.scheduleAheadTime) {

          const note = state.voice.notes[state.noteIndex];
          const noteDuration = note.duration * beatDuration;

          if (note.note !== 0) { // Not a rest
            this._scheduleNote(
              note.note,
              state.voice.type,
              state.voice.gain,
              this.nextNoteTime + state.timeInTrack,
              noteDuration * 0.9 // Slight gap between notes
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
  _calculateTrackDuration(voice, beatDuration) {
    return voice.notes.reduce((total, note) => total + note.duration * beatDuration, 0);
  }

  /**
   * Schedule a single note
   * @private
   */
  _scheduleNote(frequency, type, gain, startTime, duration) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = type === 'noise' ? 'square' : type; // Fallback for noise
    osc.frequency.value = frequency;

    // Envelope: slight attack/release for less harsh sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.setValueAtTime(gain, startTime + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    this.activeOscillators.push(osc);

    // Clean up oscillator after it stops
    osc.onended = () => {
      const index = this.activeOscillators.indexOf(osc);
      if (index > -1) {
        this.activeOscillators.splice(index, 1);
      }
    };
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
