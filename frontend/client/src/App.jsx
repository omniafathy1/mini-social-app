import { useEffect, useState } from 'react';
import LoginForm from './features/auth/components/LoginForm';
import RegisterForm from './features/auth/components/RegisterForm';
import PostList from './features/posts/components/PostList';
import ProfilePage from './features/users/components/ProfilePage';
import Navbar from './shared/components/Navbar';
import { useAuthStore } from './features/auth/store/authStore';
import { useAuth } from './features/auth/hooks/useAuth';
import { useNavigationStore } from './store/navigationStore';
import { socket } from './socket/socket';
import { useRealtimePosts } from './features/posts/hooks/useRealtimePosts';
import { useRealtimeNotifications } from './features/notification/hooks/useRealtimeNotifications';

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const { logout } = useAuth(); // Triggers server-side token revocation and clears store

  const [isRegistering, setIsRegistering] = useState(false);

  const currentView = useNavigationStore((state) => state.currentView);
  const profileUserId = useNavigationStore((state) => state.profileUserId);
  const viewFeed = useNavigationStore((state) => state.viewFeed);
  const viewProfile = useNavigationStore((state) => state.viewProfile);

  // Manage real-time WebSocket connection lifecycle
  useEffect(() => {
    if (currentUser && token) {
      socket.auth = { token };
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [currentUser, token]);

  // Synchronize WebSocket authorization when access token is refreshed automatically
  useEffect(() => {
    window.__onTokenRefreshed = (newToken) => {
      if (socket.connected) {
        socket.emit('authenticate', { token: newToken });
      } else {
        socket.auth = { token: newToken };
        socket.connect();
      }
    };

    return () => {
      delete window.__onTokenRefreshed;
    };
  }, []);

  useRealtimePosts();
  useRealtimeNotifications();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Social space</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>
          </div>

          {isRegistering ? (
            <RegisterForm onSwitchToLogin={() => setIsRegistering(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setIsRegistering(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar
        currentUser={currentUser}
        onLogout={logout}
        onProfileClick={() => viewProfile(currentUser.id)}
      />

      <main>
        {currentView === 'feed' ? (
          <PostList />
        ) : (
          <>
            <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
              <button
                onClick={viewFeed}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Back to Feed
              </button>
            </div>
            <ProfilePage userId={profileUserId} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;