/**
 * Test setup and mocks
 */
import { vi } from 'vitest';

// Mock canvas context
export function createMockCanvas() {
  const canvas = {
    width: 800,
    height: 600,
    style: {},
    getContext: vi.fn(() => createMockContext()),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return canvas;
}

export function createMockContext() {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    imageSmoothingEnabled: true,
  };
}

// Mock Audio Context
export function createMockAudioContext() {
  const gainNode = {
    connect: vi.fn(),
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };

  const oscillatorNode = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'square',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };

  const bufferSourceNode = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
  };

  return {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: vi.fn(() => gainNode),
    createOscillator: vi.fn(() => oscillatorNode),
    createBufferSource: vi.fn(() => bufferSourceNode),
    createBuffer: vi.fn((channels, length, sampleRate) => ({
      getChannelData: vi.fn(() => new Float32Array(length)),
      length,
      sampleRate,
      numberOfChannels: channels,
    })),
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
  };
}

// Mock document.getElementById for canvas
const mockCanvas = createMockCanvas();
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
  if (id === 'gameCanvas') {
    return mockCanvas;
  }
  return null;
});

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock AudioContext
global.AudioContext = vi.fn(() => createMockAudioContext());
global.webkitAudioContext = global.AudioContext;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.store = {};
});
