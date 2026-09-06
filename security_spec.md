# Security Specification & Threat Model
## Personal Gemini Journal — Zero-Trust Architecture

### 1. Data Invariants
1. **User Tenant Isolation**: All journal documents belong strictly to `/users/{userId}/journals/{journalId}` where `{userId}` MUST equal `request.auth.uid`. No user can query or access another user's subcollections.
2. **Immutable Identity & Creation State**: Once created, `userId` and `createdAt` cannot be altered, spoofed, or deleted.
3. **Payload & Size Constraints**:
   - `title`: String, min 1, max 200 characters.
   - `content`: String, max 30,000 characters.
   - `summary`: String, max 10,000 characters.
   - `persona`: String, max 64 characters, valid persona enum or string.
   - `mode`: String, max 32 characters.
   - `tags`: List of strings, max 15 items, each string max 50 characters.
   - `keyTakeaways`: List of strings, max 15 items, each string max 300 characters.
   - `actionItems`: List of strings, max 15 items, each string max 300 characters.
   - `reflectionQuestions`: List of strings, max 10 items, each string max 300 characters.
   - `sentimentArc`: String, max 100 characters.
   - `isEncrypted`: Boolean.
   - `encryptionIv`: String, max 64 characters (optional).
4. **Verified Authentication**: All writes require authenticated session with `request.auth != null`.
5. **No Blanket Reads**: Client cannot issue unscoped collectionGroup queries; rules evaluate `request.auth.uid == userId`.
6. **Secret Masking**: No API keys, credentials, or administrative flags are ever stored in Firestore documents.

---

### 2. The "Dirty Dozen" Payloads (Designed to Fail)
1. **Payload 1: Cross-User Impersonation (Spoof UID in Body)**
   ```json
   { "userId": "victim_uid_12345", "title": "Injected Entry", "content": "Tampered data", "createdAt": "2026-09-06T00:00:00Z" }
   ```
   *Expected Result*: PERMISSION_DENIED (Mismatched UID with auth.uid)

2. **Payload 2: Cross-Tenant Path Traversing Write**
   Attempting write to `/users/victim_user/journals/doc1` while authenticated as `attacker_user`.
   *Expected Result*: PERMISSION_DENIED (Path variable check fails)

3. **Payload 3: Unauthenticated Anonymous Snooping**
   `get` or `list` on `/users/{any_user}/journals` with `request.auth == null`.
   *Expected Result*: PERMISSION_DENIED

4. **Payload 4: Denial-of-Wallet Payload (1MB Title String)**
   ```json
   { "userId": "valid_uid", "title": "A".repeat(1000000), "content": "Denial of wallet", "createdAt": "2026-09-06T00:00:00Z" }
   ```
   *Expected Result*: PERMISSION_DENIED (Exceeds 200 char limit)

5. **Payload 5: Path Variable ID Poisoning (1KB Document ID)**
   Document ID = `"attacker_malformed_slug_with_illegal_symbols_$$$$$".repeat(50)`
   *Expected Result*: PERMISSION_DENIED (`isValidId(journalId)` regex check fails)

6. **Payload 6: Ghost Field Injection Attack**
   ```json
   { "userId": "valid_uid", "title": "Normal Title", "content": "Normal", "isAdmin": true, "elevatePrivilege": true, "createdAt": "2026-09-06T00:00:00Z" }
   ```
   *Expected Result*: PERMISSION_DENIED (Strict blueprint rejects unauthorized keys)

7. **Payload 7: State Mutation of Immutable `userId`**
   Attempting update: `incoming().userId != existing().userId`.
   *Expected Result*: PERMISSION_DENIED

8. **Payload 8: State Mutation of Immutable `createdAt`**
   Attempting update: changing original creation timestamp.
   *Expected Result*: PERMISSION_DENIED

9. **Payload 9: Array Flooding Attack**
   ```json
   { "userId": "valid_uid", "title": "Flooding", "content": "test", "tags": Array(2000).fill("spam") }
   ```
   *Expected Result*: PERMISSION_DENIED (Array size exceeds 15 max limit)

10. **Payload 10: Type Confusion Attack (Boolean as Title)**
    ```json
    { "userId": "valid_uid", "title": true, "content": 12345 }
    ```
    *Expected Result*: PERMISSION_DENIED (Type checking fails `title is string`)

11. **Payload 11: Cross-User List Scraping**
    Unconstrained list query attempting to read another user's journal collection.
    *Expected Result*: PERMISSION_DENIED (`request.auth.uid == userId` check fails)

12. **Payload 12: Root Wildcard Snooping**
    Query to `/non_existent_collection/doc` or `/admin_secret`.
    *Expected Result*: PERMISSION_DENIED (Default-deny catch-all blocks all unmapped paths)

---

### 3. Test Runner Specification (`firestore.rules.test.ts`)
The test suite asserts that every one of the Dirty Dozen vectors triggers a strict PERMISSION_DENIED error in the Firestore emulator / rules engine.
