import '@testing-library/jest-dom/jest-globals';
import { afterEach, beforeAll } from '@jest/globals';
import { cleanup } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
});

class ResizeObserverStub {
  observe(): void {
    /* Stub para jsdom */
  }
  unobserve(): void {
    /* Stub para jsdom */
  }
  disconnect(): void {
    /* Stub para jsdom */
  }
}

function createCanvas2DContextStub(): CanvasRenderingContext2D {
  const noop = () => {
    /* Stub para Canvas 2D no jsdom */
  };
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    arc: noop,
    rect: noop,
    roundRect: noop,
    clip: noop,
    save: noop,
    restore: noop,
    setLineDash: noop,
    fillText: noop,
    measureText: (text: string) => ({ width: text.length * 7 }),
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    configurable: true,
    value: () => createCanvas2DContextStub(),
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

