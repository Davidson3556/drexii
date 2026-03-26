# Drexii

An AI-powered workspace assistant that turns conversation into action. Connect your tools — Notion, Slack, Discord, Gmail, Zendesk, Salesforce — and let Drexii search, draft, send, and automate on your behalf.

## What it does

Drexii is a chat interface powered by multiple AI models via [InsForge AI](https://insforge.com). Instead of just answering questions, it takes real actions across your connected tools. When a task requires multiple steps across multiple apps, the agent loop chains them together automatically.

**Example:**
> "Find our top open Zendesk ticket, check if there's a related Notion doc, and post a summary to #support on Slack."

Drexii handles each step in sequence — no manual hand-off between tools.

> "List my unread emails and draft a reply to the one from Sarah."

It reads your Gmail, understands the context, and writes the draft — all from one message.

## Features

- **Multi-model AI routing** — automatically selects the right model for each task (Opus for deep analysis, Sonnet for writing, Haiku for quick responses, DeepSeek for code)
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

Integrations are per-user — connect your own credentials from the Integrations page. Unconfigured integrations are simply unavailable to the agent.

## Automations

Drexii can run autonomously without you being online:

- **Email triggers** — automatically process incoming emails (summarize, reply, categorize)
- **Scheduled tasks** — run AI agents on a cron interval
- **Webhooks** — trigger automations from external services

Create automations from the `/automations` page with plain English instructions like:
> "When I receive an email from a client, summarize it and draft a polite reply."

## Tech stack

- **Framework:** Nuxt 4 (Vue 3, Nitro server)
- **Database:** InsForge (PostgreSQL) via Drizzle ORM
- **AI:** InsForge AI Gateway (Claude Opus 4.6, Claude Sonnet 4.5, Claude Haiku 4.5, DeepSeek, Gemini)
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
    webhooks/      # Gmail push notifications
  lib/
    integrations/  # Gmail, Notion, Slack, Zendesk, Salesforce, Discord adapters
    models/        # InsForge AI router + model clients
    agent-runner.ts # Autonomous background agent execution
    actions.ts     # Pending action lifecycle
    sanitize.ts    # Tool output sanitization
    audit.ts       # Execution audit logging
    memory.ts      # Agent memory persistence

shared/
  types/           # TypeScript interfaces shared across app and server
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
