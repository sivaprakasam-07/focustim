import { auth } from '../lib/firebase';
import { firestoreSessionProvider } from './firestoreSessionProvider';
import type { FocusSession } from '../types/session';

/**
 * Unified session service integrating Firestore cloud synchronization
 * with local persistence fallback.
 */
export const sessionService = {
  getSessions: async (uid?: string | null): Promise<FocusSession[]> => {
    const currentUid = uid !== undefined ? uid : (auth?.currentUser?.uid ?? null);
    return firestoreSessionProvider.getSessions(currentUid || '');
  },

  saveSession: async (session: FocusSession, uid?: string | null): Promise<void> => {
    const currentUid = uid !== undefined ? uid : (auth?.currentUser?.uid ?? null);
    await firestoreSessionProvider.saveSession(currentUid, session);
  },

  deleteSession: async (id: string, uid?: string | null): Promise<void> => {
    const currentUid = uid !== undefined ? uid : (auth?.currentUser?.uid ?? null);
    await firestoreSessionProvider.deleteSession(currentUid, id);
  },
};
