/**
 * PulseOscillator - Emulates NES 2A03 pulse wave channel
 * Supports variable duty cycle (12.5%, 25%, 50%, 75%) and PWM modulation
 */
export class PulseOscillator {
  /**
   * @param {AudioContext} audioContext
   * @param {number} dutyCycle - Initial duty cycle (0.125, 0.25, 0.5, or 0.75)
   */
  constructor(audioContext, dutyCycle = 0.5) {
    this.audioContext = audioContext;
    this.dutyCycle = dutyCycle;

    // Create oscillator and gain for PWM effect
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;

    // PWM modulation state
    this.pwmLfo = null;
    this.pwmGain = null;
    this.pwmEnabled = false;
  }

  /**
   * Create a pulse wave oscillator using PeriodicWave
   * The NES generated pulse waves by switching between high (1) and low (0)
   * Duty cycle determines the ratio of high to low
   */
  _createPulseWave() {
    // Generate Fourier coefficients for pulse wave
    // A pulse wave with duty cycle D has harmonics:
    // a_n = (2/nπ) * sin(nπD)
    const numHarmonics = 64;
    const real = new Float32Array(numHarmonics);
    const imag = new Float32Array(numHarmonics);

    real[0] = 0; // DC offset
    imag[0] = 0;

    for (let n = 1; n < numHarmonics; n++) {
      real[n] = 0;
      // Fourier series for pulse wave
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * this.dutyCycle);
    }

    return this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  /**
   * Start playing at the given frequency
   * @param {number} frequency - Hz
   * @param {GainNode} destination - Output node to connect to
   * @param {number} startTime - Audio context time to start
   */
  start(frequency, destination, startTime = 0) {
    if (!this.audioContext) return;

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    // Set custom pulse wave
    this.oscillator.setPeriodicWave(this._createPulseWave());
    this.oscillator.frequency.value = frequency;

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(destination);

    this.oscillator.start(startTime);
    this.isPlaying = true;

    return this;
  }

  /**
   * Stop the oscillator
   * @param {number} stopTime - Audio context time to stop
   */
  stop(stopTime = 0) {
    if (this.oscillator && this.isPlaying) {
      try {
        this.oscillator.stop(stopTime);
      } catch (e) {
        // Already stopped
      }
      this.isPlaying = false;
    }

    // Clean up PWM if enabled
    if (this.pwmLfo) {
      try {
        this.pwmLfo.stop();
      } catch (e) {}
    }
  }

  /**
   * Enable PWM modulation (thickens the sound)
   * @param {number} rate - LFO rate in Hz
   * @param {number} depth - Modulation depth (0-0.5)
   */
  enablePWM(rate = 2, depth = 0.2) {
    if (!this.oscillator || !this.audioContext) return;

    // PWM is achieved by modulating the waveform
    // For Web Audio, we modulate the detune parameter
    this.pwmLfo = this.audioContext.createOscillator();
    this.pwmGain = this.audioContext.createGain();

    this.pwmLfo.type = 'sine';
    this.pwmLfo.frequency.value = rate;

    // Detune in cents (100 cents = 1 semitone)
    // Small detuning creates a "chorus-like" thickening effect
    this.pwmGain.gain.value = depth * 50; // Convert to cents

    this.pwmLfo.connect(this.pwmGain);
    this.pwmGain.connect(this.oscillator.detune);

    this.pwmLfo.start();
    this.pwmEnabled = true;
  }

  /**
   * Set duty cycle dynamically
   * @param {number} dutyCycle - 0.125, 0.25, 0.5, or 0.75
   */
  setDutyCycle(dutyCycle) {
    this.dutyCycle = dutyCycle;
    if (this.oscillator) {
      this.oscillator.setPeriodicWave(this._createPulseWave());
    }
  }

  /**
   * Set frequency dynamically
   * @param {number} frequency - Hz
   * @param {number} time - Audio context time for the change
   */
  setFrequency(frequency, time = 0) {
    if (this.oscillator) {
      if (time === 0) {
        this.oscillator.frequency.value = frequency;
      } else {
        this.oscillator.frequency.setValueAtTime(frequency, time);
      }
    }
  }

  /**
   * Get the gain node for envelope control
   * @returns {GainNode}
   */
  getGainNode() {
    return this.gainNode;
  }

  /**
   * Get the oscillator for direct manipulation
   * @returns {OscillatorNode}
   */
  getOscillator() {
    return this.oscillator;
  }
}
