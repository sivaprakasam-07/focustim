import { useAuth } from '../hooks/useAuth';

export const AuthBar: React.FC = () => {
  const { user, loading, error, isConfigured, signInWithGoogle, logout, clearError } = useAuth();

  if (!isConfigured) {
    return (
      <div className="auth-bar-banner not-configured">
        <span className="auth-status-text">
          Local Storage Mode • Firebase env variables not configured
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-bar-banner loading">
        <span className="auth-status-text">Checking authentication status...</span>
      </div>
    );
  }

  return (
    <div className="auth-bar-container">
      {error && (
        <div className="auth-error-banner">
          <span className="auth-error-text">{error}</span>
          <button
            type="button"
            className="btn-dismiss-error"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {user ? (
        <div className="auth-profile-row">
          <div className="user-info">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="user-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="user-avatar-fallback">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="user-text-col">
              <span className="user-name">{user.displayName || user.email}</span>
              <span className="user-sync-status">Cloud Sync Active</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-auth btn-signout"
            onClick={logout}
            aria-label="Sign out from Google"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="auth-signin-row">
          <div className="auth-prompt-col">
            <span className="auth-prompt-title">Cloud Synchronization</span>
            <span className="auth-prompt-sub">Sign in with Google to sync sessions across devices</span>
          </div>

          <button
            type="button"
            className="btn-auth btn-google-signin"
            onClick={signInWithGoogle}
            aria-label="Sign in with Google"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.24 10.285V13.8h6.887C18.2 16.16 16.14 17.8 12.24 17.8c-3.24 0-5.88-2.64-5.88-5.8s2.64-5.8 5.88-5.8c1.58 0 3.01.59 4.13 1.57l2.67-2.67C17.43 3.55 15.02 2.7 12.24 2.7 7.14 2.7 3 6.84 3 12s4.14 9.3 9.24 9.3c5.33 0 8.86-3.75 8.86-9.02 0-.62-.06-1.22-.17-1.995H12.24z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}
    </div>
  );
};
