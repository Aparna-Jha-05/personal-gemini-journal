import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import type { User } from '../lib/firebase';
import type { ThemeMode } from '../types';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSecurityModal: () => void;
  onNewEntry: () => void;
  activeView: 'editor' | 'history';
  setActiveView: (view: 'editor' | 'history') => void;
  entryCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  onOpenSecurityModal,
  onNewEntry,
  activeView,
  setActiveView,
  entryCount,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header
      id="app-header"
      className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isLight
          ? 'border-slate-200 bg-white/90 text-slate-900 shadow-sm'
          : 'border-slate-800/80 bg-slate-950/80 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
            <div
              className={`h-full w-full rounded-[10px] flex items-center justify-center ${
                isLight ? 'bg-white' : 'bg-slate-950'
              }`}
            >
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-base sm:text-lg font-bold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Personal Gemini Journal
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Zero-Trust Active
              </span>
            </div>
            <p className={`text-xs hidden sm:block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Authenticated AI Brainstorming & Isolated Cloud Firestore Persistence
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* View Toggles */}
          <div
            className={`flex items-center rounded-lg p-1 border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              id="nav-editor-btn"
              onClick={() => {
                onNewEntry();
                setActiveView('editor');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeView === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
            <button
              id="nav-history-btn"
              onClick={() => setActiveView('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeView === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Archive ({entryCount})</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/60'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} theme`}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Security Inspector Button */}
          <button
            id="security-inspector-btn"
            onClick={onOpenSecurityModal}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
            title="Inspect Zero-Trust Architecture & Secret Isolation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Security Inspector</span>
          </button>

          {/* User Auth Controls */}
          {user ? (
            <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div
                className={`flex items-center gap-2 border rounded-full py-1 pl-1 pr-3 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
                }`}
                title={`Signed in as ${user.email || user.displayName || user.uid}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-indigo-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span
                  className={`text-xs max-w-[100px] truncate hidden sm:inline ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {user.displayName || user.email?.split('@')[0] || 'Authenticated'}
                </span>
              </div>
              <button
                id="signout-btn"
                onClick={onSignOut}
                className={`p-1.5 rounded-lg border border-transparent transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-red-600 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-red-400 hover:bg-slate-900'
                }`}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="signin-btn"
              onClick={onSignIn}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
