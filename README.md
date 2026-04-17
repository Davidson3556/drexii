<div align="center">

# 🤖 Drexii

### *Turn conversation into execution.*

**Drexii is an AI agent platform that connects your entire workspace — Gmail, Slack, Notion, Jira, Google Calendar and 6 more — into a single chat interface that doesn't just answer questions, it takes real action.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-drexii.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://drexii.vercel.app)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Watch%20on%20Loom-00D4AA?style=for-the-badge&logo=loom)](https://www.loom.com/share/5d719df3d8184292a49119dbae21f086)
[![TestSprite Score](https://img.shields.io/badge/TestSprite-10%2F10%20%E2%9C%85-22c55e?style=for-the-badge)](./testsprite_tests/)
[![Built with Nuxt](https://img.shields.io/badge/Nuxt.js-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## 🎯 What is Drexii?

Drexii is a **multi-model AI agent** that reads and writes to your real accounts in real time. Instead of switching between 10 apps, you describe what you need in plain English — and Drexii executes it across all of them.

> *"Find our top open Zendesk ticket, check if there's a related Notion doc, and post a summary to #support on Slack."*

Drexii handles each step in sequence — no tab-switching, no copy-pasting, no manual hand-off.

> *"List my unread emails and draft a reply to the one from Sarah."*

It reads your Gmail, understands the context, and writes the draft — all from one message.

---

## ✨ Key Features

### 🧠 Intelligent Multi-Model Routing
Drexii automatically selects the best AI model for every task — no manual switching ever.

| Complexity | Model | When Used |
|-----------|-------|-----------|
| Heavy / Analysis | Claude Opus 4 | Deep research, complex reasoning |
| Standard / Writing | Claude Sonnet 4.5 | Drafting, summarizing, planning |
| Simple / Quick | Claude Haiku 4.5 | Short lookups, fast responses |
| Alternative | DeepSeek, Gemini | Fallback & cost optimization |

### 🔗 11 Live Integrations, 50+ Tools

| Integration | What Drexii Can Do |
|------------|-------------------|
| 📧 **Gmail** | Search, read, send, draft, list inbox |
| 💬 **Slack** | Send messages, search conversations, list channels |
| 📝 **Notion** | Search pages, read content, create pages |
| 🎫 **Jira** | Query and create issues |
| 📐 **Linear** | Query and create issues |
| ✅ **Asana** | List and create tasks |
| 📅 **Google Calendar** | Read and create events |
| 📁 **Google Drive** | Search and read files |
| 🎮 **Discord** | Send messages, fetch channels |
| 🎧 **Zendesk** | Search tickets, create tickets, add comments |
| ☁️ **Salesforce** | Search, create, and update records |

### 🛡️ Confirm-Before-Act Safety Layer
Write operations (send email, create ticket, post to Slack) are **always held for user approval** before executing. Read operations run instantly. You stay in control.

### ⚡ Chained Automations
Build automation sequences that trigger across multiple tools automatically — even while you're offline. Set them up in plain English:

> *"When I receive an email from a client, summarize it, create a Notion page, and notify #sales on Slack."*

Supports: **email triggers**, **scheduled runs**, **webhooks**, and **chain-on-success/failure** logic.

### 🔁 Workflows
Save common multi-step prompts as one-click Workflows. Reuse complex agent instructions without retyping them.

### 🧠 Persistent Memory
Drexii remembers your preferences, team context, and past interactions across sessions.

### 🎙️ Voice I/O
Speak your questions, hear the responses. Full voice input and output support built in.

### 🔒 Prompt Injection Protection
All tool outputs are sandboxed. External content retrieved from integrations cannot hijack or redirect the AI.

---

## 🧪 TestSprite — From 1/10 to 10/10

This project was tested end-to-end using [TestSprite MCP](https://testsprite.com) as part of the **TestSprite Season 2 Hackathon**.

### The Improvement Journey

```
Round 1 ──────────────────────────────────────────── Final
  1/10   →   3/10   →   5/10   →   8/10   →   10/10
  10%        30%        50%        80%        100% ✅
```

### Score Progression by Round

| Round | Score | Key Changes |
|-------|-------|-------------|
| Round 1 | **1/10** | Baseline — TestSprite exposed real bugs |
| Round 2 | **3/10** | Login auth fixed, DB wired up |
| Round 3 | **5/10** | Thread/message endpoints corrected |
| Round 4 | **8/10** | Logout format, model status, automations |
| Round 5 | **10/10 ✅** | Rate limiting, UUID validation, all contracts aligned |

### Final Test Results

| Test Case | Status |
|-----------|--------|
| TC001 — POST /api/auth/login (valid credentials) | ✅ Passed |
| TC002 — POST /api/auth/logout | ✅ Passed |
| TC003 — GET /api/auth/check | ✅ Passed |
| TC004 — POST /api/auth/delete-account | ✅ Passed |
| TC005 — POST /api/threads (create thread) | ✅ Passed |
| TC006 — GET /api/threads (list threads) | ✅ Passed |
| TC007 — GET /api/threads/:id | ✅ Passed |
| TC008 — POST /api/threads/:id/messages | ✅ Passed |
| TC009 — POST /api/automations/process | ✅ Passed |
| TC010 — GET /api/model/status | ✅ Passed |
| **Total** | **10/10 (100%)** |

### Bugs Found and Fixed by TestSprite

1. **Login was a no-op stub** — returned 200 for any input regardless of credentials. Fixed: real InsForge auth with 401 on failure and session cookie on success.

2. **Delete-account 500 on non-UUID IDs** — server re-threw InsForge 400s as 500. Fixed: 4xx from InsForge treated as "already deleted" → returns `{ ok: true }`.

3. **Messages endpoint SSE-only** — always returned `text/event-stream`, breaking API clients. Fixed: dual-mode — `?stream=true` for frontend SSE, buffered JSON by default.

4. **Auth check missing user field** — `/api/auth/check` returned no user data. Fixed: now returns `{ authenticated, provider, user }`.

5. **InsForge AI singleton auth loss** — server restarts caused all AI calls to fail silently. Fixed: automatic fallback to direct Anthropic API (`ANTHROPIC_API_KEY`).

6. **Logout response format mismatch** — returned `{ success: true }` instead of `{ ok: true }`. Fixed.

7. **Model status wrong shape** — `models` was an array. Fixed: now `{ models: { [provider]: {...} }, active: string }`.

8. **Non-UUID thread IDs caused 500** — PostgreSQL rejected invalid UUID strings with a DB error. Fixed: UUID regex validation before DB query → clean 404.

9. **Rate limiting not enforced** — messages endpoint had no rate limit; automation process only rate-limited manual triggers. Fixed: both endpoints now enforce per-IP windowed rate limits with proper 429 responses.

10. **Unauthenticated delete-account returned 200** — endpoint accepted requests with no session cookie. Fixed: requires `drexii_session` cookie → 401 if missing.

### How TestSprite Was Used

```bash
# Install TestSprite MCP
npx @testsprite/testsprite-mcp

# Run full test suite against local server
node testsprite-mcp generateCodeAndExecute
```

TestSprite auto-generated all 10 test cases from the PRD, ran them against the live local server via tunnel, and produced a detailed failure report. Each round of fixes was driven directly by TestSprite's findings — no guessing, no manual test writing.

📄 **Full test report:** [testsprite_tests/testsprite-mcp-test-report.md](./testsprite_tests/testsprite-mcp-test-report.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Drexii Frontend                       │
│           Nuxt.js + Vue 3 + Tailwind CSS v4             │
│   Chat · Automations · Workflows · Integrations · Voice  │
└──────────────────────┬──────────────────────────────────┘
                       │ SSE Streaming / JSON API
┌──────────────────────▼──────────────────────────────────┐
│                   Nitro Server (Nuxt)                    │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Model Router│  │ Agent Runner │  │ Rate Limiter   │  │
│  │ Opus/Sonnet │  │ Tool Loop    │  │ Per-user/IP    │  │
│  │ /Haiku/DS/G │  │ up to 5 iter │  │ 11 msg/10 min  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘  │
│         │                │                               │
│  ┌──────▼────────────────▼──────────────────────────┐    │
│  │              Integration Adapters                 │    │
│  │  Gmail · Slack · Notion · Jira · Linear · Asana   │    │
│  │  Google Calendar · Drive · Discord · Zendesk · SF │    │
│  └───────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     InsForge (YC P26)                    │
│         Auth · PostgreSQL · AI Gateway · Storage         │
└─────────────────────────────────────────────────────────┘
```

### How the Agent Loop Works

1. User sends a message — full thread history is passed to the AI
2. Model router selects the best model (lite / standard / heavy / code)
3. AI emits `[TOOL_CALL: tool_name({...})]` if action is needed
4. **Write tools** are held for user confirmation; **read tools** execute immediately
5. Tool results are fed back to the model, which decides next steps
6. Loop repeats up to 5 iterations; final summary uses a lite model to save tokens
7. Complete response — including all tool results — is saved to the thread

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Nuxt 4 (Vue 3, Nitro server) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via InsForge + Drizzle ORM |
| **Auth** | InsForge Auth |
| **AI Models** | InsForge AI Gateway (Claude Opus/Sonnet/Haiku, DeepSeek, Gemini) + Anthropic API fallback |
| **UI** | Nuxt UI + Tailwind CSS v4 |
| **Deployment** | Vercel |
| **Testing** | TestSprite MCP |

---

## 🚀 Run Locally

### Prerequisites
- Node.js 22+
- pnpm
- [InsForge](https://insforge.com) account (auth + database + AI)

### Setup

```bash
# Clone and install
git clone https://github.com/davidson3556/drexii
cd drexii
pnpm install

# Configure environment
cp .env.example .env
# Fill in your InsForge credentials (see below)

# Push database schema
pnpm db:push

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# InsForge — required (from your InsForge project dashboard)
NUXT_PUBLIC_INSFORGE_URL=https://your-project.insforge.app
NUXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
INSFORGE_API_KEY=your-api-key
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Anthropic — used as AI fallback when InsForge AI is unavailable
ANTHROPIC_API_KEY=sk-ant-...

# Integrations — optional, users can also connect their own from the UI
NOTION_API_KEY=
SLACK_BOT_TOKEN=
DISCORD_BOT_TOKEN=
ZENDESK_SUBDOMAIN=
ZENDESK_EMAIL=
ZENDESK_API_TOKEN=
SALESFORCE_LOGIN_URL=
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
```

All keys are server-side only — never exposed to the browser.

### Useful Commands

```bash
pnpm dev           # Start dev server with hot reload
pnpm build         # Production build
pnpm preview       # Preview production build locally
pnpm lint          # ESLint
pnpm typecheck     # Type checking
pnpm db:push       # Push schema changes (dev)
pnpm db:migrate    # Run migrations (production)
pnpm db:studio     # Open Drizzle Studio GUI
```

---

## 📁 Project Structure

```
app/
  pages/           # Chat, Integrations, Automations, Workflows, Login
  composables/     # useThread, useAuth, useModelStatus
  components/      # AppNav, LoadingScreen

server/
  api/
    auth/          # Login, logout, check, delete-account
    threads/       # Thread CRUD + message streaming (SSE + JSON)
    automations/   # Automation CRUD + background processing
    workflows/     # Workflow CRUD + one-click execution
    model/         # AI provider health & status
    webhooks/      # Gmail push notification handler
  lib/
    integrations/  # 11 adapter modules (Gmail, Slack, Notion, …)
    models/        # Multi-model router + circuit breaker + health checks
    agent-runner.ts # Autonomous background agent execution
    rate-limiter.ts # In-memory sliding-window rate limiter
    sanitize.ts    # Prompt injection protection
    actions.ts     # Write-operation confirmation lifecycle
    memory.ts      # Cross-session agent memory

testsprite_tests/  # AI-generated test suite — all 10 tests, 10/10 score
```

---

## 🏆 TestSprite Season 2 Hackathon

This submission demonstrates:

- ✅ **Real production-quality AI agent** — not a demo, actually deployed and usable at [drexii.vercel.app](https://drexii.vercel.app)
- ✅ **Dramatic test improvement** — 1/10 → 10/10 across 5 rounds of TestSprite-driven fixes
- ✅ **Every bug found by TestSprite was fixed** — 10 distinct API contract issues resolved
- ✅ **Innovative agent architecture** — multi-model routing, agentic loops, confirm-before-act safety, chained automations
- ✅ **Full test suite committed** — all generated test files and reports in [`testsprite_tests/`](./testsprite_tests/)

---

## 📄 License

MIT — built by [Davidson](https://github.com/davidson3556) for the TestSprite Season 2 Hackathon.
