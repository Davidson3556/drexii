<script setup lang="ts">
const { user } = useAuth()
const toast = useToast()

interface UserIntegration {
  id: string
  integration: string
  credentials: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// State
const userIntegrations = ref<UserIntegration[]>([])
const isLoading = ref(true)
const activeSetup = ref<string | null>(null)
const setupStep = ref<'form' | 'testing' | 'success' | 'error'>('form')
const setupError = ref('')
const formData = ref<Record<string, string>>({})
const disconnecting = ref<string | null>(null)
const confirmingDisconnect = ref<string | null>(null)

// Integration definitions
const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    icon: 'i-simple-icons-slack',
    color: '#E01E5A',
    description: 'Send messages to any channel, search through conversations, and list all channels in your Slack workspace — directly from Drexii chat.',
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: 'xoxb-your-bot-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Slack',
      steps: [
        'Open your browser and go to api.slack.com/apps',
        'Click the green "Create New App" button in the top right',
        'Choose "From scratch", type a name like "Drexii", and pick your Slack workspace from the dropdown',
        'On the left sidebar, click "OAuth & Permissions"',
        'Scroll down to "Bot Token Scopes" and click "Add an OAuth Scope"',
        'Add these 4 scopes one by one: chat:write, channels:read, search:read, channels:history',
        'Scroll back up and click the green "Install to Workspace" button',
        'Slack will ask you to allow access — click "Allow"',
        'You\'ll see a "Bot User OAuth Token" that starts with xoxb- — copy it',
        'Paste that token into the field above and click "Test Connection"'
      ]
    }
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'i-simple-icons-notion',
    color: '#ffffff',
    description: 'Search across all your Notion pages, read their content, and create new pages — so Drexii can pull information from your docs or add to them on your behalf.',
    fields: [
      { key: 'api_key', label: 'Integration Token', placeholder: 'ntn_your-integration-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Notion',
      steps: [
        'Open your browser and go to notion.so/my-integrations',
        'Click the "+ New integration" button',
        'Give it a name like "Drexii", select your workspace from the dropdown, and click "Submit"',
        'You\'ll see an "Internal Integration Secret" that starts with ntn_ — click "Show" then copy it',
        'Now you need to give Drexii access to your pages. Go to any Notion page you want Drexii to read',
        'Click the "..." menu in the top-right corner of the page',
        'Click "Add connections" and search for "Drexii" (the integration you just created)',
        'Click on it to connect — repeat this for each page or database you want Drexii to access',
        'Paste the token into the field above and click "Test Connection"',
        'Tip: If you connect a parent page, all child pages under it will also be accessible'
      ]
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'i-simple-icons-discord',
    color: '#5865F2',
    description: 'Send messages to channels, search through message history, and list all servers your bot is in — letting Drexii communicate with your Discord community.',
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: 'your-discord-bot-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Discord',
      steps: [
        'Open your browser and go to discord.com/developers/applications',
        'Click the "New Application" button in the top right, give it a name like "Drexii", and click "Create"',
        'On the left sidebar, click "Bot"',
        'Click "Reset Token" — Discord will show you a token string. Copy it immediately (you won\'t see it again)',
        'Scroll down to "Privileged Gateway Intents" and turn ON "Message Content Intent" — this lets the bot read messages',
        'Now you need to invite the bot to your server. On the left sidebar, click "OAuth2" then "URL Generator"',
        'Under "Scopes", check the box next to "bot"',
        'Under "Bot Permissions", check: Send Messages, Read Message History, View Channels',
        'Scroll down and copy the "Generated URL" — open it in a new tab',
        'Select your Discord server from the dropdown and click "Authorize"',
        'Go back to Drexii, paste the bot token into the field above, and click "Test Connection"'
      ]
    }
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'i-simple-icons-gmail',
    color: '#EA4335',
    description: 'Search your inbox, read full emails, send new messages, and draft replies — all from Drexii. Perfect for triaging emails or auto-drafting responses without opening Gmail.',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'your-google-client-id.apps.googleusercontent.com', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'GOCSPX-your-client-secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '1//your-refresh-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Gmail',
      steps: [
        'Go to console.cloud.google.com, sign in, and create or select a project',
        'Go to "APIs & Services" → "Library", search "Gmail API", click Enable',
        'Go to "APIs & Services" → "Credentials" → "+ Create Credentials" → "OAuth client ID"',
        'If prompted to configure a consent screen: choose "External", fill in app name + your email, then Save & Continue',
        'Set Application type to "Web application". Under "Authorized redirect URIs" add: https://developers.google.com/oauthplayground',
        'Click Create — copy the Client ID and Client Secret from the popup that appears',
        'Open developers.google.com/oauthplayground in a new tab',
        'Click the gear ⚙️ top-right → check "Use your own OAuth credentials" → paste your Client ID and Client Secret',
        'In the left panel (Step 1), find "Gmail API v1", expand it, select all scopes, then click "Authorize APIs" and sign in',
        'In Step 2, click "Exchange authorization code for tokens" → copy the Refresh Token value',
        'Paste all three values above and click "Test & Connect". Tip: same Client ID works for Calendar and Drive too'
      ]
    }
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    icon: 'i-simple-icons-zendesk',
    color: '#03363D',
    description: 'Search support tickets by keyword, view full ticket details and conversations, and create new tickets — so Drexii can help you manage customer support without switching tabs.',
    fields: [
      { key: 'subdomain', label: 'Subdomain', placeholder: 'yourcompany', type: 'text' },
      { key: 'email', label: 'Agent Email', placeholder: 'agent@company.com', type: 'email' },
      { key: 'api_token', label: 'API Token', placeholder: 'your-zendesk-api-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Zendesk',
      steps: [
        'Log in to your Zendesk account in your browser',
        'Click the gear icon (⚙️) in the left sidebar to open the Admin Center',
        'In the Admin Center, go to "Apps and integrations" → "Zendesk API"',
        'Make sure "Token Access" is turned ON (toggle it if it\'s off)',
        'Click the "Add API token" button and give it a label like "Drexii"',
        'Zendesk will generate a token — click "Copy" to save it. You won\'t be able to see it again',
        'For the Subdomain field: look at your Zendesk URL in the browser. If it\'s https://mycompany.zendesk.com, your subdomain is just "mycompany"',
        'For the Email field: use the email address you log in to Zendesk with (must be an agent account)',
        'Paste the subdomain, email, and token into the fields above and click "Test Connection"'
      ]
    }
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: 'i-lucide-calendar',
    color: '#4285F4',
    description: 'View upcoming events, check your availability, schedule new meetings, and manage your calendar — all through Drexii chat. Great for quickly checking "what\'s next" or booking meetings without leaving your workflow.',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'your-client-id.apps.googleusercontent.com', type: 'password' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'your-client-secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: 'your-refresh-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Google Calendar',
      steps: [
        'Already connected Gmail? Reuse the same Client ID and Client Secret — skip to step 5',
        'Go to console.cloud.google.com → select your project → "APIs & Services" → "Library"',
        'Search "Google Calendar API" and click Enable',
        'Go to "Credentials" → use your existing OAuth client (or create a new "Web application" one with redirect URI: https://developers.google.com/oauthplayground) — copy Client ID and Client Secret',
        'Open developers.google.com/oauthplayground in a new tab',
        'Click the gear ⚙️ top-right → check "Use your own OAuth credentials" → paste your Client ID and Client Secret',
        'In Step 1 (left panel), find "Google Calendar API v3", expand it, select all scopes, click "Authorize APIs" and sign in',
        'In Step 2, click "Exchange authorization code for tokens" → copy the Refresh Token, then paste all three values above and click "Test & Connect"'
      ]
    }
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    icon: 'i-lucide-hard-drive',
    color: '#34A853',
    description: 'Search for files by name, read the contents of Google Docs and Sheets, list recent files, and create new documents — so Drexii can find and summarize your files or create new ones for you.',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'your-client-id.apps.googleusercontent.com', type: 'password' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'your-client-secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: 'your-refresh-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Google Drive',
      steps: [
        'Already connected Gmail or Calendar? Reuse the same Client ID and Client Secret — skip to step 5',
        'Go to console.cloud.google.com → select your project → "APIs & Services" → "Library"',
        'Search "Google Drive API" and Enable it. Also enable "Google Docs API" (needed to read/create documents)',
        'Go to "Credentials" → use your existing OAuth client (or create a new "Web application" one with redirect URI: https://developers.google.com/oauthplayground) — copy Client ID and Client Secret',
        'Open developers.google.com/oauthplayground in a new tab',
        'Click the gear ⚙️ top-right → check "Use your own OAuth credentials" → paste your Client ID and Client Secret',
        'In Step 1 (left panel), find "Drive API v3" and select all scopes. Also expand "Google Docs API v1" and select its scopes. Click "Authorize APIs" and sign in',
        'In Step 2, click "Exchange authorization code for tokens" → copy the Refresh Token, then paste all three values above and click "Test & Connect". Tip: select Gmail + Calendar + Drive scopes together to get one token for all three'
      ]
    }
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: 'i-simple-icons-jira',
    color: '#0052CC',
    description: 'Search and filter issues across projects, view full ticket details with priority and assignee, create new bugs or tasks, and add comments — all from chat. Drexii reads your Jira board so you never have to context-switch.',
    fields: [
      { key: 'subdomain', label: 'Subdomain', placeholder: 'yourcompany (from yourcompany.atlassian.net)', type: 'text' },
      { key: 'email', label: 'Account Email', placeholder: 'you@yourcompany.com', type: 'email' },
      { key: 'api_token', label: 'API Token', placeholder: 'your-jira-api-token', type: 'password' }
    ],
    guide: {
      title: 'How to connect Jira',
      steps: [
        'Open your browser and go to id.atlassian.com/manage-profile/security/api-tokens',
        'Click "Create API token"',
        'Give it a label like "Drexii" and click "Create"',
        'A popup will show your new token — click "Copy" to save it. You won\'t see it again after closing the popup',
        'For the Subdomain field: look at your Jira URL in the browser. If it\'s https://mycompany.atlassian.net, your subdomain is just "mycompany" — do NOT include the full URL',
        'For the Email field: use the email address you use to log in to your Atlassian/Jira account',
        'Paste the subdomain, email, and token into the fields above and click "Test Connection"',
        'Note: The token inherits the same permissions as your Jira account — Drexii can access any project you can see'
      ]
    }
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: 'i-simple-icons-linear',
    color: '#5E6AD2',
    description: 'Search issues by keyword, pull up full issue details with status and assignee, create new issues, add comments, and list everything assigned to you — all without leaving the chat. Built on Linear\'s GraphQL API for fast, real-time data.',
    fields: [
      { key: 'api_key', label: 'Personal API Key', placeholder: 'lin_api_your-key', type: 'password' }
    ],
    guide: {
      title: 'How to connect Linear',
      steps: [
        'Open your browser and go to linear.app, then log in to your workspace',
        'Click your avatar or initials in the bottom-left corner — this opens Settings',
        'In the left sidebar, scroll down and click "Account"',
        'Click "API" under your account settings',
        'You\'ll see a "Personal API keys" section. Click "Create key"',
        'Give it a descriptive label like "Drexii Integration" and click "Create"',
        'Linear will show you the key — it starts with lin_api_. Copy it immediately because it\'s only shown once',
        'Paste the key into the field above and click "Test Connection"',
        'Note: This key has the same permissions as your Linear account — Drexii can read and create issues in any project you have access to'
      ]
    }
  }
]

// Load user integrations
async function loadIntegrations() {
  if (!user.value?.id) return
  isLoading.value = true
  try {
    userIntegrations.value = await $fetch<UserIntegration[]>('/api/user-integrations', {
      headers: { 'x-user-id': user.value.id }
    })
  } catch {
    console.error('Failed to load integrations')
  } finally {
    isLoading.value = false
  }
}

function isConnected(integrationId: string): boolean {
  return userIntegrations.value.some(i => i.integration === integrationId && i.isActive)
}

function getConnectedIntegration(integrationId: string): UserIntegration | undefined {
  return userIntegrations.value.find(i => i.integration === integrationId && i.isActive)
}

function openSetup(integrationId: string) {
  activeSetup.value = integrationId
  setupStep.value = 'form'
  setupError.value = ''
  formData.value = {}
}

function closeSetup() {
  activeSetup.value = null
  setupStep.value = 'form'
  setupError.value = ''
  formData.value = {}
}

async function testAndSave() {
  if (!user.value?.id || !activeSetup.value) return

  const integration = integrations.find(i => i.id === activeSetup.value)
  if (!integration) return

  // Validate all fields are filled
  for (const field of integration.fields) {
    if (!formData.value[field.key]?.trim()) {
      setupError.value = `Please fill in the ${field.label} field.`
      return
    }
  }

  setupStep.value = 'testing'
  setupError.value = ''

  try {
    // Test connection first
    const testResult = await $fetch<{ success: boolean, error: string | null }>('/api/user-integrations/test', {
      method: 'POST',
      body: {
        integration: activeSetup.value,
        credentials: formData.value
      }
    })

    if (!testResult.success) {
      setupStep.value = 'error'
      setupError.value = testResult.error || 'Connection test failed'
      toast.add({ title: 'Connection failed', description: testResult.error || 'Connection test failed', color: 'error' })
      return
    }

    // Save credentials
    await $fetch('/api/user-integrations', {
      method: 'POST',
      headers: { 'x-user-id': user.value.id },
      body: {
        integration: activeSetup.value,
        credentials: formData.value
      }
    })

    setupStep.value = 'success'
    await loadIntegrations()
    const intName = integrations.find(i => i.id === activeSetup.value)?.name ?? activeSetup.value
    toast.add({ title: `${intName} connected`, description: 'Integration is live and ready to use.', color: 'success' })
    closeSetup()
  } catch (err: unknown) {
    setupStep.value = 'error'
    setupError.value = (err as Error).message || 'Failed to save integration'
    toast.add({ title: 'Setup failed', description: (err as Error).message || 'Failed to save integration', color: 'error' })
  }
}

function askDisconnect(integrationId: string) {
  confirmingDisconnect.value = integrationId
}

function cancelDisconnect() {
  confirmingDisconnect.value = null
}

async function confirmDisconnect() {
  const integrationId = confirmingDisconnect.value
  if (!integrationId) return
  const conn = getConnectedIntegration(integrationId)
  if (!conn || !user.value?.id) {
    confirmingDisconnect.value = null
    return
  }

  disconnecting.value = integrationId
  const intName = integrations.find(i => i.id === integrationId)?.name ?? integrationId
  try {
    await $fetch(`/api/user-integrations/${conn.id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': user.value.id }
    })
    await loadIntegrations()
    toast.add({ title: `${intName} disconnected`, color: 'neutral' })
  } catch {
    toast.add({ title: 'Disconnect failed', description: `Could not disconnect ${intName}. Please try again.`, color: 'error' })
  } finally {
    disconnecting.value = null
    confirmingDisconnect.value = null
  }
}

const activeIntegrationDef = computed(() =>
  integrations.find(i => i.id === activeSetup.value)
)

const confirmingIntegrationDef = computed(() =>
  integrations.find(i => i.id === confirmingDisconnect.value)
)

const connectedCount = computed(() =>
  integrations.filter(i => isConnected(i.id)).length
)

onMounted(() => {
  loadIntegrations()
})
</script>

<template>
  <div class="intg-page">
    <!-- Background -->
    <div
      class="pointer-events-none fixed inset-0"
      style="background: radial-gradient(ellipse 60% 50% at 50% 30%, rgba(232,175,72,0.04) 0%, transparent 70%);"
    />

    <div class="intg-container">
      <!-- Header -->
      <div class="intg-header">
        <div>
          <h1 class="intg-title">
            Integrations
          </h1>
          <p class="intg-subtitle">
            Connect your tools to give Drexii superpowers.
            <span
              v-if="connectedCount > 0"
              class="intg-badge"
            >{{ connectedCount }} connected</span>
          </p>
        </div>
      </div>

      <!-- Loading -->
      <LoadingScreen
        v-if="isLoading"
        message="Loading integrations…"
      />

      <!-- Integration Grid -->
      <div
        v-else
        class="intg-grid"
      >
        <div
          v-for="intg in integrations"
          :key="intg.id"
          class="intg-card"
          :class="{ 'intg-card--connected': isConnected(intg.id) }"
        >
          <!-- Card Header -->
          <div class="intg-card-top">
            <div
              class="intg-icon-wrap"
              :style="{ '--accent': intg.color }"
            >
              <UIcon
                :name="intg.icon"
                class="w-6 h-6"
              />
            </div>
            <div
              v-if="isConnected(intg.id)"
              class="intg-status-connected"
            >
              <span class="intg-status-dot" />
              Connected
            </div>
          </div>

          <!-- Card Body -->
          <h3 class="intg-card-name">
            {{ intg.name }}
          </h3>
          <p class="intg-card-desc">
            {{ intg.description }}
          </p>

          <!-- Card Footer -->
          <div class="intg-card-footer">
            <template v-if="isConnected(intg.id)">
              <button
                class="intg-btn intg-btn--reconfigure"
                @click="openSetup(intg.id)"
              >
                <UIcon
                  name="i-lucide-settings"
                  class="w-3.5 h-3.5"
                />
                Reconfigure
              </button>
              <button
                class="intg-btn intg-btn--disconnect"
                :disabled="disconnecting === intg.id"
                @click="askDisconnect(intg.id)"
              >
                <UIcon
                  :name="disconnecting === intg.id ? 'i-lucide-loader-2' : 'i-lucide-unplug'"
                  :class="['w-3.5 h-3.5', disconnecting === intg.id ? 'animate-spin' : '']"
                />
                {{ disconnecting === intg.id ? 'Removing...' : 'Disconnect' }}
              </button>
            </template>
            <button
              v-else
              class="intg-btn intg-btn--connect"
              @click="openSetup(intg.id)"
            >
              <UIcon
                name="i-lucide-plug"
                class="w-3.5 h-3.5"
              />
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup Modal Overlay -->
    <Transition name="modal">
      <div
        v-if="activeSetup && activeIntegrationDef"
        class="intg-overlay"
        @click.self="closeSetup"
      >
        <div class="intg-modal">
          <!-- Modal Header -->
          <div class="intg-modal-header">
            <div class="flex items-center gap-3">
              <div
                class="intg-icon-wrap intg-icon-wrap--sm"
                :style="{ '--accent': activeIntegrationDef.color }"
              >
                <UIcon
                  :name="activeIntegrationDef.icon"
                  class="w-5 h-5"
                />
              </div>
              <div>
                <h2 class="text-base font-semibold text-white/90">
                  Connect {{ activeIntegrationDef.name }}
                </h2>
                <p class="text-xs text-white/35 mt-0.5">
                  {{ setupStep === 'success' ? 'Connected successfully' : 'Enter your credentials below' }}
                </p>
              </div>
            </div>
            <button
              class="intg-modal-close"
              @click="closeSetup"
            >
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4"
              />
            </button>
          </div>

          <!-- Success State -->
          <div
            v-if="setupStep === 'success'"
            class="intg-modal-body"
          >
            <div class="intg-success">
              <div class="intg-success-icon">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="w-10 h-10 text-emerald-400"
                />
              </div>
              <h3 class="text-sm font-medium text-white/80 mt-3">
                {{ activeIntegrationDef.name }} connected!
              </h3>
              <p class="text-xs text-white/40 mt-1">
                Drexii can now use your {{ activeIntegrationDef.name }} tools in chat.
              </p>
              <button
                class="intg-btn intg-btn--connect mt-5"
                @click="closeSetup"
              >
                Done
              </button>
            </div>
          </div>

          <!-- Form / Testing / Error -->
          <template v-else>
            <div class="intg-modal-body">
              <!-- Setup Guide -->
              <details class="intg-guide">
                <summary class="intg-guide-toggle">
                  <UIcon
                    name="i-lucide-book-open"
                    class="w-3.5 h-3.5"
                  />
                  {{ activeIntegrationDef.guide.title }}
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="w-3.5 h-3.5 ml-auto intg-guide-chevron"
                  />
                </summary>
                <ol class="intg-guide-steps">
                  <li
                    v-for="(step, idx) in activeIntegrationDef.guide.steps"
                    :key="idx"
                  >
                    <span class="intg-guide-num">{{ Number(idx) + 1 }}</span>
                    {{ step }}
                  </li>
                </ol>
              </details>

              <!-- Form Fields -->
              <div class="space-y-3 mt-4">
                <div
                  v-for="field in activeIntegrationDef.fields"
                  :key="field.key"
                >
                  <label class="block text-xs text-white/40 mb-1.5">{{ field.label }}</label>
                  <input
                    v-model="formData[field.key]"
                    :type="field.type"
                    :placeholder="field.placeholder"
                    class="intg-input"
                    :disabled="setupStep === 'testing'"
                  >
                </div>
              </div>

              <!-- Error -->
              <div
                v-if="setupError"
                class="intg-error mt-3"
              >
                <UIcon
                  name="i-lucide-circle-alert"
                  class="w-3.5 h-3.5 shrink-0"
                />
                {{ setupError }}
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="intg-modal-footer">
              <button
                class="intg-btn intg-btn--ghost"
                @click="closeSetup"
              >
                Cancel
              </button>
              <button
                class="intg-btn intg-btn--connect"
                :disabled="setupStep === 'testing'"
                @click="testAndSave"
              >
                <UIcon
                  :name="setupStep === 'testing' ? 'i-lucide-loader-2' : 'i-lucide-zap'"
                  :class="['w-3.5 h-3.5', setupStep === 'testing' ? 'animate-spin' : '']"
                />
                {{ setupStep === 'testing' ? 'Testing connection...' : 'Test & Connect' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Disconnect Confirmation Modal -->
    <Transition name="modal">
      <div
        v-if="confirmingIntegrationDef"
        class="intg-overlay"
        @click.self="cancelDisconnect"
      >
        <div class="intg-modal intg-modal--confirm">
          <div class="intg-modal-header">
            <div class="flex items-center gap-3">
              <div class="intg-confirm-icon">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-5 h-5 text-red-400"
                />
              </div>
              <div>
                <h2 class="text-base font-semibold text-white/90">
                  Disconnect {{ confirmingIntegrationDef.name }}?
                </h2>
                <p class="text-xs text-white/35 mt-0.5">
                  This action can be undone by reconnecting.
                </p>
              </div>
            </div>
            <button
              class="intg-modal-close"
              @click="cancelDisconnect"
            >
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4"
              />
            </button>
          </div>

          <div class="intg-modal-body">
            <p class="text-sm text-white/55 leading-relaxed">
              Drexii will no longer be able to use {{ confirmingIntegrationDef.name }} tools. Any automations or workflows that rely on it will stop working until you reconnect.
            </p>
            <p class="text-xs text-white/35 mt-3">
              Your stored credentials will be removed. You can reconnect anytime by providing them again.
            </p>
          </div>

          <div class="intg-modal-footer">
            <button
              class="intg-btn intg-btn--ghost"
              :disabled="disconnecting === confirmingIntegrationDef.id"
              @click="cancelDisconnect"
            >
              Cancel
            </button>
            <button
              class="intg-btn intg-btn--disconnect-confirm"
              :disabled="disconnecting === confirmingIntegrationDef.id"
              @click="confirmDisconnect"
            >
              <UIcon
                v-if="disconnecting === confirmingIntegrationDef.id"
                name="i-lucide-loader-2"
                class="w-3.5 h-3.5 animate-spin"
              />
              <UIcon
                v-else
                name="i-lucide-unplug"
                class="w-3.5 h-3.5"
              />
              {{ disconnecting === confirmingIntegrationDef.id ? 'Disconnecting…' : 'Yes, disconnect' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Page Layout ───────────────────────────────────────────── */
.intg-page {
  min-height: 100vh;
  padding-top: 88px;
  padding-bottom: 48px;
  background: var(--color-drexii-bg);
}

.intg-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Header ────────────────────────────────────────────────── */
.intg-header {
  margin-bottom: 32px;
}

.intg-title {
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.03em;
}

.intg-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.38);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.intg-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(34, 197, 94, 0.12);
  color: rgba(34, 197, 94, 0.85);
  font-size: 11px;
  font-weight: 600;
}

.intg-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

/* ── Grid ──────────────────────────────────────────────────── */
.intg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ── Card ──────────────────────────────────────────────────── */
.intg-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.intg-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.035);
}

.intg-card--connected {
  border-color: rgba(34, 197, 94, 0.15);
}

.intg-card--connected:hover {
  border-color: rgba(34, 197, 94, 0.25);
}

.intg-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.intg-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.intg-icon-wrap--sm {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.intg-status-connected {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(34, 197, 94, 0.85);
}

.intg-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.intg-card-name {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: -0.01em;
}

.intg-card-desc {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.5;
  margin-top: 5px;
  flex: 1;
}

.intg-card-footer {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

/* ── Buttons ───────────────────────────────────────────────── */
.intg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
}

.intg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.intg-btn--connect {
  background: rgba(232, 175, 72, 0.15);
  color: rgba(232, 175, 72, 0.9);
  border: 1px solid rgba(232, 175, 72, 0.2);
}

.intg-btn--connect:hover:not(:disabled) {
  background: rgba(232, 175, 72, 0.22);
  border-color: rgba(232, 175, 72, 0.35);
}

.intg-btn--reconfigure {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.intg-btn--reconfigure:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.intg-btn--disconnect {
  background: rgba(239, 68, 68, 0.08);
  color: rgba(239, 68, 68, 0.7);
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.intg-btn--disconnect:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: rgba(239, 68, 68, 0.9);
}

.intg-btn--disconnect-confirm {
  background: rgba(239, 68, 68, 0.18);
  color: rgba(248, 113, 113, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.28);
}

.intg-btn--disconnect-confirm:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.28);
  border-color: rgba(239, 68, 68, 0.4);
}

.intg-modal--confirm {
  max-width: 440px;
}

.intg-confirm-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.intg-btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
}

.intg-btn--ghost:hover {
  color: rgba(255, 255, 255, 0.6);
}

.intg-btn--oauth {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1;
  justify-content: center;
}

.intg-btn--oauth:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.18);
}

/* ── Modal ─────────────────────────────────────────────────── */
.intg-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  padding: 0;
}

@media (min-width: 640px) {
  .intg-overlay {
    align-items: center;
    padding: 24px;
  }
}

.intg-modal {
  width: 100%;
  max-width: 500px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: rgba(18, 18, 22, 0.99);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

@media (min-width: 640px) {
  .intg-modal {
    border-radius: 20px;
    max-height: 88vh;
  }
}

.intg-modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.intg-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: background 0.18s ease;
}

.intg-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.intg-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  overscroll-behavior: contain;
}

.intg-modal-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Setup Guide ───────────────────────────────────────────── */
.intg-guide {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.intg-guide-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  list-style: none;
}

.intg-guide-toggle::-webkit-details-marker {
  display: none;
}

.intg-guide-chevron {
  transition: transform 0.2s ease;
}

.intg-guide[open] .intg-guide-chevron {
  transform: rotate(180deg);
}

.intg-guide-steps {
  list-style: none;
  padding: 0 12px 12px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intg-guide-steps li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.5;
}

.intg-guide-num {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(232, 175, 72, 0.12);
  color: rgba(232, 175, 72, 0.8);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* ── Form ──────────────────────────────────────────────────── */
.intg-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.18s ease;
  font-family: inherit;
}

.intg-input::placeholder {
  color: rgba(255, 255, 255, 0.18);
}

.intg-input:focus {
  border-color: rgba(232, 175, 72, 0.4);
}

.intg-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Error / Success ───────────────────────────────────────── */
.intg-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(239, 68, 68, 0.85);
  padding: 8px 10px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 8px;
}

.intg-success {
  text-align: center;
  padding: 24px 0;
}

.intg-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

/* ── Modal Transition ──────────────────────────────────────── */
.modal-enter-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .intg-modal {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-leave-active .intg-modal {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .intg-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-leave-to .intg-modal {
  transform: scale(0.97) translateY(5px);
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 639px) {
  .intg-grid {
    grid-template-columns: 1fr;
  }

  /* Bottom-sheet slide-up animation on mobile */
  .modal-enter-from .intg-modal,
  .modal-leave-to .intg-modal {
    transform: translateY(100%);
    opacity: 1;
  }
}

/* ── Light mode ─────────────────────────────────────────── */
:global(html:not(.dark)) .intg-title { color: rgba(12,12,14,0.92); }
:global(html:not(.dark)) .intg-subtitle { color: rgba(12,12,14,0.4); }
:global(html:not(.dark)) .intg-card {
  background: rgba(255,255,255,0.7);
  border-color: rgba(0,0,0,0.08);
}
:global(html:not(.dark)) .intg-card:hover {
  background: rgba(255,255,255,0.95);
  border-color: rgba(0,0,0,0.14);
}
:global(html:not(.dark)) .intg-card--connected {
  border-color: rgba(34,197,94,0.25);
}
:global(html:not(.dark)) .intg-card-name { color: rgba(12,12,14,0.88); }
:global(html:not(.dark)) .intg-card-desc { color: rgba(12,12,14,0.5); }
:global(html:not(.dark)) .intg-btn--reconfigure {
  background: rgba(0,0,0,0.04);
  color: rgba(12,12,14,0.55);
  border-color: rgba(0,0,0,0.08);
}
:global(html:not(.dark)) .intg-btn--reconfigure:hover {
  background: rgba(0,0,0,0.07);
  color: rgba(12,12,14,0.75);
}
:global(html:not(.dark)) .intg-btn--ghost {
  color: rgba(12,12,14,0.45);
}
:global(html:not(.dark)) .intg-btn--ghost:hover {
  color: rgba(12,12,14,0.7);
}
:global(html:not(.dark)) .intg-modal {
  background: rgba(246,246,248,0.99);
  border-color: rgba(0,0,0,0.08);
}
:global(html:not(.dark)) .intg-modal-header {
  border-color: rgba(0,0,0,0.06);
}
:global(html:not(.dark)) .intg-modal-header h2 { color: rgba(12,12,14,0.9); }
:global(html:not(.dark)) .intg-modal-header p { color: rgba(12,12,14,0.4); }
:global(html:not(.dark)) .intg-modal-close {
  background: rgba(0,0,0,0.05);
  color: rgba(12,12,14,0.45);
}
:global(html:not(.dark)) .intg-modal-close:hover {
  background: rgba(0,0,0,0.09);
}
:global(html:not(.dark)) .intg-modal-footer {
  border-color: rgba(0,0,0,0.06);
}
:global(html:not(.dark)) .intg-modal-body label {
  color: rgba(12,12,14,0.5);
}
:global(html:not(.dark)) .intg-guide {
  background: rgba(0,0,0,0.03);
  border-color: rgba(0,0,0,0.07);
}
:global(html:not(.dark)) .intg-guide-toggle {
  color: rgba(12,12,14,0.5);
}
:global(html:not(.dark)) .intg-guide-steps li {
  color: rgba(12,12,14,0.5);
}
:global(html:not(.dark)) .intg-input {
  background: rgba(0,0,0,0.04);
  border-color: rgba(0,0,0,0.08);
  color: rgba(12,12,14,0.85);
}
:global(html:not(.dark)) .intg-input::placeholder {
  color: rgba(12,12,14,0.25);
}
:global(html:not(.dark)) .intg-success h3 { color: rgba(12,12,14,0.8); }
:global(html:not(.dark)) .intg-success p { color: rgba(12,12,14,0.45); }
</style>
