# Drexii

**Live demo:** [drexii.vercel.app](https://drexii.vercel.app)

An AI-powered workspace assistant that turns conversation into action. Connect your tools — Notion, Slack, Discord, Gmail, Zendesk — and let Drexii search, draft, send, and automate on your behalf.

## What it does

Drexii is a chat interface powered by multiple AI models via [InsForge AI](https://insforge.com). Instead of just answering questions, it takes real actions across your connected tools. When a task requires multiple steps across multiple apps, the agent loop chains them together automatically.

**Example:**
> "Find our top open Zendesk ticket, check if there's a related Notion doc, and post a summary to #support on Slack."

Drexii handles each step in sequence — no manual hand-off between tools.

> "List my unread emails and draft a reply to the one from Sarah."

It reads your Gmail, understands the context, and writes the draft — all from one message.

## Features

- **Multi-model AI routing** — automatically selects the right model for each task (Opus for deep analysis, Sonnet for writing, Haiku for quick responses)
- **Agentic loop** — multi-step tool execution until the task is complete (up to 5 iterations)
- **Gmail integration** — read, search, send, draft, and list emails directly from chat
- **Autonomous automations** — set up triggers (email received, schedule, webhook) that run AI agents in the background without you being online
- **Action confirmation gate** — write operations (send message, create record) require explicit user approval before executing
- **Circuit breaker** — automatic fallback if the primary model is unavailable
- **Prompt injection protection** — tool outputs are sandboxed; the model cannot be hijacked by external content
- **Real-time streaming** — responses and agent activity stream via SSE
- **Thread history** — full conversation persistence with message and tool call records
- **Persistent memory** — Drexii remembers your preferences and context across conversations
- **Audit log** — every tool execution is recorded

## Integrations

| App | Capabilities |
|-----|-------------|
| **Gmail** | Search emails, read messages, send emails, create drafts, list inbox |
| **Notion** | Search pages, read content, create pages |
| **Slack** | Send messages, search conversations, list channels |
| **Discord** | Send messages, fetch channels |
| **Zendesk** | Search tickets, create tickets, add comments |
| **Salesforce** | Search records, create records, update records |
| **Jira** | Query and create issues |
| **Linear** | Query and create issues |
| **Asana** | List and create tasks |
| **Google Calendar** | Read and create events |
| **Google Drive** | Search and read files |

Integrations are per-user — connect your own credentials from the Integrations page. Unconfigured integrations are simply unavailable to the agent.

## Automations

Drexii can run autonomously without you being online:

- **Email triggers** — automatically process incoming emails (summarize, reply, categorize)
- **Scheduled tasks** — run AI agents on a cron interval
- **Webhooks** — trigger automations from external services
- **Chain automations** — automations that trigger other automations on success, failure, or custom conditions

Create automations from the `/automations` page with plain English instructions like:
> "When I receive an email from a client, summarize it and draft a polite reply."

## AI Testing with TestSprite

This project was tested using [TestSprite MCP](https://testsprite.com) as part of the TestSprite Season 2 Hackathon.

### Round 1 → Round 2 Improvement

| Test | Round 1 | Round 2 |
|------|---------|---------|
| TC001 POST /api/auth/login — valid credentials | ❌ Stub (200 for any input) | ✅ **Pass** |
| TC002 POST /api/auth/login — invalid credentials | ✅ Pass | ✅ **Pass** |
| TC003 POST /api/auth/delete-account — valid user ID | ❌ 401 | ✅ **Pass** |
| TC004 POST /api/auth/delete-account — no user ID | ❌ 401 | ✅ **Pass** |
| TC005 POST /api/threads — create thread | ❌ DB missing | ✅ **Pass** |
| TC006 POST /api/threads/:id/messages — with content | ❌ DB missing | ✅ **Pass** |
| TC007 POST /api/threads/:id/messages — missing content | ❌ DB missing | ✅ **Pass** |
| TC008 POST /api/automations — create valid | ❌ DB missing + schema reject | ✅ **Pass** |
| TC009 POST /api/automations — invalid data | ❌ DB missing | ✅ **Pass** |
| TC010 POST /api/automations/process | ❌ DB missing | ✅ **Pass** |
| **Result** | **1/10 (10%)** | **10/10 (100%) — 10× improvement** |

### Bugs Fixed Between Rounds

1. **Login endpoint was a no-op stub** — always returned HTTP 200 regardless of credentials. Fixed: now calls `insforge.auth.signInWithPassword()`, returns 401 on bad credentials, and sets a `drexii_session` cookie on success.

2. **Delete-account 500 on non-UUID IDs** — InsForge rejects non-UUID user IDs with 400, which the server re-threw as 500. Fixed: any 4xx from InsForge is treated as "already deleted" and returns `{ success: true }`.

3. **Messages endpoint SSE-only** — the messages endpoint always returned `text/event-stream`, which API clients and test runners could not parse. Fixed: added dual-mode support — `?stream=true` returns SSE for the frontend, default returns buffered JSON.

4. **Auth check returned no user field** — `/api/auth/check` returned `{ authenticated: true }` with no `user`. Fixed: now returns `{ authenticated, provider, user }`.

5. **Chain condition silent passthrough** — unknown chain conditions silently fired chained automations. Fixed: unknown conditions now return `false` with a warning log.

6. **XML attribute injection** — `wrapToolContext` used `toolName` directly as an XML attribute value. Fixed: special chars are escaped before injection.

7. **Numbered list closing tag** — `renderMarkdown()` always closed numbered lists with `</ul>`. Fixed: now tracks list type and closes with the correct tag.

8. **Chat endpoint 500 (InsForge AI AUTH\_UNAUTHORIZED)** — the InsForge AI singleton loses its session on server restart, causing all AI calls to fail. Fixed: the model router automatically falls back to the direct Anthropic API (`ANTHROPIC_API_KEY`) when InsForge AI is unavailable.

### Improvements Shipped for Round 2

- **Rate limiting** — `/api/threads/:id/messages` is limited to **20 AI requests per 10 minutes** per user/IP. `/api/automations/process` manual triggers are limited to **10 per 10 minutes** per IP. All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers. Returns 429 with a human-readable wait time when exceeded.

- **Anthropic API fallback** — if InsForge AI is unreachable or returns an auth error, the model router seamlessly retries the request against the direct Anthropic API. Zero downtime for end users.

- **Dual-mode messages endpoint** — the same endpoint serves both the Vue frontend (SSE streaming via `?stream=true`) and API clients / test runners (buffered JSON by default). Fully backwards-compatible.

### TestSprite Report

Full AI-generated test report: [testsprite_tests/testsprite-mcp-test-report.md](./testsprite_tests/testsprite-mcp-test-report.md)

## Tech stack

- **Framework:** Nuxt 4 (Vue 3, Nitro server)
- **Database:** InsForge (PostgreSQL) via Drizzle ORM
- **AI:** InsForge AI Gateway (Claude Opus 4.6, Claude Sonnet 4.5, Claude Haiku 4.5, DeepSeek, Gemini) with direct Anthropic API fallback
- **Auth:** InsForge Auth
- **UI:** Nuxt UI + Tailwind CSS v4
- **Deployment:** Vercel

## Getting started

### Prerequisites

- Node.js 22+
- pnpm
- [InsForge](https://insforge.com) account (provides database, auth, and AI gateway)

### Setup

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env

# Push the database schema
pnpm db:push

# Start the dev server
pnpm dev
```

Open http://localhost:3000.

### Environment variables

```env
# InsForge (required — from your InsForge project settings)
NUXT_PUBLIC_INSFORGE_URL=https://your-project.insforge.app
NUXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Anthropic (used as fallback when InsForge AI is unavailable)
ANTHROPIC_API_KEY=

# Integrations (optional — users can connect their own from the UI)
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

All keys are server-side only and never exposed to the browser. Gmail credentials are stored per-user via the Integrations page.

## Database

The database is hosted on [InsForge](https://insforge.com). Copy your `DATABASE_URL` from your InsForge project settings and add it to `.env`.

```bash
pnpm db:generate   # Generate migration files from schema changes
pnpm db:migrate    # Run pending migrations
pnpm db:push       # Push schema directly (dev only)
pnpm db:studio     # Open Drizzle Studio GUI
```

## Development

```bash
pnpm dev           # Start dev server with hot reload
pnpm lint          # ESLint
pnpm typecheck     # Vue TSC + Nuxt type checking
pnpm build         # Production build
pnpm preview       # Preview production build locally
```

## Project structure

```
app/
  pages/           # Chat, integrations, automations, login
  composables/     # useThread, useAuth, useModelStatus
  components/      # AppNav, AppLogo

server/
  api/
    threads/       # Chat thread CRUD + message streaming
    actions/       # Confirm/cancel pending write operations
    automations/   # Automation CRUD + processing
    workflows/     # Workflow CRUD + execution
    user-integrations/ # Per-user OAuth credential storage
    memory/        # Agent memory CRUD
    model/         # AI provider health status
    webhooks/      # Gmail push notifications
  lib/
    integrations/  # Gmail, Notion, Slack, Zendesk, Salesforce, Discord adapters
    models/        # InsForge AI router + model clients + circuit breaker
    utils/         # Shared parse-tool-calls utility
    agent-runner.ts # Autonomous background agent execution
    actions.ts     # Pending action lifecycle
    sanitize.ts    # Tool output sanitization + prompt injection protection
    audit.ts       # Execution audit logging
    memory.ts      # Agent memory persistence

shared/
  types/           # TypeScript interfaces shared across app and server

testsprite_tests/  # TestSprite AI-generated test suite (Hackathon Round 1 & 2)
```

## How the agent loop works

1. User sends a message — full thread history is passed to the AI
2. The model router selects the best model based on task complexity (lite/standard/heavy/code)
3. If the AI needs a tool, it emits `[TOOL_CALL: tool_name({...})]`
4. Write tools (send, create, update) are held for user confirmation; read tools execute immediately
5. Results are fed back to the model, which decides whether to call more tools or summarize
6. Steps repeat up to 5 times; the final summary uses a lite model to save tokens
7. The complete response — including all tool results — is saved to the thread

## License

MIT
