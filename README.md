# Personal Gemini Journal 🛡️🧠

A secure, enterprise-hardened personal AI journaling and brainstorming companion powered by **Google Gemini 2.5 Flash**, **Firebase Cloud Firestore**, and **Express / React with Vite & Tailwind CSS**.

Built under the **Zero-Trust Security Constitution**, ensuring complete tenant isolation, server-side secret management, zero-knowledge AES-GCM-256 client encryption, and automated PII scrubbing.

---

## 🌟 Key Features

- **5 Distinctive AI Personas**:
  - 🏛️ **Socratic Mentor**: Probes deep beliefs and assumptions with disciplined inquiries.
  - 🎨 **Creative Muse**: Sparks lateral thinking, metaphors, and outside-the-box ideas.
  - ⚡ **Tactical Strategist**: Breaks complex thoughts into clear, prioritised, time-bound action plans.
  - 🌿 **Empathetic Confidant**: Provides compassionate emotional validation and supportive cues.
  - ⚖️ **Devil's Advocate**: Challenges blind spots, stress-tests reasoning, and surfaces risks.

- **3 Dynamic Interaction Modes**:
  - **Reflective Journaling**: Deep self-inquiry and mindful daily reflections.
  - **Deep Brainstorming**: Ideation, divergence, and idea cataloguing.
  - **Structured Critique**: Rigorous stress-testing of strategies and decisions.

- **Automated AI Synthesizer**:
  - Extracts key takeaways, concrete action items, reflection questions, tags, and sentiment arcs directly into structured metadata.

- **Dual-Storage Engine**:
  - **Isolated Cloud Firestore**: Multi-tenant per-user pathing (`/users/{userId}/journals/*`) protected by strict Firestore Security Rules.
  - **Offline Device Archive**: Write, encrypt, and review reflections locally without requiring immediate sign-in, with one-click cloud sync when ready.

- **Zero-Trust Enterprise Security**:
  - **Server-Side API Proxying**: The Gemini API key never touches the browser client. All AI generation is executed via server-side endpoints (`/api/gemini/*`).
  - **Zero-Knowledge Encryption**: Optional client-side AES-GCM-256 envelope encryption with user passphrase before database persistence.
  - **Real-Time PII Redaction**: Automatic scrubbing of sensitive emails, phone numbers, and identifying tokens before LLM dispatch.
  - **Live Security Inspector**: Interactive security audit drawer displaying verified STRIDE mitigation matrices and actual Firestore security rules.

- **Refined Typography & Modern UI**:
  - High-contrast Light and Dark mode themes.
  - Markdown formatting, auto-saving drafts, and one-click Markdown export.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, WebCrypto API
- **Backend**: Express.js with `@google/genai` (Node.js runtime)
- **Database & Auth**: Google Cloud Firestore & Firebase Authentication (Google OAuth)
- **AI Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Build Tool**: Vite & esbuild

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aparna-Jha-05/personal-gemini-journal.git
   cd personal-gemini-journal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your API key:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔐 Security & Data Privacy (STRIDE Compliance)

| Threat Category | Security Mitigation Implemented |
|---|---|
| **Spoofing** | Verified Firebase Auth context (`request.auth.uid`) enforced on all database reads & writes. |
| **Tampering** | Immutable timestamps, strict field whitelisting, and schema boundary constraints (`size() <= MAX`). |
| **Repudiation** | Trusted server timestamps recorded on all database mutations. |
| **Information Disclosure** | Hardened tenant isolation (`/users/{userId}/journals/*`). Blanket reads are strictly rejected. |
| **Denial of Service** | Payload bounds, max length limits (20,000 chars), and strict array caps. |
| **Elevation of Privilege** | Administrative flags locked; client cannot self-assign permissions or mutate security roles. |

---

## 📄 License

MIT License. Open source and free to use for personal journaling and AI-assisted productivity.
