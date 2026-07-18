import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { handlers } from "../mocks/handlers";

// Sigma imports expect WebGL constructors to exist during module evaluation.
// Jsdom does not provide them, so expose a minimal stub for test bootstrapping.
if (typeof window.WebGL2RenderingContext === "undefined") {
  /**
   *
   */
  class MockWebGL2RenderingContext {}

  Object.defineProperty(window, "WebGL2RenderingContext", {
    configurable: true,
    value: MockWebGL2RenderingContext,
  });
  Object.defineProperty(globalThis, "WebGL2RenderingContext", {
    configurable: true,
    value: MockWebGL2RenderingContext,
  });
}

if (typeof window.WebGLRenderingContext === "undefined") {
  /**
   *
   */
  class MockWebGLRenderingContext {}

  Object.defineProperty(window, "WebGLRenderingContext", {
    configurable: true,
    value: MockWebGLRenderingContext,
  });
  Object.defineProperty(globalThis, "WebGLRenderingContext", {
    configurable: true,
    value: MockWebGLRenderingContext,
  });
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    /**
     *
     */
    getItem: (key: string) => store[key] || null,
    /**
     *
     */
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    /**
     *
     */
    removeItem: (key: string) => {
      delete store[key];
    },
    /**
     *
     */
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
