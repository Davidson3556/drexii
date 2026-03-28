<script setup lang="ts">
const { user } = useAuth()
const toast = useToast()

interface Automation {
  id: string
  name: string
  description: string | null
  trigger: string
  triggerConfig: Record<string, unknown>
  instructions: string
  isActive: boolean
  lastRunAt: string | null
  runCount: number
  createdAt: string
}

interface AutomationLog {
  id: string
  trigger: string
  input: Record<string, unknown>
  output: string | null
  status: string
  durationMs: number
  createdAt: string
}

// State
const automations = ref<Automation[]>([])
const isLoading = ref(true)
const showForm = ref(false)
const isCreating = ref(false)
const runningId = ref<string | null>(null)
const viewLogsId = ref<string | null>(null)
const logs = ref<AutomationLog[]>([])
const logsLoading = ref(false)

// Form
const form = reactive({
  name: '',
  description: '',
  trigger: 'email_received' as string,
  instructions: '',
  intervalMinutes: 60,
  parentAutomationId: '' as string,
  chainOn: 'success' as string,
  triggerCondition: '' as string
})
const formError = ref('')

const triggerOptions = [
  { value: 'email_received', label: 'New Email Received', icon: 'i-lucide-mail', description: 'Triggers when a new email arrives in your Gmail inbox' },
  { value: 'schedule', label: 'Scheduled', icon: 'i-lucide-clock', description: 'Runs on a recurring interval (e.g. every hour, every day)' },
  { value: 'webhook', label: 'Webhook', icon: 'i-lucide-webhook', description: 'Triggers when an external service sends a webhook' },
  { value: 'chain', label: 'Chained', icon: 'i-lucide-link', description: 'Runs automatically after another automation completes' }
]

function headers(): Record<string, string> {
  return user.value?.id ? { 'x-user-id': user.value.id } : {}
}

async function fetchAutomations() {
  if (!user.value?.id) return
  isLoading.value = true
  try {
    const data = await $fetch<{ automations: Automation[] }>('/api/automations', { headers: headers() })
    automations.value = data.automations
  } finally {
    isLoading.value = false
  }
}

async function createAutomation() {
  formError.value = ''
  if (!form.name.trim() || !form.instructions.trim()) {
    formError.value = 'Name and instructions are required.'
    return
  }
  isCreating.value = true
  try {
    const triggerConfig: Record<string, unknown> = {}
    if (form.trigger === 'schedule') {
      triggerConfig.intervalMinutes = form.intervalMinutes
    }

    await $fetch('/api/automations', {
      method: 'POST',
      headers: headers(),
      body: {
        name: form.name,
        description: form.description || undefined,
        trigger: form.trigger,
        triggerConfig,
        instructions: form.instructions,
        parentAutomationId: form.trigger === 'chain' && form.parentAutomationId ? form.parentAutomationId : undefined,
        chainOn: form.trigger === 'chain' ? form.chainOn : undefined,
        triggerCondition: form.trigger === 'chain' && form.triggerCondition ? form.triggerCondition : undefined
      }
    })
    form.name = ''
    form.description = ''
    form.trigger = 'email_received'
    form.instructions = ''
    form.intervalMinutes = 60
    form.parentAutomationId = ''
    form.chainOn = 'success'
    form.triggerCondition = ''
    showForm.value = false
    toast.add({ title: 'Automation created', color: 'success' })
    await fetchAutomations()
  } catch {
    formError.value = 'Failed to create automation. Try again.'
  } finally {
    isCreating.value = false
  }
}

async function toggleAutomation(id: string) {
  try {
    const data = await $fetch<{ automation: Automation }>(`/api/automations/${id}/toggle`, {
      method: 'POST',
      headers: headers()
    })
    const idx = automations.value.findIndex(a => a.id === id)
    if (idx !== -1) automations.value[idx] = data.automation
  } catch {
    toast.add({ title: 'Failed to toggle automation', color: 'error' })
  }
}

async function deleteAutomation(id: string) {
  try {
    await $fetch(`/api/automations/${id}`, { method: 'DELETE', headers: headers() })
    automations.value = automations.value.filter(a => a.id !== id)
    toast.add({ title: 'Automation deleted', color: 'neutral' })
  } catch {
    toast.add({ title: 'Failed to delete automation', color: 'error' })
  }
}

async function runAutomation(id: string) {
  runningId.value = id
  try {
    await $fetch('/api/automations/process', {
      method: 'POST',
      body: { automationId: id, context: `Manual test run at ${new Date().toISOString()}` }
    })
    toast.add({ title: 'Automation executed', color: 'success' })
    await fetchAutomations()
  } catch {
    toast.add({ title: 'Automation run failed', color: 'error' })
  } finally {
    runningId.value = null
  }
}

async function viewLogs(id: string) {
  if (viewLogsId.value === id) {
    viewLogsId.value = null
    return
  }
  viewLogsId.value = id
  logsLoading.value = true
  try {
    const data = await $fetch<{ logs: AutomationLog[] }>(`/api/automations/${id}/logs`)
    logs.value = data.logs
  } catch {
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getTriggerInfo(trigger: string) {
  return triggerOptions.find(t => t.value === trigger) ?? triggerOptions[0]!
}

onMounted(fetchAutomations)
</script>

<template>
  <div
    class="min-h-screen pt-20 pb-16 px-6"
    style="background: var(--color-drexii-bg);"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-xl font-semibold text-white/90">
            Automations
          </h1>
          <p class="text-sm text-white/35 mt-1">
            Set rules in plain English. Drexii runs them automatically.
          </p>
        </div>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          @click="showForm = !showForm"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4"
          />
          New Automation
        </button>
      </div>

      <!-- Create Form -->
      <Transition name="form-slide">
        <div
          v-if="showForm"
          class="glass-card p-5 mb-6 space-y-4"
        >
          <h2 class="text-sm font-medium text-white/70">
            New Automation
          </h2>

          <div class="space-y-3">
            <!-- Name -->
            <div>
              <label class="block text-xs text-white/40 mb-1">Name *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Auto-reply to support emails"
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
              >
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs text-white/40 mb-1">Description</label>
              <input
                v-model="form.description"
                type="text"
                placeholder="Optional short description"
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
              >
            </div>

            <!-- Trigger -->
            <div>
              <label class="block text-xs text-white/40 mb-1">Trigger *</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  v-for="opt in triggerOptions"
                  :key="opt.value"
                  class="flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all"
                  :class="form.trigger === opt.value
                    ? 'bg-amber-500/10 border-amber-500/30 text-white/80'
                    : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15'"
                  @click="form.trigger = opt.value"
                >
                  <UIcon
                    :name="opt.icon"
                    class="w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <div class="text-xs font-medium">
                      {{ opt.label }}
                    </div>
                    <div class="text-[10px] text-white/25 mt-0.5 leading-tight">
                      {{ opt.description }}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Schedule interval (only for schedule trigger) -->
            <div v-if="form.trigger === 'schedule'">
              <label class="block text-xs text-white/40 mb-1">Run every (minutes)</label>
              <input
                v-model.number="form.intervalMinutes"
                type="number"
                min="5"
                max="10080"
                placeholder="60"
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
              >
              <p class="text-[10px] text-white/20 mt-1">
                {{ form.intervalMinutes >= 1440 ? `Every ${Math.round(form.intervalMinutes / 1440)} day(s)` : form.intervalMinutes >= 60 ? `Every ${Math.round(form.intervalMinutes / 60)} hour(s)` : `Every ${form.intervalMinutes} minutes` }}
              </p>
            </div>

            <!-- Chain options (only for chain trigger) -->
            <div
              v-if="form.trigger === 'chain'"
              class="space-y-3"
            >
              <div>
                <label class="block text-xs text-white/40 mb-1">Run after automation *</label>
                <select
                  v-model="form.parentAutomationId"
                  class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-amber-500/40 transition-colors"
                >
                  <option value="">Select an automation…</option>
                  <option
                    v-for="a in automations"
                    :key="a.id"
                    :value="a.id"
                  >
                    {{ a.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Run when</label>
                <select
                  v-model="form.chainOn"
                  class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-amber-500/40 transition-colors"
                >
                  <option value="success">Parent succeeds</option>
                  <option value="failure">Parent fails</option>
                  <option value="always">Always</option>
                  <option value="custom">Custom condition</option>
                </select>
              </div>
              <div v-if="form.chainOn === 'custom'">
                <label class="block text-xs text-white/40 mb-1">Condition (plain English)</label>
                <input
                  v-model="form.triggerCondition"
                  type="text"
                  placeholder="e.g. output contains 'urgent'"
                  class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
                >
              </div>
            </div>

            <!-- Instructions -->
            <div>
              <label class="block text-xs text-white/40 mb-1">Instructions (plain English) *</label>
              <textarea
                v-model="form.instructions"
                rows="5"
                placeholder="Describe what Drexii should do in plain English. For example:

When I get a new email asking about pricing, check our Notion pricing page and reply with a friendly summary of our plans. If the email looks urgent, also ping me on Slack in #alerts."
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors resize-none"
              />
            </div>

            <p
              v-if="formError"
              class="text-xs text-red-400"
            >
              {{ formError }}
            </p>

            <div class="flex gap-2 justify-end">
              <button
                class="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-white/50 text-sm transition-colors"
                @click="showForm = false; formError = ''"
              >
                Cancel
              </button>
              <button
                class="px-4 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
                :disabled="isCreating"
                @click="createAutomation"
              >
                {{ isCreating ? 'Creating...' : 'Create Automation' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-20"
      >
        <div class="w-5 h-5 border-2 border-white/20 border-t-amber-500/70 rounded-full animate-spin" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="automations.length === 0"
        class="text-center py-20"
      >
        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <UIcon
            name="i-lucide-bot"
            class="w-6 h-6 text-white/20"
          />
        </div>
        <p class="text-sm text-white/30 mb-2">
          No automations yet.
        </p>
        <p class="text-xs text-white/20 max-w-sm mx-auto">
          Create an automation to let Drexii handle tasks automatically — even while you're offline.
        </p>
      </div>

      <!-- Automation List -->
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="auto in automations"
          :key="auto.id"
          class="glass-card group"
        >
          <div class="p-5">
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border"
                :class="auto.isActive
                  ? 'bg-emerald-500/10 border-emerald-500/15'
                  : 'bg-white/5 border-white/8'"
              >
                <UIcon
                  :name="getTriggerInfo(auto.trigger).icon"
                  class="w-4 h-4"
                  :class="auto.isActive ? 'text-emerald-400/70' : 'text-white/25'"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-medium text-white/85 truncate">
                    {{ auto.name }}
                  </h3>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    :class="auto.isActive
                      ? 'bg-emerald-500/10 text-emerald-400/70'
                      : 'bg-white/5 text-white/25'"
                  >
                    {{ auto.isActive ? 'Active' : 'Paused' }}
                  </span>
                  <span
                    v-if="auto.runCount > 0"
                    class="text-xs text-white/25 shrink-0"
                  >
                    {{ auto.runCount }} run{{ auto.runCount === 1 ? '' : 's' }}
                  </span>
                </div>

                <p
                  v-if="auto.description"
                  class="text-xs text-white/40 mb-2 line-clamp-1"
                >
                  {{ auto.description }}
                </p>

                <!-- Trigger badge -->
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon
                    :name="getTriggerInfo(auto.trigger).icon"
                    class="w-3 h-3 text-white/25"
                  />
                  <span class="text-[11px] text-white/30">{{ getTriggerInfo(auto.trigger).label }}</span>
                  <span
                    v-if="auto.trigger === 'schedule'"
                    class="text-[11px] text-white/20"
                  >
                    (every {{ (auto.triggerConfig as Record<string, unknown>).intervalMinutes || 60 }}min)
                  </span>
                </div>

                <!-- Instructions preview -->
                <p class="text-xs text-white/25 font-mono line-clamp-2 bg-white/3 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  {{ auto.instructions }}
                </p>

                <div class="flex items-center gap-3 mt-3">
                  <span class="text-xs text-white/20">Last run: {{ formatDate(auto.lastRunAt) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  :class="auto.isActive
                    ? 'bg-white/5 hover:bg-white/10 text-white/40'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400/70'"
                  @click="toggleAutomation(auto.id)"
                >
                  <UIcon
                    :name="auto.isActive ? 'i-lucide-pause' : 'i-lucide-play'"
                    class="w-3 h-3"
                  />
                  {{ auto.isActive ? 'Pause' : 'Enable' }}
                </button>

                <button
                  class="px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  :disabled="runningId === auto.id"
                  @click="runAutomation(auto.id)"
                >
                  <UIcon
                    v-if="runningId === auto.id"
                    name="i-lucide-loader-2"
                    class="w-3 h-3 animate-spin"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-zap"
                    class="w-3 h-3"
                  />
                  {{ runningId === auto.id ? 'Running...' : 'Test' }}
                </button>

                <button
                  class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/25 hover:text-white/50 flex items-center justify-center transition-colors"
                  title="View logs"
                  @click="viewLogs(auto.id)"
                >
                  <UIcon
                    name="i-lucide-scroll-text"
                    class="w-3.5 h-3.5"
                  />
                </button>

                <button
                  class="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/25 hover:text-red-400 flex items-center justify-center transition-colors"
                  title="Delete automation"
                  @click="deleteAutomation(auto.id)"
                >
                  <UIcon
                    name="i-lucide-trash-2"
                    class="w-3.5 h-3.5"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Logs panel -->
          <Transition name="logs-slide">
            <div
              v-if="viewLogsId === auto.id"
              class="border-t border-white/5 px-5 py-4"
            >
              <h4 class="text-xs font-medium text-white/40 mb-3">
                Recent Logs
              </h4>

              <div
                v-if="logsLoading"
                class="flex items-center justify-center py-6"
              >
                <div class="w-4 h-4 border-2 border-white/15 border-t-amber-500/60 rounded-full animate-spin" />
              </div>

              <div
                v-else-if="logs.length === 0"
                class="text-xs text-white/20 text-center py-4"
              >
                No logs yet. Run the automation to see results.
              </div>

              <div
                v-else
                class="space-y-2 max-h-64 overflow-y-auto"
              >
                <div
                  v-for="log in logs"
                  :key="log.id"
                  class="flex items-start gap-3 p-2.5 rounded-lg bg-white/2"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    :class="{
                      'bg-emerald-400': log.status === 'success',
                      'bg-red-400': log.status === 'error',
                      'bg-white/20': log.status === 'skipped'
                    }"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-[11px] text-white/30">{{ formatDate(log.createdAt) }}</span>
                      <span class="text-[10px] text-white/15">{{ log.durationMs }}ms</span>
                    </div>
                    <p class="text-xs text-white/50 line-clamp-3">
                      {{ log.output || 'No output' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
}

.form-slide-enter-active,
.form-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.form-slide-enter-from,
.form-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.logs-slide-enter-active,
.logs-slide-leave-active {
  transition: opacity 0.2s ease, max-height 0.3s ease;
}
.logs-slide-enter-from,
.logs-slide-leave-to {
  opacity: 0;
}
</style>
