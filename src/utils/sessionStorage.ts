import type { FocusSession } from '../types/session';

const SESSIONS_STORAGE_KEY = 'focusflow_sessions_v1';

export interface SessionStorageProvider {
  getSessions(): Promise<FocusSession[]>;
  saveSession(session: FocusSession): Promise<void>;
  deleteSession?(id: string): Promise<void>;
  clearAllSessions?(): Promise<void>;
}

export class LocalStorageSessionProvider implements SessionStorageProvider {
  async getSessions(): Promise<FocusSession[]> {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Validate & sanitize records
      return parsed.filter((item): item is FocusSession => {
        return (
          item &&
          typeof item.id === 'string' &&
          (item.mode === 'countdown' || item.mode === 'stopwatch') &&
          typeof item.startedAt === 'number' &&
          typeof item.endedAt === 'number' &&
          typeof item.durationSeconds === 'number' &&
          item.durationSeconds > 0
        );
      }).sort((a, b) => b.startedAt - a.startedAt);
    } catch (error) {
      console.warn('Failed to parse sessions from localStorage:', error);
      return [];
    }
  }

  async saveSession(session: FocusSession): Promise<void> {
    try {
      const existing = await this.getSessions();
      // Guard against duplicate ID
      const index = existing.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        existing[index] = session;
      } else {
        existing.unshift(session);
      }
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      const existing = await this.getSessions();
      const filtered = existing.filter((s) => s.id !== id);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to delete session from localStorage:', error);
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear sessions from localStorage:', error);
    }
  }
}

export const defaultSessionStorage = new LocalStorageSessionProvider();
