<script setup lang="ts">
import type { Message } from '~/shared/types'

const { currentThread, messages, isStreaming, streamingContent, agentSteps, error, pendingActions, lastMessageContent, createThread, loadThread, send, confirmAction, cancelAction } = useThread()
const { isFallback, startPolling, stopPolling } = useModelStatus()
const { renderMarkdown } = useMarkdown()
const { user } = useAuth()

const userInitial = computed(() => (user.value?.name ?? user.value?.email ?? '?').charAt(0).toUpperCase())
const { uploadFile } = useStorage()
const { subscribeToThread, onNewMessage, offNewMessage, publishTyping, typingUsers, cleanup: cleanupRealtime } = useRealtime()
const route = useRoute()

const inputValue = ref('')
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const fileInput = ref<HTMLInputElement>()
const isUploading = ref(false)
const uploadedFile = ref<{ url: string, name: string } | null>(null)

const categories = ['Research', 'Support Ops', 'Writing', 'Actions']
const activeCategory = ref('Research')

const suggestions = [
  { text: 'Summarize our product in simple terms for new users', icon: 'i-lucide-sparkles' },
  { text: 'Draft a friendly support reply using our help docs', icon: 'i-lucide-message-square' },
  { text: 'Pull the latest metrics from our analytics dashboard', icon: 'i-lucide-bar-chart-3' },
  { text: 'Create a follow-up email for the last sales meeting', icon: 'i-lucide-mail' }
]

// Real-time message handler
function handleRealtimeMessage(payload: Record<string, unknown>) {
  const msg = payload as unknown as Message
  if (msg.id && !messages.value.some(m => m.id === msg.id)) {
    messages.value.push(msg)
  }
}

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

  if (currentThread.value) {
    await subscribeToThread(currentThread.value.id)
    onNewMessage(handleRealtimeMessage)
  }

  if (autorun) {
    await send(decodeURIComponent(autorun))
  }
})

onUnmounted(() => {
  stopPolling()
  if (countdownTimer) clearInterval(countdownTimer)
  offNewMessage(handleRealtimeMessage)
  cleanupRealtime()
})

watch(() => currentThread.value?.id, async (newId) => {
  if (newId) {
    await subscribeToThread(newId)
  }
})

watch([messages, streamingContent], () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// Auto-resize textarea
function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

watch(inputValue, () => nextTick(autoResize))

async function handleSend() {
  let content = inputValue.value.trim()
  if (!content && !uploadedFile.value) return
  if (isStreaming.value) return

  if (uploadedFile.value) {
    const fileRef = `[📎 ${uploadedFile.value.name}](${uploadedFile.value.url})`
    content = content ? `${fileRef}\n\n${content}` : fileRef
    uploadedFile.value = null
  }

  inputValue.value = ''
  nextTick(autoResize)

  if (user.value) {
    publishTyping(user.value.name || user.value.email, false)
  }

  await send(content)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSuggestion(text: string) {
  inputValue.value = text
  handleSend()
}

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const result = await uploadFile(file)
    uploadedFile.value = { url: result.url, name: result.name }
  } catch (err) {
    console.error('[chat] Upload error:', err)
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeUploadedFile() {
  uploadedFile.value = null
}

let typingTimer: ReturnType<typeof setTimeout> | null = null
function handleInputChange() {
  if (user.value) {
    publishTyping(user.value.name || user.value.email, true)
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      if (user.value) {
        publishTyping(user.value.name || user.value.email, false)
      }
    }, 2000)
  }
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
    class="chat-root flex flex-col"
    style="background: var(--color-drexii-bg);"
  >
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/*,.pdf,.txt,.csv,.json,.md,.doc,.docx,.xls,.xlsx"
      @change="handleFileSelected"
    >

    <!-- ======== MAIN CHAT AREA ======== -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Empty State (Welcome Screen) -->
      <div
        v-if="!hasMessages"
        class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden"
      >
        <!-- Ambient glow -->
        <div class="welcome-glow" />

        <div class="w-full max-w-2xl mx-auto text-center relative z-10">
          <!-- Logo mark -->
          <div class="flex items-center justify-center mb-6">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <UIcon
                name="i-lucide-sparkles"
                class="w-5 h-5 text-amber-400"
              />
            </div>
          </div>

          <h1 class="text-2xl sm:text-3xl font-semibold text-white mb-2 tracking-tight">
            Welcome back
          </h1>
          <p class="text-white/40 text-sm mb-8 sm:mb-10">
            How can I help you today?
          </p>

          <!-- Input -->
          <div class="glass-card p-1 mb-5">
            <div class="glass-input px-4 pt-4 pb-3">
              <!-- Uploaded file preview -->
              <div
                v-if="uploadedFile"
                class="flex items-center gap-2 mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <UIcon
                  name="i-lucide-file"
                  class="w-4 h-4 text-amber-400 shrink-0"
                />
                <span class="text-xs text-amber-300 truncate flex-1">{{ uploadedFile.name }}</span>
                <button
                  class="text-white/30 hover:text-white/60 transition-colors"
                  @click="removeUploadedFile"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="w-3.5 h-3.5"
                  />
                </button>
              </div>

              <textarea
                ref="textareaRef"
                v-model="inputValue"
                rows="1"
                placeholder="Ask anything. Shift+Enter for new line."
                class="chat-textarea w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 resize-none"
                @keydown="handleKeydown"
                @input="handleInputChange"
              />
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-3">
                  <button
                    :disabled="isUploading"
                    class="text-white/25 hover:text-amber-400 transition-colors disabled:opacity-50"
                    @click="triggerFileUpload"
                  >
                    <UIcon
                      v-if="isUploading"
                      name="i-lucide-loader-2"
                      class="w-4 h-4 text-amber-400 animate-spin"
                    />
                    <UIcon
                      v-else
                      name="i-lucide-paperclip"
                      class="w-4 h-4"
                    />
                  </button>
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
                    class="w-7 h-7 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    :disabled="(!inputValue.trim() && !uploadedFile) || isStreaming"
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
          <div class="flex items-center justify-center gap-2 mb-5 flex-wrap">
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
              <span class="flex-1 text-sm">{{ suggestion.text }}</span>
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
        class="flex-1 overflow-y-auto"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div
            v-for="message in messages"
            :key="message.id"
            class="msg-row"
            :class="message.role === 'user' ? 'flex justify-end items-end gap-2' : 'flex justify-start items-start gap-2.5'"
          >
            <!-- Assistant avatar -->
            <div
              v-if="message.role === 'assistant'"
              class="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"
            >
              <UIcon
                name="i-lucide-sparkles"
                class="w-3.5 h-3.5 text-amber-400"
              />
            </div>

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

            <!-- User avatar -->
            <div
              v-if="message.role === 'user'"
              class="w-7 h-7 rounded-full shrink-0 overflow-hidden border border-white/10 flex items-center justify-center bg-white/8"
            >
              <img
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                :alt="user?.name ?? 'You'"
                class="w-full h-full object-cover"
              >
              <span
                v-else
                class="text-xs font-semibold text-white/60"
              >{{ userInitial }}</span>
            </div>
          </div>

          <!-- Pending Action Confirmations -->
          <div
            v-for="action in pendingActions"
            :key="action.actionId"
            class="msg-row flex justify-start items-start gap-2.5"
          >
            <div class="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <UIcon
                name="i-lucide-shield-alert"
                class="w-3.5 h-3.5 text-amber-400"
              />
            </div>
            <div class="message-bubble-assistant border border-amber-500/30 bg-amber-500/5">
              <div class="flex flex-col gap-2">
                <p class="text-sm font-medium text-amber-300">
                  Action requires confirmation
                </p>
                <p class="text-xs text-white/50">
                  Tool: <span class="text-white/70 font-mono">{{ action.tool }}</span>
                </p>
                <pre class="text-xs text-white/40 font-mono bg-white/5 rounded-lg p-2.5 overflow-x-auto">{{ JSON.stringify(action.params, null, 2) }}</pre>
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

          <!-- Streaming Message -->
          <div
            v-if="isStreaming"
            class="msg-row flex justify-start items-start gap-2.5"
          >
            <div class="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
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

              <div
                v-if="streamingContent"
                class="text-sm leading-relaxed prose-chat"
                v-html="renderMarkdown(streamingContent)"
              />
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

          <!-- Typing indicator from other users -->
          <div
            v-if="typingUsers.length > 0 && !isStreaming"
            class="flex justify-start pl-9"
          >
            <div class="text-xs text-white/30 flex items-center gap-2">
              <span class="flex gap-0.5">
                <span class="typing-dot-sm" />
                <span class="typing-dot-sm" />
                <span class="typing-dot-sm" />
              </span>
              {{ typingUsers.join(', ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing…
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="flex justify-center"
          >
            <div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col items-center gap-2 max-w-sm w-full text-center">
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
        class="chat-input-bar px-4 sm:px-6 pb-4 pt-2"
      >
        <div class="max-w-3xl mx-auto">
          <div class="glass-card p-1">
            <div class="glass-input px-4 pt-3.5 pb-3">
              <!-- Uploaded file preview -->
              <div
                v-if="uploadedFile"
                class="flex items-center gap-2 mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <UIcon
                  name="i-lucide-file"
                  class="w-4 h-4 text-amber-400 shrink-0"
                />
                <span class="text-xs text-amber-300 truncate flex-1">{{ uploadedFile.name }}</span>
                <button
                  class="text-white/30 hover:text-white/60 transition-colors"
                  @click="removeUploadedFile"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="w-3.5 h-3.5"
                  />
                </button>
              </div>

              <div class="flex items-end gap-3">
                <button
                  :disabled="isUploading"
                  class="text-white/25 hover:text-amber-400 transition-colors disabled:opacity-50 mb-0.5"
                  @click="triggerFileUpload"
                >
                  <UIcon
                    v-if="isUploading"
                    name="i-lucide-loader-2"
                    class="w-4 h-4 text-amber-400 animate-spin"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-paperclip"
                    class="w-4 h-4"
                  />
                </button>

                <textarea
                  ref="textareaRef"
                  v-model="inputValue"
                  rows="1"
                  placeholder="Type your message… Shift+Enter for new line"
                  class="chat-textarea flex-1 bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 resize-none"
                  :disabled="isStreaming"
                  @keydown="handleKeydown"
                  @input="handleInputChange"
                />

                <button
                  class="w-8 h-8 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0 mb-0.5"
                  :disabled="(!inputValue.trim() && !uploadedFile) || isStreaming"
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
          <p class="text-center text-white/15 text-xs mt-2">
            Drexii can make mistakes. Confirm important actions before executing.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full-height that accounts for mobile browser chrome */
.chat-root {
  height: 100dvh;
  padding-top: 64px; /* offset for fixed AppNav */
}

/* Textarea resets */
.chat-textarea {
  line-height: 1.5;
  max-height: 160px;
  overflow-y: auto;
  scrollbar-width: none;
}
.chat-textarea::-webkit-scrollbar {
  display: none;
}

/* Safe area padding for notch phones */
.chat-input-bar {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

/* Ambient glow behind welcome screen */
.welcome-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse at center, rgba(232, 194, 116, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

/* Message entrance animation */
.msg-row {
  animation: msg-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing dots */
.typing-dot-sm {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing-dot-sm:nth-child(2) { animation-delay: 0.15s; }
.typing-dot-sm:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing-bounce {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

/* Light mode */
:global(html:not(.dark)) .typing-dot-sm { background: rgba(0,0,0,0.3); }
</style>
