import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { mockDatabaseClient } from './mocks/dbClientMock';

// Extender los matchers de Vitest con los de Testing Library
expect.extend(matchers);

// Limpiar después de cada test
afterEach(() => {
  cleanup();
  mockDatabaseClient.reset();
});

// Mock global para localStorage en tests
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

// Configuración global para todos los tests
global.localStorage = new LocalStorageMock();

// Mock de fetch para tests
global.fetch = vi.fn();

// Suprimir logs en tests a menos que estemos en modo debug
if (!process.env.DEBUG) {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
}
