<script setup lang="ts">
const { currentThread, messages, isStreaming, streamingContent, error, createThread, send } = useThread()
const { provider, isFallback, startPolling, stopPolling } = useModelStatus()

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
  if (!currentThread.value) {
    await createThread()
  }
})

onUnmounted(() => {
  stopPolling()
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
</script>

<template>
  <div class="h-screen flex flex-col" style="background: var(--color-drexii-bg);">
    <!-- ======== HEADER ======== -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
            <UIcon name="i-lucide-diamond" class="w-4 h-4 text-white/60" />
          </div>
          <span class="text-white font-semibold tracking-tight">Drexii</span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <!-- Model Status Indicator -->
        <div
          v-if="isFallback"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
          :title="'Claude is temporarily unavailable. Gemini is handling your requests.'"
        >
          <span class="status-dot status-dot-fallback" />
          <span class="text-amber-400 text-xs font-medium">Backup AI active</span>
        </div>
        <div
          v-else
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5"
        >
          <span class="status-dot status-dot-healthy" />
          <span class="text-white/40 text-xs">AI Online</span>
        </div>

        <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/8 transition-colors">
          <UIcon name="i-lucide-settings" class="w-4 h-4 text-white/40" />
        </button>
      </div>
    </header>

    <!-- ======== MAIN CHAT AREA ======== -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Empty State (Welcome Screen) -->
      <div
        v-if="!hasMessages"
        class="flex-1 flex flex-col items-center justify-center px-6"
      >
        <div class="w-full max-w-2xl mx-auto text-center">
          <h1 class="text-2xl font-semibold text-white mb-2">Welcome back</h1>
          <p class="text-white/40 text-sm mb-10">How can I help you today?</p>

          <!-- Input -->
          <div class="glass-card p-1 mb-6">
            <div class="glass-input p-4">
              <input
                v-model="inputValue"
                type="text"
                placeholder="Ask anything. Type @ for mentions and / for shortcuts."
                class="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
                @keyup.enter="handleSend"
              />
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
                  <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
                </div>
                <div class="flex items-center gap-2">
                  <button class="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors">
                    <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-white/40" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-colors disabled:opacity-30"
                    :disabled="!inputValue.trim() || isStreaming"
                    @click="handleSend"
                  >
                    <UIcon name="i-lucide-arrow-up" class="w-3.5 h-3.5 text-white" />
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
              <UIcon :name="suggestion.icon" class="w-4 h-4 text-white/20 shrink-0" />
              <span class="flex-1">{{ suggestion.text }}</span>
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
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
              <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ message.content }}</p>
              <div v-if="message.modelUsed && isFallback" class="mt-2 flex items-center gap-1.5">
                <span class="text-xs text-white/20">via {{ message.modelUsed === 'gemini' ? 'Gemini' : 'Claude' }}</span>
              </div>
            </div>
          </div>

          <!-- Streaming Message -->
          <div v-if="isStreaming && streamingContent" class="flex justify-start">
            <div class="message-bubble-assistant streaming-cursor">
              <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ streamingContent }}</p>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isStreaming && !streamingContent" class="flex justify-start">
            <div class="message-bubble-assistant">
              <div class="flex items-center gap-1.5 py-1">
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="flex justify-center">
            <div class="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {{ error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Input (when messages exist) -->
      <div v-if="hasMessages" class="px-6 pb-6 pt-2">
        <div class="max-w-3xl mx-auto">
          <div class="glass-input p-4 flex items-center gap-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
            </div>
            <input
              v-model="inputValue"
              type="text"
              placeholder="Type your message..."
              class="flex-1 bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
              :disabled="isStreaming"
              @keyup.enter="handleSend"
            />
            <button
              class="w-8 h-8 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition-colors disabled:opacity-30 shrink-0"
              :disabled="!inputValue.trim() || isStreaming"
              @click="handleSend"
            >
              <UIcon name="i-lucide-arrow-up" class="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
