<script setup lang="ts">
const activeSectionId = ref('')
const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'chat', label: 'Chat' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'automations', label: 'Automations' },
  { id: 'chained-automations', label: 'Chained Automations' },
  { id: 'memory', label: 'Memory' },
  { id: 'voice', label: 'Voice I/O' },
  { id: 'actions', label: 'Action Confirmation' },
  { id: 'models', label: 'AI Models' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'faq', label: 'FAQ' }
]

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSectionId.value = entry.target.id
        }
      }
    },
    { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
  )
  nextTick(() => {
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
  })
})

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div
    class="docs-root"
    style="background: var(--color-drexii-bg);"
  >
    <div class="docs-layout max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      <!-- Sidebar nav -->
      <aside class="docs-sidebar hidden lg:block">
        <div class="sticky top-24">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-4">
            Documentation
          </p>
          <nav class="flex flex-col gap-0.5">
            <button
              v-for="s in sections"
              :key="s.id"
              class="docs-nav-link text-left text-[13px] px-3 py-1.5 rounded-lg transition-all"
              :class="activeSectionId === s.id ? 'bg-white/8 text-white font-medium' : 'text-white/40 hover:text-white/60 hover:bg-white/4'"
              @click="scrollTo(s.id)"
            >
              {{ s.label }}
            </button>
          </nav>
        </div>
      </aside>

      <!-- Mobile section picker -->
      <div class="lg:hidden mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <div class="flex gap-2 w-max">
          <button
            v-for="s in sections"
            :key="s.id"
            class="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border"
            :class="activeSectionId === s.id ? 'bg-white/10 border-white/15 text-white' : 'bg-white/4 border-white/8 text-white/40'"
            @click="scrollTo(s.id)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <main class="docs-content min-w-0">
        <!-- Header -->
        <div class="mb-12">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <UIcon
                name="i-lucide-book-open"
                class="w-5 h-5 text-amber-400"
              />
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Documentation
              </h1>
              <p class="text-xs text-white/30 mt-0.5">
                Everything you need to know about Drexii
              </p>
            </div>
          </div>
        </div>

        <!-- Overview -->
        <section
          id="overview"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Overview
          </h2>
          <p class="doc-text">
            Drexii is an AI-powered agent that connects to the tools you already use — Gmail, Slack, Notion, Jira, Linear, Google Calendar, Google Drive, and more — and lets you control all of them from a single chat interface.
          </p>
          <p class="doc-text">
            Instead of switching between 10 tabs, you type what you need in plain English. Drexii figures out which tool to use, executes the action (with your confirmation for anything destructive), and gives you the result right in chat.
          </p>
          <div class="doc-callout">
            <UIcon
              name="i-lucide-lightbulb"
              class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            />
            <p class="text-sm text-white/60">
              <span class="text-white/80 font-medium">Example:</span> "Check my calendar for tomorrow, find the Q4 doc in Drive, and post a summary to #general on Slack" — Drexii handles all three in sequence.
            </p>
          </div>
        </section>

        <!-- Getting Started -->
        <section
          id="getting-started"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Getting Started
          </h2>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">
                1
              </div>
              <div>
                <h3 class="doc-step-title">
                  Create an account
                </h3>
                <p class="doc-text-sm">
                  Sign up with your email or use Google / GitHub OAuth. You'll be ready to chat in seconds.
                </p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">
                2
              </div>
              <div>
                <h3 class="doc-step-title">
                  Connect your tools
                </h3>
                <p class="doc-text-sm">
                  Head to the <NuxtLink
                    to="/integrations"
                    class="text-amber-400 hover:text-amber-300 transition-colors"
                  >Integrations</NuxtLink> page and connect the services you use. Each integration has a step-by-step guide to walk you through API keys or OAuth setup.
                </p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">
                3
              </div>
              <div>
                <h3 class="doc-step-title">
                  Start chatting
                </h3>
                <p class="doc-text-sm">
                  Go to <NuxtLink
                    to="/chat"
                    class="text-amber-400 hover:text-amber-300 transition-colors"
                  >Chat</NuxtLink> and ask Drexii anything. It automatically detects which integration to use based on your message.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Chat -->
        <section
          id="chat"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Chat
          </h2>
          <p class="doc-text">
            The chat is your primary interface. Type a message and Drexii will interpret your intent, call the right tools, and respond with results — all in real time via streaming.
          </p>
          <h3 class="doc-subheading">
            What you can do
          </h3>
          <ul class="doc-list">
            <li><span class="text-white/70 font-medium">Ask questions</span> — "What's on my calendar today?", "Show me open Jira tickets assigned to me"</li>
            <li><span class="text-white/70 font-medium">Take actions</span> — "Send a message to #engineering on Slack saying deployment is done", "Create a Linear issue for the login bug"</li>
            <li><span class="text-white/70 font-medium">Chain requests</span> — "Find the latest report in Drive and email a summary to the team"</li>
            <li><span class="text-white/70 font-medium">Attach files</span> — Click the paperclip icon to upload documents, images, CSVs, and more for context</li>
          </ul>
          <h3 class="doc-subheading">
            Tips
          </h3>
          <ul class="doc-list">
            <li>Press <kbd class="doc-kbd">Shift + Enter</kbd> for a new line without sending</li>
            <li>Use the <strong class="text-white/70">Clear chat</strong> button at the bottom to start a fresh conversation</li>
            <li>Drexii remembers context within a conversation — you can refer to previous messages</li>
          </ul>
        </section>

        <!-- Integrations -->
        <section
          id="integrations"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Integrations
          </h2>
          <p class="doc-text">
            Drexii supports 11 integrations, each with multiple tools the AI can call. Connect them from the <NuxtLink
              to="/integrations"
              class="text-amber-400 hover:text-amber-300 transition-colors"
            >Integrations</NuxtLink> page.
          </p>
          <div class="doc-grid">
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-gmail"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Gmail
                </p>
                <p class="text-xs text-white/35">
                  Search inbox, read emails, send, reply, draft
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Google Calendar
                </p>
                <p class="text-xs text-white/35">
                  List, create, update, delete events, find free slots
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-lucide-hard-drive"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Google Drive
                </p>
                <p class="text-xs text-white/35">
                  Search files, read docs/sheets, list recent, create docs
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-slack"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Slack
                </p>
                <p class="text-xs text-white/35">
                  Send messages, search conversations, list channels
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-notion"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Notion
                </p>
                <p class="text-xs text-white/35">
                  Search, read, create, update pages and databases
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-jira"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Jira
                </p>
                <p class="text-xs text-white/35">
                  Search issues, create tickets, add comments
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-linear"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Linear
                </p>
                <p class="text-xs text-white/35">
                  Search, create issues, comment, view my issues
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-asana"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Asana
                </p>
                <p class="text-xs text-white/35">
                  Search, create, update, complete tasks
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-discord"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Discord
                </p>
                <p class="text-xs text-white/35">
                  Send messages, list channels and servers
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-zendesk"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Zendesk
                </p>
                <p class="text-xs text-white/35">
                  Search, create, update tickets
                </p>
              </div>
            </div>
            <div class="doc-integration-card">
              <UIcon
                name="i-simple-icons-salesforce"
                class="w-5 h-5 text-white/50"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Salesforce
                </p>
                <p class="text-xs text-white/35">
                  Query records, update, create, search
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Automations -->
        <section
          id="automations"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Automations
          </h2>
          <p class="doc-text">
            Automations let Drexii do things for you without being asked. Set up a trigger and a prompt, and Drexii runs it automatically.
          </p>
          <h3 class="doc-subheading">
            Trigger types
          </h3>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Trigger</th>
                  <th>How it works</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="doc-badge">Schedule</span></td>
                  <td>Runs on a cron schedule (e.g. every Monday at 9am)</td>
                  <td>"Summarize last week's Jira tickets every Monday"</td>
                </tr>
                <tr>
                  <td><span class="doc-badge">Webhook</span></td>
                  <td>Runs when an external service hits a webhook URL</td>
                  <td>"When Stripe sends a payment event, log it to Notion"</td>
                </tr>
                <tr>
                  <td><span class="doc-badge">Event</span></td>
                  <td>Runs when a specific event occurs inside Drexii</td>
                  <td>"When a new thread is created, greet the user"</td>
                </tr>
                <tr>
                  <td><span class="doc-badge">Chain</span></td>
                  <td>Runs after another automation completes</td>
                  <td>"After the daily report, email it to the team"</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="doc-text">
            Create and manage automations from the <NuxtLink
              to="/automations"
              class="text-amber-400 hover:text-amber-300 transition-colors"
            >Automations</NuxtLink> page.
          </p>
        </section>

        <!-- Chained Automations -->
        <section
          id="chained-automations"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Chained Automations
          </h2>
          <p class="doc-text">
            Chained automations let you build multi-step workflows. A child automation runs after its parent completes, based on conditions you set.
          </p>
          <h3 class="doc-subheading">
            Chain conditions
          </h3>
          <ul class="doc-list">
            <li><span class="text-white/70 font-medium">On success</span> — child runs only if the parent completes successfully</li>
            <li><span class="text-white/70 font-medium">On failure</span> — child runs only if the parent fails (useful for fallback alerts)</li>
            <li><span class="text-white/70 font-medium">Always</span> — child runs regardless of the parent's outcome</li>
            <li><span class="text-white/70 font-medium">Output contains</span> — child runs if the parent's output includes a specific keyword</li>
          </ul>
          <div class="doc-callout">
            <UIcon
              name="i-lucide-link"
              class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            />
            <div class="text-sm text-white/60">
              <p class="font-medium text-white/80 mb-1">
                Example chain
              </p>
              <p>Parent: "Every morning, pull yesterday's support tickets from Zendesk"</p>
              <p>Child (on success): "Summarize the tickets and post to #support on Slack"</p>
              <p>Child (on failure): "Send me an email saying the Zendesk sync failed"</p>
            </div>
          </div>
        </section>

        <!-- Memory -->
        <section
          id="memory"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Memory
          </h2>
          <p class="doc-text">
            Drexii learns about you as you chat. It stores facts, preferences, and context as memory entries — and you have full control over them.
          </p>
          <h3 class="doc-subheading">
            Memory categories
          </h3>
          <ul class="doc-list">
            <li><span class="doc-badge doc-badge--blue">Fact</span> Information Drexii has learned — your team name, preferred tools, timezone, etc.</li>
            <li><span class="doc-badge doc-badge--purple">Preference</span> How you like things done — "always use bullet points", "keep emails under 100 words"</li>
            <li><span class="doc-badge doc-badge--amber">Context</span> Ongoing situations — "we're in a sprint freeze until Friday", "Q4 report is due next week"</li>
          </ul>
          <h3 class="doc-subheading">
            What you can do
          </h3>
          <ul class="doc-list">
            <li>
              <strong class="text-white/70">View</strong> all memories on the <NuxtLink
                to="/memory"
                class="text-amber-400 hover:text-amber-300 transition-colors"
              >Memory</NuxtLink> page
            </li>
            <li><strong class="text-white/70">Edit</strong> any memory inline if Drexii got something wrong</li>
            <li><strong class="text-white/70">Delete</strong> memories you don't want stored</li>
            <li><strong class="text-white/70">Add</strong> memories manually to give Drexii context upfront</li>
            <li><strong class="text-white/70">Search</strong> through memories by keyword</li>
          </ul>
          <p class="doc-text">
            Memories are scoped to your account. Other users cannot see your memories, and Drexii uses them to personalize responses across conversations.
          </p>
        </section>

        <!-- Voice -->
        <section
          id="voice"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Voice Input & Output
          </h2>
          <p class="doc-text">
            Drexii supports hands-free interaction using your browser's built-in speech capabilities. No third-party services or API costs — everything runs locally in your browser.
          </p>
          <h3 class="doc-subheading">
            Voice input
          </h3>
          <p class="doc-text">
            Click the <UIcon
              name="i-lucide-mic"
              class="w-3.5 h-3.5 text-white/50 inline-block align-text-bottom"
            /> microphone button in the chat input to start speaking. Your words are transcribed in real time and placed into the message box. Click again to stop.
          </p>
          <h3 class="doc-subheading">
            Voice output (TTS)
          </h3>
          <p class="doc-text">
            Click the <UIcon
              name="i-lucide-volume-2"
              class="w-3.5 h-3.5 text-white/50 inline-block align-text-bottom"
            /> speaker button to toggle text-to-speech. When enabled, Drexii reads its responses aloud after each message. The voice adapts to your system's available voices.
          </p>
          <div class="doc-callout">
            <UIcon
              name="i-lucide-info"
              class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            />
            <p class="text-sm text-white/60">
              Voice features require a modern browser (Chrome, Edge, Safari). Firefox has partial support for speech recognition.
            </p>
          </div>
        </section>

        <!-- Action Confirmation -->
        <section
          id="actions"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Action Confirmation
          </h2>
          <p class="doc-text">
            Drexii never takes a destructive or externally-visible action without your permission. When the AI wants to send a message, create a ticket, send an email, or modify a record, it pauses and shows you exactly what it's about to do.
          </p>
          <h3 class="doc-subheading">
            How it works
          </h3>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">
                1
              </div>
              <div>
                <h3 class="doc-step-title">
                  Drexii proposes an action
                </h3>
                <p class="doc-text-sm">
                  You'll see a confirmation card showing the tool name and the exact parameters (message content, ticket fields, etc.).
                </p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">
                2
              </div>
              <div>
                <h3 class="doc-step-title">
                  You review and decide
                </h3>
                <p class="doc-text-sm">
                  Click <strong>Confirm</strong> to execute, or <strong>Cancel</strong> to reject. Nothing happens until you approve.
                </p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">
                3
              </div>
              <div>
                <h3 class="doc-step-title">
                  Result is shown
                </h3>
                <p class="doc-text-sm">
                  After execution, Drexii shows the result of the action right in chat so you can verify it worked.
                </p>
              </div>
            </div>
          </div>
          <p class="doc-text">
            Read-only operations (searching, listing, reading) are executed immediately without confirmation since they don't change anything.
          </p>
        </section>

        <!-- AI Models -->
        <section
          id="models"
          class="doc-section"
        >
          <h2 class="doc-heading">
            AI Models
          </h2>
          <p class="doc-text">
            Drexii uses a multi-tier AI routing system to balance intelligence, speed, and reliability. The system automatically selects the best model for each request.
          </p>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Role</th>
                  <th>When used</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-medium text-white/70">
                    Claude Opus
                  </td>
                  <td>Primary — most capable</td>
                  <td>Complex reasoning, multi-step tasks, important decisions</td>
                </tr>
                <tr>
                  <td class="font-medium text-white/70">
                    Claude Sonnet
                  </td>
                  <td>Fast tier</td>
                  <td>Quick lookups, simple Q&A, routine operations</td>
                </tr>
                <tr>
                  <td class="font-medium text-white/70">
                    DeepSeek
                  </td>
                  <td>Fallback</td>
                  <td>When primary models are rate-limited or unavailable</td>
                </tr>
                <tr>
                  <td class="font-medium text-white/70">
                    Gemini
                  </td>
                  <td>Emergency fallback</td>
                  <td>Last resort to ensure Drexii is always available</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="doc-text">
            You'll see which model answered each message when the fallback indicator is active. The model badge appears next to the timestamp.
          </p>
        </section>

        <!-- Privacy -->
        <section
          id="privacy"
          class="doc-section"
        >
          <h2 class="doc-heading">
            Privacy & Security
          </h2>
          <p class="doc-text">
            Your data stays yours. Here's how Drexii handles it.
          </p>
          <div class="space-y-4">
            <div class="doc-privacy-card">
              <UIcon
                name="i-lucide-lock"
                class="w-5 h-5 text-amber-400 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Credentials are encrypted
                </p>
                <p class="text-xs text-white/40 mt-0.5">
                  API keys and OAuth tokens are stored encrypted in the database. They're decrypted only at the moment of use and never logged.
                </p>
              </div>
            </div>
            <div class="doc-privacy-card">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-amber-400 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Per-user isolation
                </p>
                <p class="text-xs text-white/40 mt-0.5">
                  Integrations, memories, threads, and automations are scoped to your account. No cross-user data leakage.
                </p>
              </div>
            </div>
            <div class="doc-privacy-card">
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5 text-amber-400 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Confirm before acting
                </p>
                <p class="text-xs text-white/40 mt-0.5">
                  Every write action requires your explicit confirmation. Drexii shows you exactly what it will do before doing it.
                </p>
              </div>
            </div>
            <div class="doc-privacy-card">
              <UIcon
                name="i-lucide-eye-off"
                class="w-5 h-5 text-amber-400 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  No training on your data
                </p>
                <p class="text-xs text-white/40 mt-0.5">
                  Your conversations and integration data are not used to train AI models. They're used only to respond to your requests.
                </p>
              </div>
            </div>
            <div class="doc-privacy-card">
              <UIcon
                name="i-lucide-trash-2"
                class="w-5 h-5 text-amber-400 shrink-0"
              />
              <div>
                <p class="text-sm font-medium text-white/80">
                  Delete anytime
                </p>
                <p class="text-xs text-white/40 mt-0.5">
                  You can clear chat, delete memories, disconnect integrations, and remove your account at any time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section
          id="faq"
          class="doc-section"
        >
          <h2 class="doc-heading">
            FAQ
          </h2>
          <div class="space-y-4">
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                Do I need to pay for each integration separately?
              </h3>
              <p class="doc-text-sm">
                No. All integrations are included. You just need your own API keys or OAuth credentials for each service you want to connect.
              </p>
            </div>
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                Can Drexii access my data when I'm not using it?
              </h3>
              <p class="doc-text-sm">
                Only if you have active automations. Automations run on a schedule or in response to events, using the credentials you've connected. You can disable or delete any automation at any time.
              </p>
            </div>
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                What happens if the AI makes a mistake?
              </h3>
              <p class="doc-text-sm">
                For read operations, there's no risk — it just returns data. For write operations, Drexii always asks for your confirmation first. You can review the exact action and cancel if it's wrong.
              </p>
            </div>
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                Can I use Drexii with tools not listed here?
              </h3>
              <p class="doc-text-sm">
                Not yet, but new integrations are being added regularly. If you have a specific tool in mind, let us know.
              </p>
            </div>
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                Is voice input sent to any server?
              </h3>
              <p class="doc-text-sm">
                Voice recognition runs entirely in your browser using the Web Speech API. The transcribed text is sent to Drexii's chat like a normal message, but the audio itself never leaves your device.
              </p>
            </div>
            <div class="doc-faq">
              <h3 class="doc-faq-q">
                Can multiple people use the same Drexii workspace?
              </h3>
              <p class="doc-text-sm">
                Each user has their own account with isolated data. Threads, memories, and integrations are private to each user.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.docs-root {
  min-height: 100dvh;
  padding-top: 64px;
}

.docs-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .docs-layout {
    grid-template-columns: 200px 1fr;
    gap: 3rem;
  }
}

/* ── Section spacing ──────────────────────────────────────── */
.doc-section {
  padding-bottom: 2.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  scroll-margin-top: 96px;
}

.doc-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

/* ── Typography ───────────────────────────────────────────── */
.doc-heading {
  font-size: 1.375rem;
  font-weight: 600;
  color: white;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.doc-subheading {
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.doc-text {
  font-size: 0.875rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.75rem;
}

.doc-text-sm {
  font-size: 0.8125rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.45);
}

/* ── Lists ────────────────────────────────────────────────── */
.doc-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.doc-list li {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.45);
  padding-left: 1.25rem;
  position: relative;
}

.doc-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(232, 194, 116, 0.4);
}

/* ── Callout ──────────────────────────────────────────────── */
.doc-callout {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: rgba(232, 194, 116, 0.05);
  border: 1px solid rgba(232, 194, 116, 0.12);
  margin: 1rem 0;
}

/* ── Steps ────────────────────────────────────────────────── */
.doc-steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1rem 0;
}

.doc-step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.doc-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  shrink: 0;
  flex-shrink: 0;
}

.doc-step-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 0.25rem;
}

/* ── Integration grid ─────────────────────────────────────── */
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}

.doc-integration-card {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Tables ────────────────────────────────────────────────── */
.doc-table-wrap {
  overflow-x: auto;
  margin: 1rem 0;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.doc-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.doc-table td {
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.45);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.doc-table tr:last-child td {
  border-bottom: none;
}

/* ── Badges ────────────────────────────────────────────────── */
.doc-badge {
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  margin-right: 0.375rem;
}

.doc-badge--blue {
  background: rgba(59, 130, 246, 0.15);
  color: rgba(96, 165, 250, 0.9);
}

.doc-badge--purple {
  background: rgba(147, 51, 234, 0.15);
  color: rgba(192, 132, 252, 0.9);
}

.doc-badge--amber {
  background: rgba(232, 194, 116, 0.15);
  color: rgba(232, 194, 116, 0.9);
}

/* ── Privacy cards ────────────────────────────────────────── */
.doc-privacy-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── FAQ ───────────────────────────────────────────────────── */
.doc-faq {
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.doc-faq-q {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 0.5rem;
}

/* ── Keyboard shortcut ────────────────────────────────────── */
.doc-kbd {
  display: inline-flex;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
}
</style>
