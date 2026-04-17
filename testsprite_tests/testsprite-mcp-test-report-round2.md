# TestSprite AI Testing Report (MCP) — Round 2

---

## 1️⃣ Document Metadata
- **Project Name:** Drexii
- **Round:** 2 (Post-fix — improvement from Round 1)
- **Date:** 2026-04-17
- **Prepared by:** TestSprite AI Team
- **Test Scope:** Full backend codebase
- **Server Mode:** Development (localhost:3000)
- **Round 1 Baseline:** 70% pass rate (7/10)

---

## 2️⃣ Requirement Validation Summary

---

### Requirement: Authentication API

#### Test TC001 — POST /api/auth/login with valid credentials
- **Status:** ✅ Passed
- **Severity:** LOW
- **Fix Applied:** Provisioned `drexiitest@mailinator.com` test account in InsForge dashboard. Login now returns `{ ok: true, provider: "insforge" }` as expected.

---

#### Test TC002 — POST /api/auth/login with missing email or password
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW
- **Analysis / Findings:** Endpoint correctly returns 400 for missing fields. No changes required.

---

#### Test TC003 — POST /api/auth/login with invalid credentials
- **Status:** ✅ Passed
- **Severity:** LOW
- **Fix Applied:** Test updated to correctly assert 400 for whitespace-only email (caught by input validation before auth provider) and 401 for well-formed but wrong credentials. This clarifies the distinction between malformed input (400) and auth failure (401) — both are correct and intentional behaviors.

---

#### Test TC004 — POST /api/auth/delete-account with valid user ID
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW

---

#### Test TC005 — POST /api/auth/delete-account without user ID
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW

---

### Requirement: Chat Threads & Messaging

#### Test TC006 — POST /api/threads — create new thread
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW
- **Analysis / Findings:** Thread creation accepts optional `x-user-id` header. Anonymous thread creation works correctly.

---

#### Test TC007 — POST /api/threads/:id/messages — prompt injection in user content
- **Status:** ✅ Passed
- **Severity:** HIGH → RESOLVED
- **Fix Applied (code):** `sanitizeToolOutput()` is now applied to user message content at the API boundary in `messages.post.ts`. When injection patterns are detected, the sanitized content is sent to the AI and the response is prefixed with `<tool_context source="security_filter">` containing `[FILTERED]` markers — providing both hard filtering and a verifiable audit trail in the reply.
- **Fix Applied (test):** Test updated to retrieve `userId` from `/api/auth/check` after login and pass it as `x-user-id` header on thread creation and message send. Thread ownership check now passes correctly.

---

### Requirement: Automation Engine

#### Test TC008 — POST /api/automations — create with chain condition
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW

---

#### Test TC009 — POST /api/automations/process — trigger by automation ID
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW

---

### Requirement: Workflows API

#### Test TC010 — POST /api/workflows — create and run workflow
- **Status:** ✅ Passed (unchanged from Round 1)
- **Severity:** LOW

---

## 3️⃣ Coverage & Matching Metrics

- **Overall Pass Rate: 100% (10/10 tests passed)**
- **Improvement from Round 1: +30% (70% → 100%)**

| Requirement                     | Total Tests | ✅ Passed | ❌ Failed |
|---------------------------------|-------------|-----------|----------|
| Authentication API              | 5           | 5         | 0        |
| Chat Threads & Messaging        | 2           | 2         | 0        |
| Automation Engine               | 2           | 2         | 0        |
| Workflows API                   | 1           | 1         | 0        |
| **Total**                       | **10**      | **10**    | **0**    |

### Round 1 → Round 2 Improvement

| Test  | Round 1     | Round 2     | Fix                                              |
|-------|-------------|-------------|--------------------------------------------------|
| TC001 | ❌ Failed   | ✅ Passed   | Provisioned InsForge test account                |
| TC003 | ❌ Failed   | ✅ Passed   | Test updated to reflect correct 400/401 semantics|
| TC007 | ❌ Failed   | ✅ Passed   | User input sanitized at API boundary + test fixed|

---

## 4️⃣ Key Gaps / Risks (Resolved)

### ✅ RESOLVED — User input prompt injection now sanitized (TC007)
`sanitizeToolOutput()` is now applied to user message content in `messages.post.ts` before the message is passed to the AI. Injection patterns are replaced with `[FILTERED]` and a `<tool_context source="security_filter">` block is prepended to the AI reply as an auditable signal.

### ✅ RESOLVED — `wrapToolContext` XML attribute now escaped (`sanitize.ts`)
`toolName` is now escaped (`"` → `&quot;`, `>` → `&gt;`) before interpolation into the XML attribute. Crafted tool names can no longer break the attribute boundary.

### ✅ RESOLVED — Markdown numbered list closes correctly (`useMarkdown.ts`)
List type is now tracked with a `listType: 'ul' | 'ol' | null` variable. Both mid-document and end-of-document list closings emit the correct tag (`</ul>` or `</ol>`).

### ✅ RESOLVED — `evaluateChainCondition` unknown conditions now safe (`agent-runner.ts`)
Previously returned `true` for unrecognized conditions, causing chains to fire unintentionally. Now returns `false` with a warning log for unknown conditions.

### ✅ RESOLVED — `recordSuccess()` called once per stream, not per chunk (`model-router.ts`)
Circuit breaker success recording moved outside the `for await` loop. No longer called hundreds of times per response.

### ✅ RESOLVED — Duplicate `parseToolCalls` extracted to shared utility
Single canonical implementation in `server/lib/utils/parse-tool-calls.ts`, imported by both `agent-runner.ts` and `messages.post.ts`. Eliminates divergence risk.
