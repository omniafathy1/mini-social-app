// src/features/auth/components/RegisterForm.jsx
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../../../api/getErrorMessage';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleSignInError, setGoogleSignInError] = useState('');
  const { register, isRegistering, registerError, googleLogin, isGoogleLoading, googleError } = useAuth();

  const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const isPasswordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < MIN_PASSWORD_LENGTH) return;
    register({ name, email, password });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Create your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
          />
        </div>

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
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
          />
          {isPasswordTooShort && (
            <p className="mt-1 text-xs text-amber-600">
              Password must be at least {MIN_PASSWORD_LENGTH} characters ({password.length}/{MIN_PASSWORD_LENGTH})
            </p>
          )}
        </div>

        {registerError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {getErrorMessage(registerError)}
          </p>
        )}

        <button
          type="submit"
          disabled={isRegistering}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
        >
          {isRegistering ? 'Creating account...' : 'Create account'}
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
              text="signup_with"
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
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-blue-600 hover:underline"
        >
          Login
        </button>
      </div>
    </div>
  );
}