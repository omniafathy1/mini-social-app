// src/features/auth/components/LoginForm.jsx
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../../../api/getErrorMessage';

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleSignInError, setGoogleSignInError] = useState('');
  const { login, isLoggingIn, loginError, googleLogin, isGoogleLoading, googleError } = useAuth();

  const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    login({ email, password });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Login to your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
          />
        </div>

        {loginError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {getErrorMessage(loginError)}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="my-5 flex items-center justify-between">
        <span className="h-px w-full bg-slate-200"></span>
        <span className="px-2 text-xs font-medium text-slate-400">OR</span>
        <span className="h-px w-full bg-slate-200"></span>
      </div>

      <div className="flex flex-col items-center justify-center">
        {isGoogleConfigured ? (
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  setGoogleSignInError('');
                  googleLogin({ credential: credentialResponse.credential });
                } else {
                  setGoogleSignInError('Google did not return a sign-in credential. Please try again.');
                }
              }}
              onError={() => {
                setGoogleSignInError('Google sign-in failed. Please try again.');
              }}
              useOneTap={false}
              shape="pill"
              text="continue_with"
              width="300"
            />
          </div>
        ) : (
          <p role="status" className="w-full rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend and
            GOOGLE_CLIENT_ID in the backend to the same Google OAuth client ID.
          </p>
        )}

        {isGoogleLoading && (
          <p className="mt-2 text-xs text-blue-600 animate-pulse">Connecting to Google...</p>
        )}

        {(googleSignInError || googleError) && (
          <p role="alert" className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {googleSignInError || getErrorMessage(googleError)}
          </p>
        )}
      </div>

      <div className="mt-5 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-blue-600 hover:underline"
        >
          Create one
        </button>
      </div>
    </div>
  );
}