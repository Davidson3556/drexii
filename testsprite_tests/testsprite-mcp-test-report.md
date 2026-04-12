
# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** drexii
- **Date:** 2026-04-12
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

---

### Requirement: Authentication & Session Management
- **Description:** Users can log in with email/password, log out, check session/auth status, and delete their account. Sessions must be validated server-side on all protected routes.

#### Test TC001 — POST /api/auth/login with valid and invalid credentials
- **Test Code:** [TC001_postapiauthloginwithvalidandinvalidcredentials.py](./TC001_postapiauthloginwithvalidandinvalidcredentials.py)
- **Test Error:** `AssertionError: Expected 401 for invalid credentials, got 200`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/23358042-4bfd-4e67-b9a1-6633ece9965c
- **Status:** ❌ Failed
- **Severity:** CRITICAL
- **Analysis / Findings:** The login endpoint returns HTTP 200 for invalid credentials instead of 401. This is a critical security regression — the server is either not validating credentials at all, or delegating validation to the InsForge SDK without checking the result. Fix: ensure the password comparison in `server/api/auth/login.post.ts` gates the response code; invalid credentials must return 401 Unauthorized.

---

#### Test TC002 — POST /api/auth/logout with valid session token
- **Test Code:** [TC002_postapiauthlogoutwithvalidsessiontoken.py](./TC002_postapiauthlogoutwithvalidsessiontoken.py)
- **Test Error:** —
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/898b487b-51ad-4756-94f4-df671062b6f2
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Logout correctly terminates the session and returns a success response. Session teardown works as intended.

---

#### Test TC003 — GET /api/auth/check with and without session token
- **Test Code:** [TC003_getapiauthcheckwithandwithoutsessiontoken.py](./TC003_getapiauthcheckwithandwithoutsessiontoken.py)
- **Test Error:** `AssertionError: Missing or invalid user info in auth check response`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/842ac7cc-426a-40af-bfd4-61b3da0765fe
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The `/api/auth/check` endpoint does not return the expected user info fields in its response body. The handler in `server/api/auth/check.get.ts` may be returning a partial or empty payload. Fix: ensure the authenticated user object (id, email, etc.) is serialized into the response so clients can hydrate user state from this endpoint.

---

#### Test TC004 — POST /api/auth/delete-account and verify session becomes invalid
- **Test Code:** [TC004_postapiauthdeleteaccountandverifysessioninvalid.py](./TC004_postapiauthdeleteaccountandverifysessioninvalid.py)
- **Test Error:** `AssertionError: Delete account failed with status 401`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/2969fdd0-50cc-4b24-bee3-b1fd7b2ed236
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The delete-account endpoint returns 401 even when a valid session token is supplied, indicating the auth middleware is not correctly extracting or validating the session for this route. Likely related to the same auth middleware issue seen in TC003 and TC008. Fix: verify auth middleware is applied uniformly across protected routes and that the session cookie/header name matches what the client sends.

---

### Requirement: Prompt Injection Sanitizer
- **Description:** All external tool output must be scanned for known prompt injection patterns (e.g. "ignore previous instructions", "you are now a", "system:", `[TOOL_CALL:`, `[MEMORY:`) and replaced with `[FILTERED]`. Messages in AI threads must pass through `sanitizeToolOutput` before being included in the AI context. Implemented in `server/lib/sanitize.ts`.

#### Test TC005 — POST /api/threads — create thread and post messages with sanitization
- **Test Code:** [TC005_postapithreadscreateandpostmessageswithsanitization.py](./TC005_postapithreadscreateandpostmessageswithsanitization.py)
- **Test Error:** `AssertionError: Failed to create thread: 500 Server Error — DATABASE_URL is not set. Please add it to your .env file.`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/91385d61-7a13-4591-8fef-dd79d7316eda
- **Status:** ❌ Failed
- **Severity:** HIGH (environment blocker)
- **Analysis / Findings:** The test environment is missing `DATABASE_URL`, causing `server/api/threads/index.post.ts` to return 500. The sanitization logic in `sanitize.ts` could not be exercised. This is a configuration issue, not a code bug — but it completely blocks testing of threads and sanitization integration. Fix: add `DATABASE_URL` to `.env` and re-run.

---

### Requirement: Chain Condition Evaluator
- **Description:** Automation chains must evaluate plain-English conditions (`null`/`always`, `success`, `failure`/`error`, `output contains X`) to decide whether to proceed to the next step. Implemented in `server/lib/agent-runner.ts` — `evaluateChainCondition`.

#### Test TC006 — POST /api/automations — create and process with chain condition
- **Test Code:** [TC006_postapiautomationscreateandprocesswithchaincondition.py](./TC006_postapiautomationscreateandprocesswithchaincondition.py)
- **Test Error:** `AssertionError` (automation creation step failed — root cause: DATABASE_URL not set, same as TC005)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/41a28222-08f8-4024-84fa-fe208689c3fb
- **Status:** ❌ Failed
- **Severity:** HIGH (environment blocker)
- **Analysis / Findings:** Automation creation failed before `evaluateChainCondition` in `agent-runner.ts` could be exercised, due to the missing database connection. Re-run after the `DATABASE_URL` environment blocker is resolved. The condition evaluation logic (plain-English string matching) is entirely untested at the integration level and warrants its own unit tests.

---

### Requirement: Tool Call Parser
- **Description:** Workflows must parse `[TOOL_CALL: toolName({"key":"value"})]` patterns from AI response text using `parseToolCalls` in `server/lib/utils/parse-tool-calls.ts`, execute the named tools, and return results. The parser must handle embedded calls, malformed JSON (fallback parser), and multiple calls in one string.

#### Test TC007 — POST /api/workflows — create and run with tool calls
- **Test Code:** [TC007_postapiworkflowscreateandrunwithtoolcalls.py](./TC007_postapiworkflowscreateandrunwithtoolcalls.py)
- **Test Error:** `AssertionError: Workflow creation failed: 400 — name and prompt are required`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/872238a9-d362-4957-a9be-932af81c2735
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The API at `server/api/workflows/index.post.ts` requires `{ name, prompt }` fields, but the test submitted a different body shape (likely a `steps` array from outdated documentation). The 400 is the correct guard behavior. Fix: update the test to send `{ name, prompt }`. If the documented schema is `steps: WorkflowStep[]`, then the API must be aligned to accept that instead — one of the two needs to change.

---

### Requirement: User Integrations
- **Description:** Authenticated users can list their connected integrations (Gmail, Slack, Notion, Jira, Linear, Asana, Google Calendar, Google Drive, Discord, Zendesk, Salesforce) and test individual integration connections.

#### Test TC008 — GET /api/user-integrations list and POST test integration
- **Test Code:** [TC008_getapiuserintegrationslistandposttestintegration.py](./TC008_getapiuserintegrationslistandposttestintegration.py)
- **Test Error:** `RuntimeError: Failed to get user integrations: 401 Client Error`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/4ba57b6d-ade7-4ef5-898e-13ec59e67eb7
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** `/api/user-integrations` returns 401 when a session token is supplied, indicating the auth middleware is not correctly reading the session for this route — consistent with TC003 and TC004. Fix: verify the auth middleware is applied uniformly and the session cookie/header name matches what the test client sends.

---

### Requirement: Memory Management
- **Description:** Users can create, update, and delete persistent memory entries. The `formatMemoriesForPrompt` function in `server/lib/memory.ts` must format stored memories (category + content) inside `<memory_context>` XML tags for injection into the AI prompt.

#### Test TC009 — POST /api/memory — create, update, and delete entries
- **Test Code:** [TC009_postapimemorycreateupdateanddeleteentries.py](./TC009_postapimemorycreateupdateanddeleteentries.py)
- **Test Error:** `AssertionError: Missing memory ID in response, got keys: ['ok', 'category', 'content']`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/a3e44fdd-99e5-4c38-9e7d-ea275eb4b997
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The `POST /api/memory` response omits the `id` field — it only returns `{ ok, category, content }`. This is a real bug: without `id` in the creation response, callers cannot reference the entry for subsequent PATCH/DELETE operations. Fix: update `server/api/memory.post.ts` to return the full created `MemoryEntry` object including its `id`.

---

### Requirement: Confirm-Before-Act Safety Layer
- **Description:** Potentially destructive or irreversible AI-triggered actions must be queued as pending and require explicit user confirmation or cancellation before execution. Users can view pending actions and approve/reject them.

#### Test TC010 — GET /api/actions/pending and POST confirm/cancel
- **Test Code:** [TC010_getapiactionspendingandpostconfirmcancel.py](./TC010_getapiactionspendingandpostconfirmcancel.py)
- **Test Error:** `AssertionError: Expected 200 OK for GET pending actions, got 500`
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/9b5b60d5-590b-4cfb-8bbf-600718b53cd7/e2ca0669-c995-4781-b343-caba55c9e11b
- **Status:** ❌ Failed
- **Severity:** HIGH (environment blocker)
- **Analysis / Findings:** The pending-actions endpoint returns 500. Most likely caused by missing `DATABASE_URL` (same blocker as TC005/TC006). Fix: add `DATABASE_URL` to `.env` and re-run. Additionally, review the route handler for unhandled exceptions and add proper error boundaries.

---

## 3️⃣ Coverage & Matching Metrics

- **10% of tests passed** (1/10)

| Requirement                          | Total Tests | ✅ Passed | ❌ Failed |
|--------------------------------------|-------------|-----------|-----------|
| Authentication & Session Management  | 4           | 1         | 3         |
| Prompt Injection Sanitizer           | 1           | 0         | 1         |
| Chain Condition Evaluator            | 1           | 0         | 1         |
| Tool Call Parser                     | 1           | 0         | 1         |
| User Integrations                    | 1           | 0         | 1         |
| Memory Management                    | 1           | 0         | 1         |
| Confirm-Before-Act Safety Layer      | 1           | 0         | 1         |
| **Total**                            | **10**      | **1**     | **9**     |

---

## 4️⃣ Key Gaps / Risks

Only 10% of tests passed (1/10). The failures fall into three distinct categories:

**🔴 Real bugs to fix now:**
1. **Login accepts invalid credentials (TC001)** — `server/api/auth/login.post.ts` returns 200 for bad passwords. Critical security issue — must return 401.
2. **Memory POST response missing `id` (TC009)** — `server/api/memory.post.ts` returns `{ ok, category, content }` but omits `id`, making PATCH/DELETE impossible from the client.
3. **Workflow API schema mismatch (TC007)** — `server/api/workflows/index.post.ts` requires `{ name, prompt }` but tests (and possibly docs) reference a `steps: WorkflowStep[]` shape. One must be corrected.

**🟡 Environment blockers (not code bugs — fix `.env` first):**
4. **`DATABASE_URL` not set** — Blocks TC005, TC006, TC010 (threads, automations, pending-actions safety layer all require DB). Add to `.env` and re-run.
5. **Session tokens unavailable in test environment** — Blocks TC004, TC008. Protected routes need a valid session token injected for integration tests to reach actual logic.

**🟠 Needs investigation after environment is fixed:**
6. **`/api/auth/check` response shape (TC003)** — Returns 200 but without the expected `user` object. Verify `server/api/auth/check.get.ts` serializes full user info.
7. **Auth middleware inconsistency (TC003, TC004, TC008)** — Multiple protected routes reject valid sessions with 401. Audit that the same middleware is applied uniformly across all protected API routes.
8. **Core logic modules lack unit test coverage** — `sanitizeToolOutput`, `classifyTask`, `toAnthropicTools`/`toGeminiTools`, `parseToolCalls`, `evaluateChainCondition`, and `formatMemoriesForPrompt` (all in `server/lib/`) are untested at the unit level. Integration test blockers above mask whether these work correctly end-to-end.
