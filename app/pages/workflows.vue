<script setup lang="ts">
interface Workflow {
  id: string
  name: string
  description: string | null
  prompt: string
  runCount: number
  lastRunAt: string | null
  createdAt: string
}

const { loadThread, send: _send } = useThread()
const router = useRouter()

const workflows = ref<Workflow[]>([])
const isLoading = ref(true)
const isCreating = ref(false)
const runningId = ref<string | null>(null)
const showForm = ref(false)

const form = reactive({ name: '', description: '', prompt: '' })
const formError = ref('')

async function fetchWorkflows() {
  isLoading.value = true
  try {
    const data = await $fetch<{ workflows: Workflow[] }>('/api/workflows')
    workflows.value = data.workflows
  } finally {
    isLoading.value = false
  }
}

async function createWorkflow() {
  formError.value = ''
  if (!form.name.trim() || !form.prompt.trim()) {
    formError.value = 'Name and prompt are required.'
    return
  }
  isCreating.value = true
  try {
    await $fetch('/api/workflows', {
      method: 'POST',
      body: { name: form.name, description: form.description || undefined, prompt: form.prompt }
    })
    form.name = ''
    form.description = ''
    form.prompt = ''
    showForm.value = false
    await fetchWorkflows()
  } catch {
    formError.value = 'Failed to create workflow. Try again.'
  } finally {
    isCreating.value = false
  }
}

async function runWorkflow(workflow: Workflow) {
  runningId.value = workflow.id
  try {
    const data = await $fetch<{ threadId: string, prompt: string }>(`/api/workflows/${workflow.id}/run`, {
      method: 'POST'
    })
    await loadThread(data.threadId)
    await router.push(`/chat?autorun=${encodeURIComponent(data.prompt)}`)
  } catch {
    runningId.value = null
  }
}

async function deleteWorkflow(id: string) {
  await $fetch(`/api/workflows/${id}`, { method: 'DELETE' })
  workflows.value = workflows.value.filter(w => w.id !== id)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchWorkflows)
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
            Workflows
          </h1>
          <p class="text-sm text-white/35 mt-1">
            Chain tools together and run them with one click.
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
          New Workflow
        </button>
      </div>

      <!-- Create Form -->
      <Transition name="form-slide">
        <div
          v-if="showForm"
          class="glass-card p-5 mb-6 space-y-4"
        >
          <h2 class="text-sm font-medium text-white/70">
            New Workflow
          </h2>

          <div class="space-y-3">
            <div>
              <label class="block text-xs text-white/40 mb-1">Name *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Weekly Support Report"
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
              >
            </div>

            <div>
              <label class="block text-xs text-white/40 mb-1">Description</label>
              <input
                v-model="form.description"
                type="text"
                placeholder="Optional short description"
                class="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition-colors"
              >
            </div>

            <div>
              <label class="block text-xs text-white/40 mb-1">Prompt *</label>
              <textarea
                v-model="form.prompt"
                rows="4"
                placeholder="Describe the full workflow in natural language. e.g. Find all open Zendesk tickets from this week, create a Notion page summarizing them titled 'Support Report [today's date]', then post the link to #support on Slack."
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
                @click="createWorkflow"
              >
                {{ isCreating ? 'Creating…' : 'Create Workflow' }}
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
        v-else-if="workflows.length === 0"
        class="text-center py-20"
      >
        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <UIcon
            name="i-lucide-workflow"
            class="w-6 h-6 text-white/20"
          />
        </div>
        <p class="text-sm text-white/30">
          No workflows yet. Create one to chain tools together.
        </p>
      </div>

      <!-- Workflow List -->
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="wf in workflows"
          :key="wf.id"
          class="glass-card p-5 group"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <UIcon
                name="i-lucide-workflow"
                class="w-4 h-4 text-amber-400/70"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-medium text-white/85 truncate">
                  {{ wf.name }}
                </h3>
                <span
                  v-if="wf.runCount > 0"
                  class="text-xs text-white/25 shrink-0"
                >{{ wf.runCount }} run{{ wf.runCount === 1 ? '' : 's' }}</span>
              </div>

              <p
                v-if="wf.description"
                class="text-xs text-white/40 mb-2 line-clamp-1"
              >
                {{ wf.description }}
              </p>

              <p class="text-xs text-white/25 font-mono line-clamp-2 bg-white/3 rounded-lg px-2.5 py-1.5 leading-relaxed">
                {{ wf.prompt }}
              </p>

              <div class="flex items-center gap-3 mt-3">
                <span class="text-xs text-white/20">Last run: {{ formatDate(wf.lastRunAt) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                :disabled="runningId === wf.id"
                @click="runWorkflow(wf)"
              >
                <UIcon
                  v-if="runningId === wf.id"
                  name="i-lucide-loader-2"
                  class="w-3 h-3 animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-play"
                  class="w-3 h-3"
                />
                {{ runningId === wf.id ? 'Starting…' : 'Run' }}
              </button>

              <button
                class="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/25 hover:text-red-400 flex items-center justify-center transition-colors"
                title="Delete workflow"
                @click="deleteWorkflow(wf.id)"
              >
                <UIcon
                  name="i-lucide-trash-2"
                  class="w-3.5 h-3.5"
                />
              </button>
            </div>
          </div>
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
</style>
