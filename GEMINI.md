# GEMINI AI STUDIO CONSTITUTION & SYSTEM INSTRUCTIONS
# Enterprise Directives for Secure Production Web Applications

## Production Directives Summary

1. **Security-First Architecture**:
   - Client is strictly for presentation and user interaction.
   - All AI calls (`@google/genai`) are executed in the server layer (`server.ts`), utilizing `process.env.GEMINI_API_KEY`.
   - Never expose API keys, credentials, or administrative tokens to the browser.

2. **Data Isolation & Multi-Tenancy**:
   - Cloud Firestore security rules must enforce strict user partitioning at `/users/{userId}/*`.
   - Multi-tenant cross-contamination is eliminated through path variable checks (`userId == request.auth.uid`) and explicit resource data matching.
   - Default deny on all unmapped routes.

3. **Threat Modeling & Defensive Coding**:
   - Validate and bound all input fields (strings, arrays, numbers) both on the client and in database security rules.
   - Enforce temporal integrity using trusted server timestamps (`request.time`).
   - Guard against Denial-of-Wallet through strict payload limits and efficient querying.

4. **Privacy & Enhanced Encryption**:
   - Support zero-knowledge client encryption options where sensitive journal reflections are encrypted locally via WebCrypto (AES-GCM-256) before persistence.
   - Real-time client-side PII scrubbing prior to LLM submission.
