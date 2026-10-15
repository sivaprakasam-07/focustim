import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirestoreSessionProvider } from './firestoreSessionProvider';
import type { FocusSession } from '../types/session';

// Mock localStorage
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('FirestoreSessionProvider', () => {
  let provider: FirestoreSessionProvider;

  beforeEach(() => {
    localStorageMock.clear();
    provider = new FirestoreSessionProvider();
    vi.clearAllMocks();
  });

  it('saves session to local fallback when no uid provided', async () => {
    const session: FocusSession = {
      id: 'sess_1',
      mode: 'countdown',
      startedAt: 1000,
      endedAt: 25000,
      durationSeconds: 24,
      targetDurationSeconds: 24,
      completed: true,
      createdAt: 1000,
    };

    await provider.saveSession(null, session);
    const retrieved = await provider.getSessions('');

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('sess_1');
    expect(retrieved[0].durationSeconds).toBe(24);
  });

  it('deletes session from local fallback properly', async () => {
    const session: FocusSession = {
      id: 'sess_to_delete',
      mode: 'stopwatch',
      startedAt: 5000,
      endedAt: 15000,
      durationSeconds: 10,
      targetDurationSeconds: 0,
      completed: true,
      createdAt: 5000,
    };

    await provider.saveSession(null, session);
    expect(await provider.getSessions('')).toHaveLength(1);

    await provider.deleteSession(null, 'sess_to_delete');
    expect(await provider.getSessions('')).toHaveLength(0);
  });
});
