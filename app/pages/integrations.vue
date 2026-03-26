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

// Integration definitions
const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    icon: 'i-simple-icons-slack',
    color: '#E01E5A',
    description: 'Send messages, search conversations, and list channels in your Slack workspace.',
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: 'xoxb-your-bot-token', type: 'password' }
    ],
    guide: {
      title: 'How to get your Slack Bot Token',
      steps: [
        'Go to api.slack.com/apps and click "Create New App"',
        'Choose "From scratch", name your app, and select your workspace',
        'Go to "OAuth & Permissions" in the sidebar',
        'Under "Bot Token Scopes", add: chat:write, channels:read, search:read, channels:history',
        'Click "Install to Workspace" at the top and authorize',
        'Copy the "Bot User OAuth Token" (starts with xoxb-)'
      ]
    }
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'i-simple-icons-notion',
    color: '#ffffff',
    description: 'Search pages, read content, and create new pages in your Notion workspace.',
    fields: [
      { key: 'api_key', label: 'Integration Token', placeholder: 'ntn_your-integration-token', type: 'password' }
    ],
    guide: {
      title: 'How to get your Notion Integration Token',
      steps: [
        'Go to notion.so/my-integrations and click "New integration"',
        'Name it (e.g., "Drexii"), select your workspace, and click "Submit"',
        'Copy the "Internal Integration Secret" (starts with ntn_)',
        'Important: Go to each Notion page/database you want Drexii to access',
        'Click "..." menu → "Add connections" → Select your integration'
      ]
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'i-simple-icons-discord',
    color: '#5865F2',
    description: 'Send messages, search channels, and list servers connected to your Discord bot.',
    fields: [
      { key: 'bot_token', label: 'Bot Token', placeholder: 'your-discord-bot-token', type: 'password' }
    ],
    guide: {
      title: 'How to get your Discord Bot Token',
      steps: [
        'Go to discord.com/developers/applications and click "New Application"',
        'Name your app and click "Create"',
        'Go to "Bot" in the sidebar and click "Add Bot"',
        'Click "Reset Token" and copy the token',
        'Enable "Message Content Intent" under Privileged Gateway Intents',
        'Go to "OAuth2" → "URL Generator", select "bot" scope with permissions: Send Messages, Read Message History, View Channels',
        'Copy the generated URL and open it to invite the bot to your server'
      ]
    }
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'i-simple-icons-gmail',
    color: '#EA4335',
    description: 'Search, read, send, and draft emails from your Gmail account.',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'your-google-client-id.apps.googleusercontent.com', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'GOCSPX-your-client-secret', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '1//your-refresh-token', type: 'password' }
    ],
    guide: {
      title: 'How to get your Gmail API credentials',
      steps: [
        'Go to console.cloud.google.com and create a new project (or select existing)',
        'Enable the Gmail API: APIs & Services → Library → search "Gmail API" → Enable',
        'Go to APIs & Services → Credentials → Create Credentials → OAuth client ID',
        'Set Application type to "Web application"',
        'Add "https://developers.google.com/oauthplayground" as an authorized redirect URI',
        'Copy the Client ID and Client Secret',
        'Go to developers.google.com/oauthplayground',
        'Click the gear icon → check "Use your own OAuth credentials" → paste Client ID & Secret',
        'In Step 1, select "Gmail API v1" → select all scopes → click "Authorize APIs"',
        'In Step 2, click "Exchange authorization code for tokens" → copy the Refresh Token'
      ]
    }
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    icon: 'i-simple-icons-zendesk',
    color: '#03363D',
    description: 'Search tickets, view ticket details, and create new support tickets.',
    fields: [
      { key: 'subdomain', label: 'Subdomain', placeholder: 'yourcompany', type: 'text' },
      { key: 'email', label: 'Agent Email', placeholder: 'agent@company.com', type: 'email' },
      { key: 'api_token', label: 'API Token', placeholder: 'your-zendesk-api-token', type: 'password' }
    ],
    guide: {
      title: 'How to get your Zendesk credentials',
      steps: [
        'Log in to your Zendesk admin panel',
        'Go to Admin Center → Apps and integrations → Zendesk API',
        'Enable "Token Access" if not already enabled',
        'Click "Add API token", give it a label, and click "Copy"',
        'Your subdomain is the part before .zendesk.com in your URL (e.g., "mycompany")',
        'Use the email of a Zendesk agent with appropriate permissions'
      ]
    }
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: 'i-simple-icons-salesforce',
    color: '#00A1E0',
    description: 'Search records, view details, and create new records across Salesforce objects.',
    fields: [
      { key: 'login_url', label: 'Login URL', placeholder: 'https://login.salesforce.com', type: 'url' },
      { key: 'client_id', label: 'Client ID (Consumer Key)', placeholder: 'your-connected-app-client-id', type: 'password' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'your-connected-app-client-secret', type: 'password' }
    ],
    guide: {
      title: 'How to get your Salesforce credentials',
      steps: [
        'Log in to Salesforce and go to Setup',
        'Search for "App Manager" in Quick Find',
        'Click "New Connected App"',
        'Enable OAuth Settings, set callback URL to https://login.salesforce.com/services/oauth2/callback',
        'Select scopes: "Full access (full)" or "API (api)"',
        'Save and wait a few minutes for the app to be ready',
        'Copy the "Consumer Key" (Client ID) and "Consumer Secret" (Client Secret)',
        'Login URL is usually https://login.salesforce.com (or your custom domain)'
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

async function disconnectIntegration(integrationId: string) {
  const conn = getConnectedIntegration(integrationId)
  if (!conn || !user.value?.id) return

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
  }
}

const activeIntegrationDef = computed(() =>
  integrations.find(i => i.id === activeSetup.value)
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
            <span v-if="connectedCount > 0" class="intg-badge">{{ connectedCount }} connected</span>
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="intg-loading">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-white/30" />
      </div>

      <!-- Integration Grid -->
      <div v-else class="intg-grid">
        <div
          v-for="intg in integrations"
          :key="intg.id"
          class="intg-card"
          :class="{ 'intg-card--connected': isConnected(intg.id) }"
        >
          <!-- Card Header -->
          <div class="intg-card-top">
            <div class="intg-icon-wrap" :style="{ '--accent': intg.color }">
              <UIcon :name="intg.icon" class="w-6 h-6" />
            </div>
            <div v-if="isConnected(intg.id)" class="intg-status-connected">
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
              <button class="intg-btn intg-btn--reconfigure" @click="openSetup(intg.id)">
                <UIcon name="i-lucide-settings" class="w-3.5 h-3.5" />
                Reconfigure
              </button>
              <button
                class="intg-btn intg-btn--disconnect"
                :disabled="disconnecting === intg.id"
                @click="disconnectIntegration(intg.id)"
              >
                <UIcon
                  :name="disconnecting === intg.id ? 'i-lucide-loader-2' : 'i-lucide-unplug'"
                  :class="['w-3.5 h-3.5', disconnecting === intg.id ? 'animate-spin' : '']"
                />
                {{ disconnecting === intg.id ? 'Removing...' : 'Disconnect' }}
              </button>
            </template>
            <button v-else class="intg-btn intg-btn--connect" @click="openSetup(intg.id)">
              <UIcon name="i-lucide-plug" class="w-3.5 h-3.5" />
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
              <div class="intg-icon-wrap intg-icon-wrap--sm" :style="{ '--accent': activeIntegrationDef.color }">
                <UIcon :name="activeIntegrationDef.icon" class="w-5 h-5" />
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
            <button class="intg-modal-close" @click="closeSetup">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Success State -->
          <div v-if="setupStep === 'success'" class="intg-modal-body">
            <div class="intg-success">
              <div class="intg-success-icon">
                <UIcon name="i-lucide-check-circle-2" class="w-10 h-10 text-emerald-400" />
              </div>
              <h3 class="text-sm font-medium text-white/80 mt-3">
                {{ activeIntegrationDef.name }} connected!
              </h3>
              <p class="text-xs text-white/40 mt-1">
                Drexii can now use your {{ activeIntegrationDef.name }} tools in chat.
              </p>
              <button class="intg-btn intg-btn--connect mt-5" @click="closeSetup">
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
                  <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
                  {{ activeIntegrationDef.guide.title }}
                  <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 ml-auto intg-guide-chevron" />
                </summary>
                <ol class="intg-guide-steps">
                  <li v-for="(step, idx) in activeIntegrationDef.guide.steps" :key="idx">
                    <span class="intg-guide-num">{{ idx + 1 }}</span>
                    {{ step }}
                  </li>
                </ol>
              </details>

              <!-- Form Fields -->
              <div class="space-y-3 mt-4">
                <div v-for="field in activeIntegrationDef.fields" :key="field.key">
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
              <div v-if="setupError" class="intg-error mt-3">
                <UIcon name="i-lucide-circle-alert" class="w-3.5 h-3.5 shrink-0" />
                {{ setupError }}
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="intg-modal-footer">
              <button class="intg-btn intg-btn--ghost" @click="closeSetup">
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

.intg-btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
}

.intg-btn--ghost:hover {
  color: rgba(255, 255, 255, 0.6);
}

/* ── Modal ─────────────────────────────────────────────────── */
.intg-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  padding: 24px;
}

.intg-modal {
  width: 100%;
  max-width: 480px;
  background: rgba(18, 18, 22, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.intg-modal-header {
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
  padding: 20px;
}

.intg-modal-footer {
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
@media (max-width: 640px) {
  .intg-grid {
    grid-template-columns: 1fr;
  }

  .intg-modal {
    max-width: 100%;
    border-radius: 16px;
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
