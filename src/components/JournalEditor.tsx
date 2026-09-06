import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Bot,
  CheckCircle2,
  RefreshCw,
  Save,
  Tag,
  ListTodo,
  Lightbulb,
  HelpCircle,
  Compass,
  Smile,
  Zap,
  Sun,
  Activity,
  Heart,
  Minus,
  Target,
  Flame,
  Wind,
  Coffee,
  Download,
  ExternalLink,
  LogIn,
  FileDown,
  Clock,
  Laptop,
} from 'lucide-react';
import type {
  PersonaId,
  JournalMode,
  ChatMessage,
  JournalEntry,
  MoodId,
  ProductivityStatusId,
  ThemeMode,
} from '../types';
import { PERSONAS } from '../data/personas';
import { MOOD_OPTIONS, PRODUCTIVITY_OPTIONS } from '../data/metadata';
import { scanForPii, redactPii } from '../lib/pii';
import { encryptJournalContent } from '../lib/crypto';
import type { User } from '../lib/firebase';
import { db, doc, setDoc, handleFirestoreError, OperationType } from '../lib/firebase';

interface JournalEditorProps {
  user: User | null;
  onSaved: (entry: JournalEntry) => void;
  onSignInRequired: () => void;
  onSignInRedirect?: () => void;
  theme: ThemeMode;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  onSaved,
  onSignInRequired,
  onSignInRedirect,
  theme,
}) => {
  const isLight = theme === 'light';

  // State
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('socratic');
  const [mode, setMode] = useState<JournalMode>('journal');
  const [selectedMood, setSelectedMood] = useState<MoodId>('reflective');
  const [selectedProductivity, setSelectedProductivity] = useState<ProductivityStatusId>('in_flow');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Sparks
  const [sparks, setSparks] = useState<string[]>([
    'What belief did you hold strongly 6 months ago that you are beginning to question today?',
    'If the decision you are delaying had zero social friction, what would you choose right now?',
    'Where are you currently applying effort that produces anxiety rather than progress?',
    'What is something you are proud of navigating this past week?',
  ]);
  const [loadingSparks, setLoadingSparks] = useState(false);

  // Security features
  const [zeroKnowledgeActive, setZeroKnowledgeActive] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false);

  // AI Generated Synthesis preview
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    keyTakeaways: string[];
    actionItems: string[];
    sentimentArc: string;
    reflectionQuestions: string[];
    tags: string[];
  } | null>(null);

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Real-time PII detection
  const detectedPii = scanForPii(content + ' ' + chatInput);

  const handleRedactPii = () => {
    setContent((prev) => redactPii(prev));
    setChatInput((prev) => redactPii(prev));
    setFeedback({ type: 'info', text: 'PII Shield: Sensitive identifiers successfully sanitized.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Auto-load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('journal_active_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title && !title) setTitle(draft.title);
        if (draft.content && !content) setContent(draft.content);
        if (draft.mode) setMode(draft.mode);
        if (draft.persona) setSelectedPersona(draft.persona);
        if (draft.mood) setSelectedMood(draft.mood);
        if (draft.productivity) setSelectedProductivity(draft.productivity);
        if (draft.messages && draft.messages.length > 0 && messages.length === 0) {
          setMessages(draft.messages);
        }
        setLastDraftSaved('Restored from browser draft');
      }
    } catch (e) {
      console.warn('Could not restore draft:', e);
    }
  }, []);

  // Auto-save draft to localStorage whenever content changes
  useEffect(() => {
    if (!title && !content && messages.length === 0) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'journal_active_draft',
          JSON.stringify({
            title,
            content,
            mode,
            persona: selectedPersona,
            mood: selectedMood,
            productivity: selectedProductivity,
            messages,
            updatedAt: new Date().toISOString(),
          })
        );
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastDraftSaved(`Saved locally at ${timeStr}`);
      } catch (e) {
        console.warn('Could not save draft to local storage:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, content, mode, selectedPersona, selectedMood, selectedProductivity, messages]);

  // Export current draft as Markdown file
  const handleExportMarkdown = () => {
    const persona = PERSONAS[selectedPersona].name;
    const mood = MOOD_OPTIONS.find((m) => m.id === selectedMood)?.label || selectedMood;
    const productivity =
      PRODUCTIVITY_OPTIONS.find((p) => p.id === selectedProductivity)?.label || selectedProductivity;
    const dateStr = new Date().toLocaleString();

    let md = `# ${title.trim() || 'Untitled Reflection'}\n\n`;
    md += `*Generated: ${dateStr}*\n`;
    md += `*Persona: ${persona} | Mode: ${mode} | Mood: ${mood} | Status: ${productivity}*\n\n`;
    md += `## Journal Thoughts\n\n${content || '*(No thoughts written)*'}\n\n`;

    if (summaryData?.summary) {
      md += `## Executive Summary\n\n${summaryData.summary}\n\n`;
      if (summaryData.keyTakeaways?.length) {
        md += `### Key Takeaways\n${summaryData.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n`;
      }
      if (summaryData.actionItems?.length) {
        md += `### Action Items\n${summaryData.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n`;
      }
      if (summaryData.reflectionQuestions?.length) {
        md += `### Reflection Questions\n${summaryData.reflectionQuestions.map((q) => `- ${q}`).join('\n')}\n\n`;
      }
    }

    if (messages.length > 0) {
      md += `## Brainstorm Conversation with ${persona}\n\n`;
      messages.forEach((m) => {
        const sender = m.role === 'user' ? 'You' : persona;
        md += `**${sender}** (${new Date(m.timestamp).toLocaleTimeString()}):\n${m.text}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (title.trim() || 'journal_entry').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanTitle}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', text: 'Downloaded entry as Markdown file (.md)!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Fetch fresh sparks
  const fetchSparks = async () => {
    setLoadingSparks(true);
    try {
      const res = await fetch('/api/gemini/sparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: selectedPersona, theme: mode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sparks && data.sparks.length > 0) {
          setSparks(data.sparks);
        }
      }
    } catch (e) {
      console.error('Failed to load sparks:', e);
    } finally {
      setLoadingSparks(false);
    }
  };

  // Send message in multi-turn conversation
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isAiReplying) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput('');
    setIsAiReplying(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: newMessages.slice(0, -1),
          persona: selectedPersona,
          mode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get AI response');
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, modelMsg]);
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'AI service error. Please try again.' });
    } finally {
      setIsAiReplying(false);
    }
  };

  // Trigger Gemini automatic summarization & synthesis
  const handleAutoSummarize = async () => {
    if (!content.trim() && messages.length === 0) {
      setFeedback({ type: 'info', text: 'Please write some thoughts or chat with Gemini before summarizing.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsSummarizing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalText: content,
          messages,
          persona: selectedPersona,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Summarization failed');
      }

      const data = await res.json();
      if (data.title && !title) {
        setTitle(data.title);
      }
      setSummaryData({
        summary: data.summary || '',
        keyTakeaways: data.keyTakeaways || [],
        actionItems: data.actionItems || [],
        sentimentArc: data.sentimentArc || 'Reflective',
        reflectionQuestions: data.reflectionQuestions || [],
        tags: data.tags || [],
      });
      setFeedback({ type: 'success', text: 'Gemini synthesized structured insights and summary!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Error generating summary.' });
    } finally {
      setIsSummarizing(false);
    }
  };

  // Save to Local Device Archive (Offline / Zero-Auth mode)
  const handleSaveLocalEntry = async () => {
    if (!title.trim() && !content.trim() && messages.length === 0) {
      setFeedback({ type: 'error', text: 'Please provide a title or content before saving.' });
      return;
    }

    if (zeroKnowledgeActive && !passphrase.trim()) {
      setShowPassphrasePrompt(true);
      setFeedback({ type: 'error', text: 'Please enter an encryption passphrase to encrypt this entry.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const entryId = 'local_' + Date.now();
      const finalTitle = title.trim() || `Reflection: ${new Date().toLocaleDateString()}`;

      let finalContent = content;
      let encryptionIv = '';

      if (zeroKnowledgeActive && passphrase.trim()) {
        const encrypted = await encryptJournalContent(content, passphrase.trim());
        finalContent = JSON.stringify(encrypted);
        encryptionIv = encrypted.iv;
      }

      const newEntry: JournalEntry = {
        id: entryId,
        userId: user?.uid || 'local_user',
        title: finalTitle.slice(0, 200),
        content: finalContent,
        persona: selectedPersona,
        mode,
        mood: selectedMood,
        productivityStatus: selectedProductivity,
        messages,
        summary: summaryData?.summary || '',
        keyTakeaways: summaryData?.keyTakeaways || [],
        actionItems: summaryData?.actionItems || [],
        reflectionQuestions: summaryData?.reflectionQuestions || [],
        sentimentArc: summaryData?.sentimentArc || 'Neutral',
        tags: summaryData?.tags || ['journal'],
        isEncrypted: zeroKnowledgeActive,
        encryptionIv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.removeItem('journal_active_draft');
        setLastDraftSaved(null);
      } catch {}

      setShowSignInModal(false);
      setFeedback({
        type: 'success',
        text: 'Saved securely to this device! You can view it in the Archive or sync to cloud anytime.',
      });

      onSaved(newEntry);
    } catch (err: any) {
      console.error('Save to device error:', err);
      setFeedback({ type: 'error', text: err.message || 'Failed to save entry to device.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save to Cloud Firestore
  const handleSaveEntry = async () => {
    if (!user) {
      // Auto-save draft locally first so writing is never lost
      try {
        localStorage.setItem(
          'journal_active_draft',
          JSON.stringify({
            title,
            content,
            mode,
            persona: selectedPersona,
            mood: selectedMood,
            productivity: selectedProductivity,
            messages,
            updatedAt: new Date().toISOString(),
          })
        );
        setLastDraftSaved('Draft saved locally');
      } catch {}
      setShowSignInModal(true);
      onSignInRequired();
      return;
    }

    if (!title.trim() && !content.trim() && messages.length === 0) {
      setFeedback({ type: 'error', text: 'Please provide a title or content before saving.' });
      return;
    }

    if (zeroKnowledgeActive && !passphrase.trim()) {
      setShowPassphrasePrompt(true);
      setFeedback({ type: 'error', text: 'Please enter an encryption passphrase to encrypt this entry.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const entryId = 'entry_' + Date.now();
      const finalTitle = title.trim() || `Reflection: ${new Date().toLocaleDateString()}`;

      let finalContent = content;
      let encryptionIv = '';

      // Zero-Knowledge WebCrypto AES-GCM
      if (zeroKnowledgeActive && passphrase.trim()) {
        const encrypted = await encryptJournalContent(content, passphrase.trim());
        finalContent = JSON.stringify(encrypted);
        encryptionIv = encrypted.iv;
      }

      const newEntry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: finalTitle.slice(0, 200),
        content: finalContent,
        persona: selectedPersona,
        mode,
        mood: selectedMood,
        productivityStatus: selectedProductivity,
        messages,
        summary: summaryData?.summary || '',
        keyTakeaways: summaryData?.keyTakeaways || [],
        actionItems: summaryData?.actionItems || [],
        reflectionQuestions: summaryData?.reflectionQuestions || [],
        sentimentArc: summaryData?.sentimentArc || 'Neutral',
        tags: summaryData?.tags || ['journal'],
        isEncrypted: zeroKnowledgeActive,
        encryptionIv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to user-isolated collection: /users/{userId}/journals/{journalId}
      const targetPath = `users/${user.uid}/journals/${entryId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'journals', entryId), newEntry);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, targetPath);
      }

      // Clear local draft upon confirmed cloud persistence
      try {
        localStorage.removeItem('journal_active_draft');
        setLastDraftSaved(null);
      } catch {}

      setFeedback({
        type: 'success',
        text: zeroKnowledgeActive
          ? 'Securely encrypted via WebCrypto & saved to Cloud Firestore!'
          : 'Successfully saved to isolated Cloud Firestore!',
      });

      onSaved(newEntry);
    } catch (error: any) {
      console.error('Save error:', error);
      let errorMsg = error.message || 'Failed to persist journal entry.';
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error) {
          if (parsed.error.includes('Missing or insufficient permissions')) {
            errorMsg = 'Permission denied by Firestore security rules. Please make sure you are signed in with the authorized account.';
          } else {
            errorMsg = `Database: ${parsed.error}`;
          }
        }
      } catch {
        // Not JSON
      }
      setFeedback({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const personaObj = PERSONAS[selectedPersona];

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedback.type === 'error'
              ? isLight
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
              : isLight
              ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : feedback.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* PII Shield Alert Banner */}
      {detectedPii.length > 0 && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>PII Shield Warning:</strong> Detected {detectedPii.length} sensitive item(s) (
              {detectedPii.map((p) => p.type).join(', ')}) in active text.
            </span>
          </div>
          <button
            onClick={handleRedactPii}
            className={`px-3 py-1 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-amber-200 hover:bg-amber-300 text-amber-900 border-amber-400'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auto-Sanitize & Redact</span>
          </button>
        </div>
      )}

      {/* Mood & Emotion Selector + Productivity Status Row */}
      <div
        className={`p-4 rounded-2xl border space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-sm'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Emotion / Mood Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Emotion / Mood State
              </label>
              <span className={`text-[11px] font-medium capitalize ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                Active: {selectedMood}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                        : isLight
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isLight ? m.colorLight : m.colorDark}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Productivity Status Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Productivity Status
              </label>
              <span className={`text-[11px] font-medium capitalize ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {PRODUCTIVITY_OPTIONS.find((p) => p.id === selectedProductivity)?.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCTIVITY_OPTIONS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedProductivity === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductivity(p.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                        : isLight
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Persona Selection Grid */}
      <div className="space-y-2">
        <label
          className={`text-xs font-semibold uppercase tracking-wider ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Select AI Reflection Persona
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(PERSONAS) as PersonaId[]).map((key) => {
            const p = PERSONAS[key];
            const isSelected = selectedPersona === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPersona(key)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? isLight
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                      : 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? (isLight ? 'text-indigo-900' : 'text-white') : isLight ? 'text-slate-900' : 'text-slate-300'}`}>
                    {p.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : isLight
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Journal Title & Free-Write Scratchpad */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div
            className={`border rounded-2xl p-5 space-y-4 transition-colors flex flex-col flex-1 min-h-[580px] lg:min-h-[620px] ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-sm'
            }`}
          >
            {/* Title & Mode */}
            <div className="space-y-3">
              <input
                id="journal-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your session or entry a title..."
                className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                }`}
              />

              {/* Mode Badges */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                {(['journal', 'brainstorm', 'deep_dive', 'quick_entry'] as JournalMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      mode === m
                        ? isLight
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 font-medium'
                          : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Thoughts / Journal Textarea */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-2">
                  <span>Personal Thoughts & Unfiltered Notes</span>
                  {lastDraftSaved && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {lastDraftSaved}
                    </span>
                  )}
                </span>
                <span>
                  {content.length} chars • {content.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                id="journal-content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Write freely here. Share what is on your mind, recent decisions, tensions, or creative sparks...\n\nYour selected companion (${personaObj.name}) will synthesize your thoughts and brainstorm with you on the right.`}
                className={`w-full flex-1 min-h-[260px] border rounded-xl p-4 text-sm font-serif leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950/80 border-slate-800 text-slate-200 placeholder-slate-600'
                }`}
              />
            </div>

            {/* Security & Action Bar */}
            <div className={`mt-auto pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              {/* Zero-Knowledge Vault Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setZeroKnowledgeActive(!zeroKnowledgeActive);
                    if (!zeroKnowledgeActive) setShowPassphrasePrompt(true);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    zeroKnowledgeActive
                      ? isLight
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  title="Encrypt with client-side WebCrypto AES-GCM before saving to database"
                >
                  {zeroKnowledgeActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>Zero-Knowledge Mode {zeroKnowledgeActive ? 'ON' : 'OFF'}</span>
                </button>

                {zeroKnowledgeActive && (
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter private passphrase..."
                    className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none w-44 ${
                      isLight
                        ? 'bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-400 focus:border-amber-500'
                        : 'bg-slate-950 border-amber-500/40 text-amber-200 placeholder-amber-500/50 focus:border-amber-400'
                    }`}
                  />
                )}
              </div>

              {/* Action Buttons: Export, Summarize & Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Export and download current entry to your device as a Markdown (.md) file"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden sm:inline">Export (.md)</span>
                </button>

                <button
                  id="summarize-btn"
                  onClick={handleAutoSummarize}
                  disabled={isSummarizing}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                  }`}
                  title="Generate Executive Summary and Key Takeaways with Gemini"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-indigo-500 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Synthesizing...' : 'Auto-Summarize'}</span>
                </button>

                {!user && (
                  <button
                    id="save-device-btn"
                    onClick={handleSaveLocalEntry}
                    disabled={isSaving}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                    title="Save reflection directly to this device without signing in"
                  >
                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Save to Device</span>
                  </button>
                )}

                <button
                  id="save-journal-btn"
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title={user ? 'Save entry to your private Cloud Firestore' : 'Sign in with Google to save to Cloud Firestore'}
                >
                  {isSaving ? (
                    <Save className="w-3.5 h-3.5 animate-spin" />
                  ) : !user ? (
                    <LogIn className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving...' : !user ? 'Sign In & Save' : 'Save to Firestore'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Generated Structured Summary Preview Panel */}
          {summaryData && (
            <div
              className={`border rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Synthesized Executive Summary
                    </h3>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Emotional Arc:{' '}
                      <span className={`font-medium ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>{summaryData.sentimentArc}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {summaryData.tags.map((t, i) => (
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

              {/* Summary Text */}
              <div
                className={`text-xs leading-relaxed font-serif p-3.5 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                {summaryData.summary}
              </div>

              {/* Key Takeaways & Action Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Takeaways */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-indigo-800' : 'text-indigo-300'}`}>
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Key Takeaways</span>
                  </div>
                  <ul className={`space-y-1.5 list-disc list-inside ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {summaryData.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Actionable Commitments</span>
                  </div>
                  <ul className={`space-y-1.5 list-disc list-inside ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {summaryData.actionItems.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reflection Questions */}
              {summaryData.reflectionQuestions.length > 0 && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                    isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-500/5 border-indigo-500/20'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-indigo-800' : 'text-indigo-300'}`}>
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questions for Future Self</span>
                  </div>
                  <div className={`space-y-1 italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {summaryData.reflectionQuestions.map((q, idx) => (
                      <p key={idx}>“{q}”</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Multi-Turn Brainstorming Dialogue */}
        <div
          className={`lg:col-span-5 flex flex-col border rounded-2xl overflow-hidden shadow-sm h-full min-h-[580px] lg:min-h-[620px] transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {/* Brainstorm Header */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {personaObj.name} • Dialogue
                </h3>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{personaObj.tagline}</p>
              </div>
            </div>
            <button
              onClick={fetchSparks}
              disabled={loadingSparks}
              className={`p-1.5 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Generate new reflection sparks"
            >
              <RefreshCw className={`w-3 h-3 ${loadingSparks ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sparks</span>
            </button>
          </div>

          {/* Reflection Sparks Pills */}
          <div
            className={`p-3 border-b overflow-x-auto space-y-1 ${
              isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/30 border-slate-800/80'
            }`}
          >
            <div className={`text-[10px] font-semibold flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Click a spark prompt to reflect:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sparks.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors text-left truncate max-w-full ${
                    isLight
                      ? 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-300'
                      : 'bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 border-slate-700/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.length === 0 ? (
              <div className={`h-full flex flex-col items-center justify-center text-center p-6 space-y-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                <Compass className={`w-8 h-8 stroke-[1.5] ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                <p className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Ready to brainstorm</p>
                <p className={`text-[11px] max-w-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Ask a question, share an ambiguous decision, or explore an idea with{' '}
                  <span className={isLight ? 'text-indigo-700 font-semibold' : 'text-indigo-300 font-semibold'}>{personaObj.name}</span>.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : isLight
                          ? 'bg-slate-200 border border-slate-300 text-indigo-600'
                          : 'bg-slate-800 border border-slate-700 text-indigo-400'
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
              })
            )}

            {isAiReplying && (
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-slate-200 border border-slate-300 text-indigo-600' : 'bg-slate-800 border border-slate-700 text-indigo-400'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div
                  className={`border rounded-2xl p-3 rounded-tl-sm flex items-center gap-1.5 text-xs ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse delay-200" />
                  <span className="ml-1 text-[11px]">{personaObj.name} is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Brainstorm Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className={`p-3 border-t ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                id="brainstorm-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${personaObj.name} or explore a thought...`}
                className={`flex-1 border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
              <button
                id="brainstorm-send-btn"
                type="submit"
                disabled={!chatInput.trim() || isAiReplying}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sign In Required & Publishing Explanation Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border space-y-5 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Sign-In Required to Save</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Publishing is NOT required to save your entries.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className={`p-1 rounded-lg text-xs ${
                  isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`space-y-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                }`}
              >
                <p className="font-semibold mb-1">Why do I need to sign in for Cloud Sync?</p>
                <p>
                  For zero-trust security, your entries are stored in your own isolated partition on Cloud Firestore (<code className="font-mono text-[11px]">/users/&#123;userId&#125;/journals/*</code>). Only your verified Google account can read or write your private journal.
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isLight ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900' : 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200'
                }`}
              >
                <p className="font-semibold mb-1">Encountering Google's "401 Bad Request"?</p>
                <p>
                  This is caused by multiple active Google accounts in Chrome. You can instantly bypass this by choosing <strong>Save to Device</strong> below (no sign-in needed!), opening the app in an <strong>Incognito window</strong>, or using <strong>Redirect Sign-In</strong>.
                </p>
              </div>

              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Don't worry: your written reflection is already auto-saved in your browser draft!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveLocalEntry}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                title="Save directly to this device without signing into Google"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Save to This Device</span>
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                    isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>.md</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                    isLight ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700' : 'border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </button>

                {onSignInRedirect && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignInModal(false);
                      onSignInRedirect();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                      isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Redirect Sign-In</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowSignInModal(false);
                    onSignInRequired();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In (Popup)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
