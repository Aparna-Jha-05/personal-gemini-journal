export type PersonaId = 'socratic' | 'executive' | 'creative' | 'stoic';

export type JournalMode = 'journal' | 'brainstorm' | 'deep_dive' | 'quick_entry';

export type MoodId =
  | 'happy'
  | 'reflective'
  | 'productive'
  | 'calm'
  | 'inspired'
  | 'anxious'
  | 'grateful'
  | 'neutral';

export type ProductivityStatusId =
  | 'deep_focus'
  | 'in_flow'
  | 'steady'
  | 'distracted'
  | 'recharge';

export type ThemeMode = 'light' | 'dark';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  persona: PersonaId;
  mode: JournalMode;
  mood?: MoodId;
  productivityStatus?: ProductivityStatusId;
  messages: ChatMessage[];
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  reflectionQuestions: string[];
  sentimentArc: string;
  tags: string[];
  isEncrypted: boolean;
  encryptionIv?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaDefinition {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
}

export interface SecurityAuditReport {
  zeroTrustArchitecture: string;
  keyStorage: string;
  keyExposureInBrowser: string;
  geminiKeyStatus: string;
  databaseIsolation: string;
  multiTenancyGuarantees: string;
  serverClock: string;
  clientEncryptionSupported: string;
}

export interface DetectedPiiItem {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip';
  value: string;
  index: number;
}
