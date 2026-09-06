import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Filter,
  Laptop,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import type { JournalEntry, PersonaId, MoodId, ProductivityStatusId, ThemeMode } from '../types';
import { PERSONAS } from '../data/personas';
import { MOOD_OPTIONS, PRODUCTIVITY_OPTIONS } from '../data/metadata';
import type { User } from '../lib/firebase';

interface JournalHistoryListProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignInRedirect?: () => void;
  theme: ThemeMode;
}

export const JournalHistoryList: React.FC<JournalHistoryListProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  user,
  onSignIn,
  onSignInRedirect,
  theme,
}) => {
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersona, setFilterPersona] = useState<PersonaId | 'all'>('all');
  const [filterMood, setFilterMood] = useState<MoodId | 'all'>('all');
  const [filterProductivity, setFilterProductivity] = useState<ProductivityStatusId | 'all'>('all');
  const [filterEncryptedOnly, setFilterEncryptedOnly] = useState(false);

  // Filter entries
  const filtered = entries.filter((entry) => {
    const matchesPersona = filterPersona === 'all' || entry.persona === filterPersona;
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    const matchesProductivity = filterProductivity === 'all' || entry.productivityStatus === filterProductivity;
    const matchesEncrypted = !filterEncryptedOnly || entry.isEncrypted;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesPersona && matchesMood && matchesProductivity && matchesEncrypted;

    const matchesSearch =
      entry.title.toLowerCase().includes(q) ||
      (entry.summary && entry.summary.toLowerCase().includes(q)) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q))) ||
      (entry.sentimentArc && entry.sentimentArc.toLowerCase().includes(q)) ||
      (entry.mood && entry.mood.toLowerCase().includes(q)) ||
      (entry.productivityStatus && entry.productivityStatus.toLowerCase().includes(q));

    return matchesPersona && matchesMood && matchesProductivity && matchesEncrypted && matchesSearch;
  });

  if (!user && entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-lg ${
            isLight
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-indigo-500/5'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-500/10'
          }`}
        >
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Isolated Personal Journal Archive
          </h3>
          <p className={`text-sm max-w-md mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            In adherence to our Zero-Trust Enterprise Constitution, journal entries are stored strictly in private,
            user-isolated Cloud Firestore subcollections.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In to Cloud Firestore</span>
          </button>
          {onSignInRedirect && (
            <button
              onClick={onSignInRedirect}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                isLight
                  ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Redirect Sign-In</span>
            </button>
          )}
          <button
            onClick={onNewEntry}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
              isLight
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            <span>Write Offline on this Device</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Mode Notice if viewing local entries */}
      {!user && entries.length > 0 && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-amber-50/90 border-amber-200 text-amber-950' : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Device-Only Archive:</strong> You have {entries.length} reflection(s) saved on this device. Sign in anytime to sync to private Cloud Firestore.
            </span>
          </div>
          <button
            onClick={onSignIn}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Sync</span>
          </button>
        </div>
      )}

      {/* Top Controls: Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-entries-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries, emotions, productivity, or tags..."
              className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Encrypted Only Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterEncryptedOnly(!filterEncryptedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5 border ${
                filterEncryptedOnly
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypted Only</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Persona Filter */}
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Persona:
          </span>
          <button
            onClick={() => setFilterPersona('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
              filterPersona === 'all'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : isLight
                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {(Object.keys(PERSONAS) as PersonaId[]).map((pid) => (
            <button
              key={pid}
              onClick={() => setFilterPersona(pid)}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                filterPersona === pid
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {PERSONAS[pid].name}
            </button>
          ))}

          {/* Mood Filter */}
          <div className="w-full flex flex-wrap items-center gap-2 pt-1">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Mood:
            </span>
            <button
              onClick={() => setFilterMood('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                filterMood === 'all'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Moods
            </button>
            {MOOD_OPTIONS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setFilterMood(m.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                    filterMood === m.id
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${filterMood === m.id ? 'text-white' : isLight ? m.colorLight : m.colorDark}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Productivity Filter */}
          <div className="w-full flex flex-wrap items-center gap-2 pt-1">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Productivity:
            </span>
            <button
              onClick={() => setFilterProductivity('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                filterProductivity === 'all'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Statuses
            </button>
            {PRODUCTIVITY_OPTIONS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setFilterProductivity(p.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                    filterProductivity === p.id
                      ? 'bg-emerald-600 text-white font-medium shadow-sm'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entries List / Grid */}
      {filtered.length === 0 ? (
        <div
          className={`border rounded-2xl p-12 text-center space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
              isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800/80 text-slate-500'
            }`}
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              No journal entries found
            </h4>
            <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {searchQuery || filterPersona !== 'all' || filterMood !== 'all' || filterProductivity !== 'all' || filterEncryptedOnly
                ? 'Try adjusting your search query or filters.'
                : 'Start your first brainstorm or reflection session with Gemini.'}
            </p>
          </div>
          <button
            onClick={onNewEntry}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compose New Journal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const personaObj = PERSONAS[entry.persona] || PERSONAS.socratic;
            const moodObj = MOOD_OPTIONS.find((m) => m.id === entry.mood);
            const MoodIcon = moodObj?.icon;
            const prodObj = PRODUCTIVITY_OPTIONS.find((p) => p.id === entry.productivityStatus);
            const ProdIcon = prodObj?.icon;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 space-y-4 ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5'
                }`}
              >
                <div className="space-y-3">
                  {/* Persona & Badges Row */}
                  <div className="flex items-center justify-between text-xs gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isLight
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}
                    >
                      {personaObj.name}
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {entry.isEncrypted && (
                        <span title="Zero-Knowledge Client Encrypted" className="text-amber-500">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Mood & Productivity Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {moodObj && MoodIcon && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isLight ? moodObj.bgLight + ' ' + moodObj.colorLight : moodObj.bgDark + ' ' + moodObj.colorDark
                        }`}
                      >
                        <MoodIcon className="w-3 h-3" />
                        <span>{moodObj.label}</span>
                      </span>
                    )}
                    {prodObj && ProdIcon && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isLight ? prodObj.badgeColorLight : prodObj.badgeColorDark
                        }`}
                      >
                        <ProdIcon className="w-3 h-3" />
                        <span>{prodObj.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-sm font-bold transition-colors line-clamp-2 ${
                      isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-200'
                    }`}
                  >
                    {entry.title}
                  </h3>

                  {/* Summary snippet */}
                  <p
                    className={`text-xs font-serif line-clamp-3 leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {entry.summary || entry.content || 'Brainstorming dialogue session.'}
                  </p>
                </div>

                {/* Footer details: Tags & Action prompt */}
                <div
                  className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-slate-100' : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex flex-wrap gap-1 max-w-[70%] overflow-hidden">
                    {entry.tags?.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span
                    className={`font-semibold text-[11px] flex items-center gap-1 transition-colors ${
                      isLight
                        ? 'text-slate-500 group-hover:text-indigo-600'
                        : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
