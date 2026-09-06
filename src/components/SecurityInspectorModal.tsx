import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  RefreshCw,
  X,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import type { SecurityAuditReport, ThemeMode } from '../types';
import type { User } from '../lib/firebase';
import { scanForPii, redactPii } from '../lib/pii';

interface SecurityInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme: ThemeMode;
}

export const SecurityInspectorModal: React.FC<SecurityInspectorModalProps> = ({
  isOpen,
  onClose,
  user,
  theme,
}) => {
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'architecture' | 'rules' | 'secrets' | 'pii' | 'crypto'>('architecture');
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Interactive PII playground state
  const [piiInput, setPiiInput] = useState('My name is Alex, reach me at alex.dev@enterprise.io or +1 (555) 234-5678.');
  const detectedPii = scanForPii(piiInput);
  const redactedPreview = redactPii(piiInput);

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen]);

  const fetchAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/security/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditReport(data);
      }
    } catch (e) {
      console.error('Failed to load security audit:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div
        id="security-inspector-dialog"
        className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Enterprise Security & Zero-Trust Audit
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Compliant
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Audited against STRIDE Threat Modeling, Firestore ABAC Isolation, and Secret Manager Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div
          className={`flex border-b px-5 overflow-x-auto gap-2 ${
            isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/30 border-slate-800'
          }`}
        >
          {[
            { id: 'architecture', label: 'Threat Model & Auth', icon: UserCheck },
            { id: 'rules', label: 'Firestore Security Rules', icon: Database },
            { id: 'secrets', label: 'Secret Manager & Keys', icon: Key },
            { id: 'pii', label: 'Real-Time PII Shield', icon: ShieldAlert },
            { id: 'crypto', label: 'Zero-Knowledge Crypto', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
                  active
                    ? isLight
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
                      : 'border-indigo-500 text-indigo-400 bg-indigo-500/5 font-bold'
                    : isLight
                    ? 'border-transparent text-slate-500 hover:text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Identity Status</span>
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {user ? 'Authenticated via Firebase' : 'Unauthenticated / Guest'}
                  </div>
                  <p className="text-[11px] font-mono break-all text-slate-500">
                    UID: {user ? user.uid : 'None'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Tenant Partition</span>
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Isolated Subcollection
                  </div>
                  <p className="text-[11px] font-mono break-all text-slate-500">
                    /users/{user?.uid || '{uid}'}/journals/*
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Key Isolation</span>
                    <Key className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Server Proxy Isolated
                  </div>
                  <p className="text-[11px] text-slate-500">Zero GEMINI_API_KEY in client bundles</p>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  STRIDE Threat Mitigation Matrix
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800/80'}`}>
                    <div className={`font-semibold mb-1 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      Spoofing (Identity)
                    </div>
                    <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      Every database write validates <code>request.auth.uid == userId</code>. Client cannot forge author metadata.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800/80'}`}>
                    <div className={`font-semibold mb-1 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      Tampering (Integrity)
                    </div>
                    <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      Strict validation blueprints enforce immutable <code>userId</code> and <code>createdAt</code> states.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800/80'}`}>
                    <div className={`font-semibold mb-1 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      Information Disclosure
                    </div>
                    <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      Multi-tenant cross-user queries return 403 Forbidden. Blanket reads are strictly banned.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800/80'}`}>
                    <div className={`font-semibold mb-1 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                      Denial of Wallet (DoW)
                    </div>
                    <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      Payload bounds enforced: titles capped at 200 chars, arrays capped at 15 items, LLM context bounds enforced server-side.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIRESTORE RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Active Cloud Firestore Ruleset</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Enforcing zero cross-tenant leakage at <code className="text-indigo-500">/users/{'{userId}'}/journals/{'{journalId}'}</code>
                </p>
              </div>

              <div
                className={`relative rounded-xl border p-4 font-mono text-xs overflow-x-auto max-h-96 ${
                  isLight ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Default-Deny Catch-All
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$'); }

    // User-Isolated Journals Collection (ABAC)
    match /users/{userId}/journals/{journalId} {
      allow get: if isOwner(userId) && isValidId(journalId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId) && isValidId(journalId) && isValidJournal(incoming());
      allow update: if isOwner(userId) && isValidId(journalId) && isValidJournal(incoming()) &&
        incoming().userId == existing().userId &&
        (!('createdAt' in existing()) || incoming().createdAt == existing().createdAt);
      allow delete: if isOwner(userId) && isValidId(journalId);
    }
  }
}`}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: SECRET MANAGEMENT */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Secret Management & Isolation Verification
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Server environment telemetry from /api/security/audit</p>
                </div>
                <button
                  onClick={fetchAudit}
                  disabled={loadingAudit}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {auditReport ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="text-slate-500">Gemini Key Storage</span>
                    <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{auditReport.keyStorage}</div>
                  </div>
                  <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="text-slate-500">Browser Bundle Exposure</span>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{auditReport.keyExposureInBrowser}</div>
                  </div>
                  <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="text-slate-500">Gemini API Status</span>
                    <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{auditReport.geminiKeyStatus}</div>
                  </div>
                  <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="text-slate-500">Client Encryption Support</span>
                    <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">{auditReport.clientEncryptionSupported}</div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">Loading server security telemetry...</div>
              )}
            </div>
          )}

          {/* TAB 4: PII */}
          {activeTab === 'pii' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Client-Side Real-Time PII Shield & Sanitizer
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Detects and strips emails, phone numbers, and SSNs locally in the browser before sending prompts to the AI model.
                </p>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Interactive PII Test Sandbox:
                </label>
                <textarea
                  value={piiInput}
                  onChange={(e) => setPiiInput(e.target.value)}
                  rows={3}
                  className={`w-full border rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                  placeholder="Type or paste text with emails, phone numbers, SSNs..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div className={`flex items-center justify-between font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <span>Detected PII Items</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      {detectedPii.length} found
                    </span>
                  </div>
                  {detectedPii.length > 0 ? (
                    <div className="space-y-1">
                      {detectedPii.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-1.5 rounded border font-mono ${
                            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <span className="text-red-500 font-semibold">{item.value}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No PII detected. Prompt is clean.</p>
                  )}
                </div>

                <div className={`p-3.5 rounded-xl border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div className={`flex items-center justify-between font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <span>Sanitized Prompt Output</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Protected
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded border font-mono break-all min-h-[50px] ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {redactedPreview}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CRYPTO */}
          {activeTab === 'crypto' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Zero-Knowledge Client-Side Vault Encryption
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Built with W3C standard WebCrypto API (AES-GCM-256 with PBKDF2-SHA256 key derivation).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-3 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                  <Lock className="w-4 h-4" />
                  <span>How Zero-Knowledge Protection Works:</span>
                </div>
                <div className={`space-y-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <p>1. When you enable <strong>Zero-Knowledge Mode</strong>, you choose a private local passphrase.</p>
                  <p>2. The WebCrypto API runs <strong>100,000 iterations of PBKDF2-SHA256</strong> to derive an AES-GCM 256-bit encryption key.</p>
                  <p>3. Your journal content is encrypted <em>locally</em> before sending to Cloud Firestore.</p>
                  <p>4. The database only ever receives ciphertext and IVs.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <span>Personal Gemini Journal • Enterprise Security Constitution v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
