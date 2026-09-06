import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  Lightbulb,
  ListTodo,
  HelpCircle,
  Download,
  Trash2,
  Bot,
} from 'lucide-react';
import type { JournalEntry, ThemeMode } from '../types';
import { PERSONAS } from '../data/personas';
import { MOOD_OPTIONS, PRODUCTIVITY_OPTIONS } from '../data/metadata';
import { decryptJournalContent, type EncryptedPayload } from '../lib/crypto';
import type { User } from '../lib/firebase';
import { db, doc, deleteDoc, handleFirestoreError, OperationType } from '../lib/firebase';

interface JournalDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  user: User | null;
  theme: ThemeMode;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  entry,
  onClose,
  onDeleted,
  user,
  theme,
}) => {
  const isLight = theme === 'light';

  const [passphrase, setPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'transcript'>('summary');
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  if (!entry) return null;

  const personaObj = PERSONAS[entry.persona] || PERSONAS.socratic;
  const isEncrypted = entry.isEncrypted;

  const moodObj = MOOD_OPTIONS.find((m) => m.id === entry.mood);
  const MoodIcon = moodObj?.icon;
  const prodObj = PRODUCTIVITY_OPTIONS.find((p) => p.id === entry.productivityStatus);
  const ProdIcon = prodObj?.icon;

  // Handle client-side decryption
  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setDecryptError(null);
    try {
      const parsed: EncryptedPayload = JSON.parse(entry.content);
      const plain = await decryptJournalContent(parsed, passphrase.trim());
      setDecryptedText(plain);
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setDecryptError('Decryption failed. Please verify your private passphrase.');
    }
  };

  // Delete from Cloud Firestore or Local Device
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this journal reflection?')) {
      return;
    }

    if (!user) {
      onDeleted(entry.id);
      onClose();
      return;
    }

    setIsDeleting(true);
    const targetPath = `users/${user.uid}/journals/${entry.id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'journals', entry.id));
      onDeleted(entry.id);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, targetPath);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    const contentToExport = isEncrypted ? decryptedText || '[ENCRYPTED CONTENT]' : entry.content;
    const md = `# ${entry.title}
*Date: ${new Date(entry.createdAt).toLocaleString()}*
*Persona: ${personaObj.name} (${personaObj.tagline})*
*Mood / Emotion: ${moodObj ? `${moodObj.label} ${moodObj.emoji}` : 'Not specified'}*
*Productivity Status: ${prodObj ? prodObj.label : 'Not specified'}*
*Sentiment Arc: ${entry.sentimentArc}*

## Executive Summary
${entry.summary || 'No summary generated.'}

## Key Takeaways
${entry.keyTakeaways?.map((t) => `- ${t}`).join('\n') || '- None'}

## Actionable Commitments
${entry.actionItems?.map((a) => `- [ ] ${a}`).join('\n') || '- None'}

## Reflection Questions
${entry.reflectionQuestions?.map((q) => `> ${q}`).join('\n') || '- None'}

## Notes & Thoughts
${contentToExport}

${
  entry.messages && entry.messages.length > 0
    ? `## Dialogue Transcript\n` +
      entry.messages.map((m) => `**${m.role === 'user' ? 'You' : 'Gemini'}:** ${m.text}`).join('\n\n')
    : ''
}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedContent = isEncrypted ? decryptedText : entry.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div
        id="journal-detail-dialog"
        className={`border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-start justify-between gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                }`}
              >
                {personaObj.name}
              </span>

              {/* Mood Badge */}
              {moodObj && MoodIcon && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isLight ? moodObj.bgLight + ' ' + moodObj.colorLight : moodObj.bgDark + ' ' + moodObj.colorDark
                  }`}
                >
                  <MoodIcon className="w-3 h-3" />
                  <span>Mood: {moodObj.label}</span>
                </span>
              )}

              {/* Productivity Status Badge */}
              {prodObj && ProdIcon && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isLight ? prodObj.badgeColorLight : prodObj.badgeColorDark
                  }`}
                >
                  <ProdIcon className="w-3 h-3" />
                  <span>Productivity: {prodObj.label}</span>
                </span>
              )}

              {isEncrypted && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Zero-Knowledge Encrypted
                </span>
              )}

              <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Calendar className="w-3 h-3" />
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className={`text-lg font-bold tracking-tight break-words ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {entry.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-5 gap-3 ${
            isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/30 border-slate-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? isLight
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-indigo-500 text-indigo-400 font-bold'
                : isLight
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Synthesis</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? isLight
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-indigo-500 text-indigo-400 font-bold'
                : isLight
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Notes & Thoughts</span>
          </button>
          {entry.messages && entry.messages.length > 0 && (
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'transcript'
                  ? isLight
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-indigo-500 text-indigo-400 font-bold'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Dialogue ({entry.messages.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Decryption prompt if encrypted */}
          {isEncrypted && !decryptedText && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                <Lock className="w-4 h-4" />
                <span>Zero-Knowledge Protected Entry</span>
              </div>
              <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                This entry was encrypted with client-side WebCrypto (AES-GCM-256) prior to Firestore persistence.
                Enter your private passphrase to decrypt it locally in browser memory:
              </p>
              <form onSubmit={handleDecrypt} className="flex items-center gap-2">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter private passphrase..."
                  className={`border rounded-lg px-3 py-1.5 text-xs focus:outline-none flex-1 max-w-sm ${
                    isLight
                      ? 'bg-white border-amber-300 text-amber-900 placeholder-amber-400 focus:border-amber-500'
                      : 'bg-slate-950 border-amber-500/40 text-amber-200 placeholder-amber-500/40 focus:border-amber-400'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Decrypt</span>
                </button>
              </form>
              {decryptError && <p className="text-xs text-red-600 font-medium">{decryptError}</p>}
            </div>
          )}

          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  Sentiment Arc:{' '}
                  <span className={`font-semibold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                    {entry.sentimentArc || 'Reflective'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {entry.tags?.map((t, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              {entry.summary ? (
                <div
                  className={`p-4 rounded-xl border leading-relaxed font-serif text-sm whitespace-pre-wrap ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-950 border-slate-800/80 text-slate-200'
                  }`}
                >
                  {entry.summary}
                </div>
              ) : (
                <div
                  className={`p-4 text-center italic rounded-xl ${
                    isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-950/40 text-slate-500'
                  }`}
                >
                  No automated summary generated for this entry.
                </div>
              )}

              {/* Takeaways & Commitments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entry.keyTakeaways?.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Key Takeaways</span>
                    </div>
                    <ul className={`space-y-1.5 list-disc list-inside ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {entry.keyTakeaways.map((t, i) => (
                        <li key={i} className="leading-relaxed">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.actionItems?.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>Actionable Commitments</span>
                    </div>
                    <div className="space-y-1.5">
                      {entry.actionItems.map((a, i) => {
                        const done = completedActions[i];
                        return (
                          <label
                            key={i}
                            className={`flex items-start gap-2 cursor-pointer transition-colors ${
                              isLight ? 'hover:text-slate-900' : 'hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!done}
                              onChange={(e) =>
                                setCompletedActions({ ...completedActions, [i]: e.target.checked })
                              }
                              className="mt-0.5 rounded border-slate-400 bg-white text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={done ? 'line-through opacity-50' : isLight ? 'text-slate-700' : 'text-slate-300'}>
                              {a}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection Questions */}
              {entry.reflectionQuestions?.length > 0 && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-500/5 border-indigo-500/20'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Reflection Questions for Next Session</span>
                  </div>
                  <div className={`space-y-1 italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {entry.reflectionQuestions.map((q, i) => (
                      <p key={i}>“{q}”</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {isEncrypted && !decryptedText ? (
                <div
                  className={`p-6 text-center italic rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  Encrypted payload. Please enter passphrase above to view contents.
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl border font-serif text-sm leading-relaxed whitespace-pre-wrap ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {displayedContent || 'No notes text recorded.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="space-y-3">
              {entry.messages?.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : isLight
                          ? 'bg-slate-200 text-indigo-600'
                          : 'bg-slate-800 text-indigo-400'
                      }`}
                    >
                      {isUser ? 'You' : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : isLight
                          ? 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm font-serif'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm font-serif'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Entry</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
