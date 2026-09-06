import React, { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
  db,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import type { JournalEntry, ThemeMode } from './types';
import { Header } from './components/Header';
import { JournalEditor } from './components/JournalEditor';
import { JournalHistoryList } from './components/JournalHistoryList';
import { JournalDetailModal } from './components/JournalDetailModal';
import { SecurityInspectorModal } from './components/SecurityInspectorModal';
import {
  ShieldCheck,
  ExternalLink,
  CloudUpload,
  Upload,
  AlertTriangle,
  LogIn,
  Laptop,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('journal_local_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'editor' | 'history'>('editor');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthGuideModal, setShowAuthGuideModal] = useState(false);

  // Theme state: default to 'light' (as requested) with user persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('journal_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('journal_theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // 1. Initialize Firebase Auth state listener and test Firestore connection
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Firestore connection initial check:', err);
    });

    // Check redirect result if user came back from Google OAuth redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
        }
      })
      .catch((err: any) => {
        console.warn('Redirect auth result error:', err);
        if (err.code !== 'auth/null-user') {
          setAuthError(err.message || 'Redirect sign-in completed with an error.');
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync with User-Isolated Subcollection (/users/{userId}/journals)
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const journalsPath = `users/${user.uid}/journals`;
    const journalsRef = collection(db, 'users', user.uid, 'journals');
    const q = query(journalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedEntries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          loadedEntries.push(docSnap.data() as JournalEntry);
        });
        setEntries(loadedEntries);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, journalsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sign In with Popup Handler
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const msg = err.message || 'Failed to sign in with Google.';
      setAuthError(msg);
      setShowAuthGuideModal(true);
    }
  };

  // Sign In with Redirect Handler (Bypasses popup blocker & multi-account session clashes)
  const handleSignInRedirect = async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Redirect sign-in error:', err);
      setAuthError(err.message || 'Failed to launch redirect sign-in.');
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setEntries([]);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Sync local entries to Cloud Firestore
  const handleSyncLocalToFirestore = async () => {
    if (!user || localEntries.length === 0) return;
    setIsSyncing(true);
    try {
      for (const entry of localEntries) {
        const cloudEntry: JournalEntry = {
          ...entry,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid, 'journals', entry.id), cloudEntry);
      }
      localStorage.removeItem('journal_local_entries');
      setLocalEntries([]);
      setSyncFeedback(`Successfully synced ${localEntries.length} reflection(s) to Cloud Firestore!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      console.error('Sync error:', err);
      setAuthError('Failed to sync entries to Cloud Firestore: ' + (err.message || String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle new entry saved
  const handleSavedEntry = (newEntry: JournalEntry) => {
    if (!user) {
      // Save locally into device archive
      setLocalEntries((prev) => {
        const next = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
        try {
          localStorage.setItem('journal_local_entries', JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setEntries((prev) => {
        const exists = prev.some((e) => e.id === newEntry.id);
        if (exists) return prev.map((e) => (e.id === newEntry.id ? newEntry : e));
        return [newEntry, ...prev];
      });
    }
    setSelectedEntry(newEntry);
  };

  // Handle entry deleted
  const handleDeletedEntry = (deletedId: string) => {
    if (!user) {
      setLocalEntries((prev) => {
        const next = prev.filter((e) => e.id !== deletedId);
        try {
          localStorage.setItem('journal_local_entries', JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    }
  };

  const activeEntries = user ? entries : localEntries;

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isLight
          ? 'bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900'
          : 'bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200'
      }`}
    >
      {/* Top Header */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onNewEntry={() => setActiveView('editor')}
        activeView={activeView}
        setActiveView={setActiveView}
        entryCount={activeEntries.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sync Success Feedback */}
        {syncFeedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="p-1 text-emerald-700 dark:text-emerald-300 hover:opacity-100 opacity-60"
            >
              &times;
            </button>
          </div>
        )}

        {/* Local Entries Sync Prompt Banner when user signs in */}
        {user && localEntries.length > 0 && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm ${
              isLight
                ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
                : 'bg-indigo-950/50 border-indigo-800/80 text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-600/20">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold">
                  You have {localEntries.length} reflection{localEntries.length > 1 ? 's' : ''} saved on this device.
                </p>
                <p className="text-[11px] opacity-80">
                  Sync them now to your private, hardened Cloud Firestore collection.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncLocalToFirestore}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud Firestore'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Auth Error Banner with Instant Solutions */}
        {authError && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs space-y-3 shadow-sm ${
              isLight ? 'bg-amber-50/90 border-amber-200 text-amber-950' : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Unable to Complete Google Sign-In</p>
                  <p className="text-xs opacity-90 mt-0.5">{authError}</p>
                </div>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100"
                title="Dismiss"
              >
                &times;
              </button>
            </div>

            <div
              className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
                isLight ? 'bg-white/80 border-amber-200/80 text-slate-700' : 'bg-slate-900/60 border-amber-900/50 text-slate-300'
              }`}
            >
              <p className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Encountering Google's "401 Bad Request: Request is malformed"?
              </p>
              <p>
                This error happens when Google Chrome has multiple Google accounts logged into the same profile.
                Choose one of these instant fixes:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Incognito / Private Window (Fastest)</strong>: Press <kbd className="font-mono px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Ctrl+Shift+N</kbd> (or <kbd className="font-mono px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Cmd+Shift+N</kbd>) and open the app URL.
                </li>
                <li>
                  <strong>Use Full-Page Redirect Sign-In</strong>: Click the button below to navigate directly to Google OAuth without the popup window.
                </li>
                <li>
                  <strong>Save to Device (Zero Friction)</strong>: You can continue writing and saving reflections locally right now without signing in.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleSignInRedirect}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Full-Page Redirect Sign-In</span>
              </button>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setAuthError(null);
                  setActiveView('editor');
                }}
                className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Continue in Device Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {activeView === 'editor' ? (
          <JournalEditor
            user={user}
            onSaved={handleSavedEntry}
            onSignInRequired={handleSignIn}
            onSignInRedirect={handleSignInRedirect}
            theme={theme}
          />
        ) : (
          <JournalHistoryList
            entries={activeEntries}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onNewEntry={() => setActiveView('editor')}
            user={user}
            onSignIn={handleSignIn}
            onSignInRedirect={handleSignInRedirect}
            theme={theme}
          />
        )}
      </main>

      {/* Modals */}
      <JournalDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDeleted={handleDeletedEntry}
        user={user}
        theme={theme}
      />

      <SecurityInspectorModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={user}
        theme={theme}
      />

      {/* Footer */}
      <footer
        className={`border-t py-4 px-4 text-center text-xs transition-colors ${
          isLight
            ? 'border-slate-200 bg-white/80 text-slate-500'
            : 'border-slate-900 bg-slate-950/60 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Personal Gemini Journal • Hardened Cloud Firestore ABAC & Server-Side Secret Management</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Security Telemetry
            </button>
            <span>•</span>
            <span>Zero Cross-Tenant Leakage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
