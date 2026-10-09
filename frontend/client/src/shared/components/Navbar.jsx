import React from 'react';
import NotificationBell from '../../features/notification/components/NotificationBell';

export default function Navbar({ currentUser, onLogout, onProfileClick }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-lg font-black text-white shadow-lg shadow-blue-500/25">
            C
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-600">Social space</p>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Connect</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBell />

         <button
            type="button"
            onClick={onProfileClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:scale-[1.02]"
            title="Go to Profile"
            aria-label="Go to profile"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser?.name || 'Profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'
            )}
          </button>

          <span className="hidden text-sm font-semibold text-slate-700 sm:inline-block">{currentUser.name}</span>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}