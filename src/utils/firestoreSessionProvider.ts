import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FocusSession } from '../types/session';
import { LocalStorageSessionProvider } from './sessionStorage';

export class FirestoreSessionProvider {
  private localFallback = new LocalStorageSessionProvider();

  /**
   * Fetches sessions for the authenticated user from `users/{uid}/focusSessions`.
   * Falls back to local storage if Firestore is unreachable or offline.
   */
  async getSessions(uid: string): Promise<FocusSession[]> {
    if (!db || !uid) {
      return this.localFallback.getSessions();
    }

    try {
      const sessionsRef = collection(db, 'users', uid, 'focusSessions');
      // Limit to last 1000 sessions for performance & quota conservation
      const q = query(sessionsRef, orderBy('startedAt', 'desc'), limit(1000));
      const snapshot = await getDocs(q);

      const firestoreSessions: FocusSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data &&
          typeof data.id === 'string' &&
          (data.mode === 'countdown' || data.mode === 'stopwatch') &&
          typeof data.startedAt === 'number' &&
          typeof data.durationSeconds === 'number'
        ) {
          firestoreSessions.push({
            id: data.id,
            mode: data.mode,
            startedAt: data.startedAt,
            endedAt: typeof data.endedAt === 'number' ? data.endedAt : data.startedAt + data.durationSeconds * 1000,
            durationSeconds: data.durationSeconds,
            targetDurationSeconds: typeof data.targetDurationSeconds === 'number' ? data.targetDurationSeconds : 0,
            completed: Boolean(data.completed),
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : data.startedAt,
          });
        }
      });

      // Also merge with any pending local sessions that haven't synced yet
      const localSessions = await this.localFallback.getSessions();
      const firestoreIds = new Set(firestoreSessions.map((s) => s.id));
      const unsynced = localSessions.filter((s) => !firestoreIds.has(s.id));

      if (unsynced.length > 0) {
        // Sync unsynced local sessions to Firestore in the background
        this.syncLocalSessionsToCloud(uid, unsynced).catch((err) =>
          console.warn('Background sync error:', err)
        );
        return [...unsynced, ...firestoreSessions].sort((a, b) => b.startedAt - a.startedAt);
      }

      return firestoreSessions;
    } catch (error) {
      console.warn('Firestore fetch failed, falling back to local session store:', error);
      return this.localFallback.getSessions();
    }
  }

  /**
   * Idempotent save to Firestore `users/{uid}/focusSessions/{sessionId}`.
   * Also mirrors to local storage so offline access and instant responsiveness are guaranteed.
   */
  async saveSession(uid: string | null, session: FocusSession): Promise<void> {
    // Always persist to local fallback first for instant resilience
    await this.localFallback.saveSession(session);

    if (!db || !uid) {
      return;
    }

    try {
      const sessionDocRef = doc(db, 'users', uid, 'focusSessions', session.id);
      await setDoc(
        sessionDocRef,
        {
          id: session.id,
          mode: session.mode,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          durationSeconds: session.durationSeconds,
          targetDurationSeconds: session.targetDurationSeconds,
          completed: session.completed,
          createdAt: session.createdAt,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Failed to save session to Firestore (cached locally):', error);
    }
  }

  /**
   * Deletes a session from Firestore and local storage.
   */
  async deleteSession(uid: string | null, id: string): Promise<void> {
    await this.localFallback.deleteSession(id);

    if (!db || !uid) return;

    try {
      const sessionDocRef = doc(db, 'users', uid, 'focusSessions', id);
      await deleteDoc(sessionDocRef);
    } catch (error) {
      console.warn('Failed to delete session from Firestore:', error);
    }
  }

  /**
   * Synchronizes local sessions into user's Firestore collection.
   */
  async syncLocalSessionsToCloud(uid: string, sessions: FocusSession[]): Promise<void> {
    if (!db || !uid || sessions.length === 0) return;

    for (const session of sessions) {
      try {
        const sessionDocRef = doc(db, 'users', uid, 'focusSessions', session.id);
        await setDoc(
          sessionDocRef,
          {
            ...session,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn(`Failed to sync session ${session.id}:`, err);
      }
    }
  }
}

export const firestoreSessionProvider = new FirestoreSessionProvider();
