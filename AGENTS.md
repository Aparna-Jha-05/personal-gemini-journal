# ENTERPRISE SECURITY CONSTITUTION & PRODUCTION DIRECTIVES
# Google AI Studio Custom Instructions

> **Security Mandate**: Assume zero trust. Every client is untrusted. Hardcoded secrets, unauthenticated endpoints, and shared databases without strict cryptographic and rule-based isolation are critical system failures.

---

## Pillar 1: Threat Modeling & STRIDE Framework
Every architectural choice must be evaluated against STRIDE:
1. **Spoofing (Identity Integrity)**:
   - All client identity claims (`userId`, `email`, `role`) must be verified against server-validated auth context (`request.auth.uid`, Firebase ID tokens).
   - The client MUST never be trusted when asserting its own author identity or administrative role.
2. **Tampering (Data Integrity)**:
   - All mutations must be constrained by strict schemas and boundary limits (`size() <= MAX`, regex validation, immutable timestamps).
   - Terminal states and immutable audit fields (`createdAt`, `userId`) must be permanently locked against modification.
3. **Repudiation**:
   - Audit logs for operations (entry creation, auto-summarization, security events) must capture authentic timestamps derived from trusted time (`request.time` / server clock).
4. **Information Disclosure (Tenant & Cross-User Isolation)**:
   - **Zero cross-user leakage**: Every user's private data (journal entries, brainstorm logs, AI reflections) MUST reside in user-isolated paths (`/users/{userId}/...`).
   - Blanket queries (`allow read: if isSignedIn()`) are strictly forbidden. Rules must explicitly evaluate `resource.data.userId == request.auth.uid`.
5. **Denial of Service / Denial of Wallet (DoW)**:
   - Cap payload sizes, enforce string length limits (`maxLength: 20000`), bounded arrays (`size() <= 50`), and restrict LLM context window payloads.
   - Cost-expensive database operations (e.g. `get()` lookups inside security rule lists) are strictly banned.
6. **Elevation of Privilege**:
   - No self-assigned roles. RBAC fields (`role`, `isAdmin`, `isVerified`) are immutable to client-side requests.

---

## Pillar 2: Secret Management & Key Isolation
1. **Zero Secret Exposure in Client Bundles**:
   - `GEMINI_API_KEY` and any third-party credentials MUST NEVER appear in client-side code, `import.meta.env.VITE_*`, HTML, or version control.
   - Keys must be retrieved server-side via Google Cloud Secret Manager or runtime environment injection (`process.env.GEMINI_API_KEY`).
2. **Server-Side API Proxying**:
   - The browser connects only to application API routes (`/api/gemini/chat`, `/api/gemini/summarize`).
   - Server-side handlers validate user authentication, sanitize inputs, enforce rate bounds, and invoke the `@google/genai` SDK using server-held credentials.
3. **Graceful Fallbacks & Defensive Readiness**:
   - Never crash or hang indefinitely if a secret is unconfigured; return structured error envelopes (`{ error: "Configuration Required", code: "SECRET_MISSING" }`).

---

## Pillar 3: Database Isolation & Cloud Firestore Security Rules
1. **Default-Deny Catch-All**:
   - The root document matcher must immediately deny all traffic: `match /{document=**} { allow read, write: if false; }`.
2. **Validation Blueprints**:
   - Every collection write must pass through an `isValid[Entity](data)` helper verifying field existence, types, lengths, and regexes.
   - Updates must use `incoming().diff(existing()).affectedKeys().hasOnly([...])` to strictly bound allowed mutable fields.
3. **Verified Authentication**:
   - All standard writes require active authenticated session (`request.auth != null && request.auth.token.email_verified == true`).
4. **PII and Data Separation**:
   - User profile and personal telemetry must never be readable by arbitrary logged-in users.

---

## Pillar 4: Secure AI Interaction Standards
1. **Input Sanitization & Injection Defense**:
   - Strip malicious prompt overrides and delimit user journal thoughts from system guidance using structural formatting.
2. **Client-Side Privacy Controls (Zero-Knowledge Mode)**:
   - Provide local client-side PII redactor (detecting emails, phone numbers, SSNs before transmitting to the model).
   - Support optional client-side AES-GCM envelope encryption for private personal entries.
3. **Structured Response Contracts**:
   - AI outputs (summaries, action items, reflection cues) must adhere to structured JSON contracts or validated markdown schemas.
