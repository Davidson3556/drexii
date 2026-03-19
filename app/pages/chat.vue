<script setup lang="ts">
const { currentThread, messages, isStreaming, streamingContent, agentSteps, error, pendingActions, lastMessageContent, createThread, loadThread, send, confirmAction, cancelAction } = useThread()
const { isFallback, startPolling, stopPolling } = useModelStatus()
const { renderMarkdown } = useMarkdown()
const route = useRoute()

const inputValue = ref('')
const messagesContainer = ref<HTMLElement>()

const categories = ['Research', 'Support Ops', 'Writing', 'Actions']
const activeCategory = ref('Research')

const suggestions = [
  { text: 'Summarize our product in simple terms for new users', icon: 'i-lucide-sparkles' },
  { text: 'Draft a friendly support reply using our help docs', icon: 'i-lucide-message-square' },
  { text: 'Pull the latest metrics from our analytics dashboard', icon: 'i-lucide-bar-chart-3' },
  { text: 'Create a follow-up email for the last sales meeting', icon: 'i-lucide-mail' }
]

onMounted(async () => {
  startPolling()

  const autorun = route.query.autorun as string | undefined

  if (!currentThread.value) {
    const savedId = import.meta.client ? localStorage.getItem('drexii_thread_id') : null
    if (savedId) {
      await loadThread(savedId).catch(() => createThread())
    } else {
      await createThread()
    }
  }

  if (autorun) {
    await send(decodeURIComponent(autorun))
  }
})

onUnmounted(() => {
  stopPolling()
  if (countdownTimer) clearInterval(countdownTimer)
})

watch([messages, streamingContent], () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

async function handleSend() {
  const content = inputValue.value.trim()
  if (!content || isStreaming.value) return
  inputValue.value = ''
  await send(content)
}

function handleSuggestion(text: string) {
  inputValue.value = text
  handleSend()
}

const hasMessages = computed(() => messages.value.length > 0)

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const isRateLimit = computed(() => !!error.value?.toLowerCase().includes('rate limit'))
const errorDisplay = computed(() => error.value?.replace(/retry_after:\d+/i, '').trim() ?? '')
const retryCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

watch(error, (val) => {
  if (val?.toLowerCase().includes('rate limit')) {
    const match = val.match(/retry_after:(\d+)/i)
    retryCountdown.value = match?.[1] ? parseInt(match[1], 10) : 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      retryCountdown.value--
      if (retryCountdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  }
})

async function handleRetry() {
  if (!lastMessageContent.value) return
  await send(lastMessageContent.value)
}

const TOOL_LABELS: Record<string, string> = {
  notion_search: 'Searching Notion',
  notion_create_page: 'Creating Notion page',
  notion_update_page: 'Updating Notion page',
  slack_send_message: 'Sending Slack message',
  slack_list_channels: 'Listing Slack channels',
  salesforce_query: 'Querying Salesforce',
  salesforce_update: 'Updating Salesforce',
  zendesk_search: 'Searching Zendesk',
  zendesk_create_ticket: 'Creating Zendesk ticket',
  zendesk_update_ticket: 'Updating Zendesk ticket'
}

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name.replace(/_/g, ' ')
}
</script>

<template>
  <div
    class="h-screen flex flex-col"
    style="background: var(--color-drexii-bg);"
  >
    <!-- ======== MAIN CHAT AREA ======== -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Empty State (Welcome Screen) -->
      <div
        v-if="!hasMessages"
        class="flex-1 flex flex-col items-center justify-center px-6"
      >
        <div class="w-full max-w-2xl mx-auto text-center">
          <h1 class="text-2xl font-semibold text-white mb-2">
            Welcome back
          </h1>
          <p class="text-white/40 text-sm mb-10">
            How can I help you today?
          </p>

          <!-- Input -->
          <div class="glass-card p-1 mb-6">
            <div class="glass-input p-4">
              <input
                v-model="inputValue"
                type="text"
                placeholder="Ask anything. Type @ for mentions and / for shortcuts."
                class="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
                @keyup.enter="handleSend"
              >
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-paperclip"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
                  />
                  <UIcon
                    name="i-lucide-bar-chart-2"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
                  />
                  <UIcon
                    name="i-lucide-map-pin"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <button class="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors">
                    <UIcon
                      name="i-lucide-sparkles"
                      class="w-3.5 h-3.5 text-white/40"
                    />
                  </button>
                  <button
                    class="w-7 h-7 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-colors disabled:opacity-30"
                    :disabled="!inputValue.trim() || isStreaming"
                    @click="handleSend"
                  >
                    <UIcon
                      name="i-lucide-arrow-up"
                      class="w-3.5 h-3.5 text-white"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="flex items-center justify-center gap-2 mb-6 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat"
              :class="['pill', cat === activeCategory ? 'pill-active' : 'pill-default']"
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Suggestions -->
          <div class="space-y-1 text-left max-w-lg mx-auto">
            <div
              v-for="(suggestion, i) in suggestions"
              :key="i"
              class="suggestion-row group"
              @click="handleSuggestion(suggestion.text)"
            >
              <UIcon
                :name="suggestion.icon"
                class="w-4 h-4 text-white/20 shrink-0"
              />
              <span class="flex-1">{{ suggestion.text }}</span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Messages List -->
      <div
        v-else
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-6 py-6"
      >
        <div class="max-w-3xl mx-auto space-y-4">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
          >
            <div :class="message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'">
              <div
                v-if="message.role === 'assistant'"
                class="text-sm leading-relaxed prose-chat"
                v-html="renderMarkdown(message.content)"
              />
              <p
                v-else
                class="text-sm leading-relaxed whitespace-pre-wrap"
              >
                {{ message.content }}
              </p>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-xs text-white/20">{{ formatTime(message.createdAt) }}</span>
                <span
                  v-if="message.modelUsed && isFallback"
                  class="text-xs text-white/20"
                >· via {{ message.modelUsed === 'gemini' ? 'Gemini' : 'Claude' }}</span>
              </div>
            </div>
          </div>

          <!-- Pending Action Confirmations -->
          <div
            v-for="action in pendingActions"
            :key="action.actionId"
            class="flex justify-start"
          >
            <div
              class="message-bubble-assistant border border-amber-500/30 bg-amber-500/5"
            >
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-shield-alert"
                  class="w-4 h-4 text-amber-400 mt-0.5 shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-amber-300 mb-1">
                    Action requires confirmation
                  </p>
                  <p class="text-xs text-white/50 mb-1">
                    Tool: <span class="text-white/70 font-mono">{{ action.tool }}</span>
                  </p>
                  <pre class="text-xs text-white/40 font-mono bg-white/5 rounded p-2 overflow-x-auto mb-3">{{ JSON.stringify(action.params, null, 2) }}</pre>
                  <div class="flex gap-2">
                    <button
                      class="px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
                      @click="confirmAction(action.actionId)"
                    >
                      Confirm
                    </button>
                    <button
                      class="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 text-xs font-medium transition-colors"
                      @click="cancelAction(action.actionId)"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Streaming Message -->
          <div
            v-if="isStreaming"
            class="flex justify-start"
          >
            <div class="message-bubble-assistant" :class="{ 'streaming-cursor': streamingContent }">
              <!-- Agent activity steps -->
              <div
                v-if="agentSteps.length > 0"
                class="flex flex-wrap gap-1.5 mb-3"
              >
                <span
                  v-for="(step, i) in agentSteps"
                  :key="i"
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all"
                  :class="step.status === 'executing'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : step.status === 'done'
                      ? 'bg-white/5 border-white/10 text-white/30'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'"
                >
                  <span
                    v-if="step.status === 'executing'"
                    class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"
                  />
                  <UIcon
                    v-else-if="step.status === 'done'"
                    name="i-lucide-check"
                    class="w-3 h-3 shrink-0"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-x"
                    class="w-3 h-3 shrink-0"
                  />
                  {{ toolLabel(step.tool) }}
                </span>
              </div>

              <!-- Streamed text -->
              <div
                v-if="streamingContent"
                class="text-sm leading-relaxed prose-chat"
                v-html="renderMarkdown(streamingContent)"
              />

              <!-- Typing dots (no content yet) -->
              <div
                v-else
                class="flex items-center gap-1.5 py-1"
              >
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
              </div>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="flex justify-center"
          >
            <div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col items-center gap-2">
              <span>{{ errorDisplay }}</span>
              <div
                v-if="isRateLimit"
                class="flex items-center gap-2"
              >
                <span
                  v-if="retryCountdown > 0"
                  class="text-xs text-red-400/60"
                >Retry in {{ retryCountdown }}s</span>
                <button
                  class="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors disabled:opacity-40"
                  :disabled="retryCountdown > 0 || isStreaming"
                  @click="handleRetry"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Input (when messages exist) -->
      <div
        v-if="hasMessages"
        class="px-6 pb-6 pt-2"
      >
        <div class="max-w-3xl mx-auto">
          <div class="glass-input p-4 flex items-center gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-paperclip"
                class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
              />
            </div>
            <input
              v-model="inputValue"
              type="text"
              placeholder="Type your message..."
              class="flex-1 bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
              :disabled="isStreaming"
              @keyup.enter="handleSend"
            >
            <button
              class="w-8 h-8 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-colors disabled:opacity-30 shrink-0"
              :disabled="!inputValue.trim() || isStreaming"
              @click="handleSend"
            >
              <UIcon
                name="i-lucide-arrow-up"
                class="w-4 h-4 text-white"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
