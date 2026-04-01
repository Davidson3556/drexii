<script setup lang="ts">
const { user } = useAuth()
const toast = useToast()

interface Memory {
  id: string
  category: 'fact' | 'preference' | 'context'
  content: string
  source: string | null
  createdAt: string
  updatedAt: string
}

const memories = ref<Memory[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeTab = ref<'all' | 'fact' | 'preference' | 'context'>('all')

// Add form
const showAddForm = ref(false)
const addForm = reactive({ category: 'fact' as Memory['category'], content: '' })
const isAdding = ref(false)

// Edit state
const editingId = ref<string | null>(null)
const editContent = ref('')
const isSaving = ref(false)

// Delete state
const deletingId = ref<string | null>(null)

function headers() {
  return user.value?.id ? { 'x-user-id': user.value.id } : {}
}

async function fetchMemories() {
  if (!user.value?.id) return
  isLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
    params.limit = '100'
    const data = await $fetch<{ memories: Memory[] }>('/api/memory', {
      headers: headers(),
      query: params
    })
    memories.value = data.memories
  } finally {
    isLoading.value = false
  }
}

const filteredMemories = computed(() => {
  if (activeTab.value === 'all') return memories.value
  return memories.value.filter(m => m.category === activeTab.value)
})

const categoryCounts = computed(() => ({
  all: memories.value.length,
  fact: memories.value.filter(m => m.category === 'fact').length,
  preference: memories.value.filter(m => m.category === 'preference').length,
  context: memories.value.filter(m => m.category === 'context').length
}))

async function addMemory() {
  if (!addForm.content.trim()) return
  isAdding.value = true
  try {
    await $fetch('/api/memory', {
      method: 'POST',
      headers: headers(),
      body: { category: addForm.category, content: addForm.content.trim() }
    })
    addForm.content = ''
    showAddForm.value = false
    toast.add({ title: 'Memory saved', color: 'green' })
    await fetchMemories()
  } catch {
    toast.add({ title: 'Failed to save memory', color: 'red' })
  } finally {
    isAdding.value = false
  }
}

function startEdit(mem: Memory) {
  editingId.value = mem.id
  editContent.value = mem.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

async function saveEdit(id: string) {
  if (!editContent.value.trim()) return
  isSaving.value = true
  try {
    await $fetch(`/api/memory/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: { content: editContent.value.trim() }
    })
    editingId.value = null
    toast.add({ title: 'Memory updated', color: 'green' })
    await fetchMemories()
  } catch {
    toast.add({ title: 'Failed to update memory', color: 'red' })
  } finally {
    isSaving.value = false
  }
}

async function deleteMemory(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/memory/${id}`, { method: 'DELETE', headers: headers() })
    memories.value = memories.value.filter(m => m.id !== id)
    toast.add({ title: 'Memory deleted', color: 'green' })
  } catch {
    toast.add({ title: 'Failed to delete memory', color: 'red' })
  } finally {
    deletingId.value = null
  }
}

let searchTimer: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchMemories, 350)
})

onMounted(fetchMemories)

const categoryIcon: Record<string, string> = {
  fact: 'i-lucide-lightbulb',
  preference: 'i-lucide-heart',
  context: 'i-lucide-layers'
}

const categoryColor: Record<string, string> = {
  fact: 'tag--blue',
  preference: 'tag--purple',
  context: 'tag--amber'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="memory-page">
    <div class="memory-container">
      <!-- Header -->
      <div class="memory-header">
        <div class="memory-header-left">
          <div class="memory-icon-wrap">
            <UIcon
              name="i-lucide-brain"
              class="w-5 h-5"
            />
          </div>
          <div>
            <h1 class="memory-title">
              Memory
            </h1>
            <p class="memory-subtitle">
              What Drexii remembers about you
            </p>
          </div>
        </div>
        <button
          class="add-btn"
          @click="showAddForm = !showAddForm"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4"
          />
          Add Memory
        </button>
      </div>

      <!-- Add form -->
      <Transition name="slide-down">
        <div
          v-if="showAddForm"
          class="add-form"
        >
          <div class="add-form-row">
            <select
              v-model="addForm.category"
              class="category-select"
            >
              <option value="fact">
                Fact
              </option>
              <option value="preference">
                Preference
              </option>
              <option value="context">
                Context
              </option>
            </select>
            <input
              v-model="addForm.content"
              class="add-input"
              placeholder="e.g. I prefer bullet points over paragraphs"
              @keydown.enter="addMemory"
            >
            <button
              class="save-btn"
              :disabled="isAdding || !addForm.content.trim()"
              @click="addMemory"
            >
              <UIcon
                v-if="isAdding"
                name="i-lucide-loader-circle"
                class="w-4 h-4 animate-spin"
              />
              <span v-else>Save</span>
            </button>
            <button
              class="cancel-btn"
              @click="showAddForm = false"
            >
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Search -->
      <div class="search-row">
        <div class="search-wrap">
          <UIcon
            name="i-lucide-search"
            class="search-icon"
          />
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Search memories..."
          >
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in (['all', 'fact', 'preference', 'context'] as const)"
          :key="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          <span class="tab-count">{{ categoryCounts[tab] }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="loading-state"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="w-5 h-5 animate-spin opacity-40"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredMemories.length === 0"
        class="empty-state"
      >
        <UIcon
          name="i-lucide-brain"
          class="w-10 h-10 opacity-20"
        />
        <p class="empty-text">
          {{ searchQuery ? 'No memories match your search' : 'No memories yet. Start chatting and Drexii will learn your preferences.' }}
        </p>
      </div>

      <!-- Memory list -->
      <div
        v-else
        class="memory-list"
      >
        <div
          v-for="mem in filteredMemories"
          :key="mem.id"
          class="memory-card"
        >
          <div class="memory-card-top">
            <div class="memory-card-left">
              <span :class="['category-tag', categoryColor[mem.category]]">
                <UIcon
                  :name="categoryIcon[mem.category]"
                  class="w-3 h-3"
                />
                {{ mem.category }}
              </span>
              <span class="memory-date">{{ formatDate(mem.createdAt) }}</span>
            </div>
            <div class="memory-actions">
              <button
                v-if="editingId !== mem.id"
                class="mem-btn"
                title="Edit"
                @click="startEdit(mem)"
              >
                <UIcon
                  name="i-lucide-pencil"
                  class="w-3.5 h-3.5"
                />
              </button>
              <button
                class="mem-btn mem-btn--danger"
                title="Delete"
                :disabled="deletingId === mem.id"
                @click="deleteMemory(mem.id)"
              >
                <UIcon
                  v-if="deletingId === mem.id"
                  name="i-lucide-loader-circle"
                  class="w-3.5 h-3.5 animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-trash-2"
                  class="w-3.5 h-3.5"
                />
              </button>
            </div>
          </div>

          <!-- View mode -->
          <p
            v-if="editingId !== mem.id"
            class="memory-content"
          >
            {{ mem.content }}
          </p>

          <!-- Edit mode -->
          <div
            v-else
            class="edit-row"
          >
            <textarea
              v-model="editContent"
              class="edit-textarea"
              rows="2"
              @keydown.escape="cancelEdit"
            />
            <div class="edit-btns">
              <button
                class="save-btn save-btn--sm"
                :disabled="isSaving"
                @click="saveEdit(mem.id)"
              >
                <UIcon
                  v-if="isSaving"
                  name="i-lucide-loader-circle"
                  class="w-3.5 h-3.5 animate-spin"
                />
                <span v-else>Save</span>
              </button>
              <button
                class="cancel-btn cancel-btn--sm"
                @click="cancelEdit"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer count -->
      <p
        v-if="memories.length > 0"
        class="memory-count"
      >
        {{ memories.length }} memor{{ memories.length === 1 ? 'y' : 'ies' }} stored
      </p>
    </div>
  </div>
</template>

<style scoped>
.memory-page {
  min-height: 100vh;
  padding: 80px 24px 40px;
  background: var(--page-bg, #0a0a0a);
}

.memory-container {
  max-width: 720px;
  margin: 0 auto;
}

/* Header */
.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}

.memory-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.memory-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.memory-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
}

.memory-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.38);
  margin: 2px 0 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  white-space: nowrap;
}
.add-btn:hover {
  background: rgba(255, 255, 255, 0.11);
  color: rgba(255, 255, 255, 0.92);
}

/* Add form */
.add-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
}

.add-form-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.category-select {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.add-input {
  flex: 1;
  min-width: 160px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  outline: none;
}
.add-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
}
.add-input::placeholder { color: rgba(255, 255, 255, 0.25); }

.save-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.18s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.save-btn:hover:not(:disabled) { background: #fff; }
.save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.save-btn--sm { padding: 6px 12px; font-size: 12px; }

.cancel-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: background 0.18s;
  flex-shrink: 0;
}
.cancel-btn:hover { background: rgba(255, 255, 255, 0.09); }
.cancel-btn--sm {
  width: auto;
  padding: 6px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Search */
.search-row { margin-bottom: 16px; }

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.search-input:focus { border-color: rgba(255, 255, 255, 0.2); }
.search-input::placeholder { color: rgba(255, 255, 255, 0.22); }

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.18s;
}
.tab-btn:hover { color: rgba(255, 255, 255, 0.65); background: rgba(255, 255, 255, 0.04); }
.tab-btn--active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.88);
}

.tab-count {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.07);
  min-width: 18px;
  text-align: center;
}

/* States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-text {
  font-size: 14px;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}

/* Memory list */
.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 14px 16px;
  transition: border-color 0.18s;
}
.memory-card:hover { border-color: rgba(255, 255, 255, 0.12); }

.memory-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.memory-card-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tag--blue { background: rgba(59, 130, 246, 0.12); color: rgba(147, 197, 253, 0.9); }
.tag--purple { background: rgba(139, 92, 246, 0.12); color: rgba(196, 181, 253, 0.9); }
.tag--amber { background: rgba(245, 158, 11, 0.12); color: rgba(252, 211, 77, 0.9); }

.memory-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
}

.memory-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.18s;
}
.memory-card:hover .memory-actions { opacity: 1; }

.mem-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.mem-btn:hover { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); }
.mem-btn--danger:hover { background: rgba(239, 68, 68, 0.15); color: rgba(252, 165, 165, 0.9); }
.mem-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.memory-content {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

/* Edit mode */
.edit-row { display: flex; flex-direction: column; gap: 8px; }

.edit-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.edit-btns {
  display: flex;
  gap: 6px;
  align-items: center;
}

.memory-count {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 20px;
}

/* Animation */
.slide-down-enter-active { transition: all 0.22s ease; }
.slide-down-leave-active { transition: all 0.18s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* Light mode */
:global(html:not(.dark)) .memory-page { background: #f7f7f9; }
:global(html:not(.dark)) .memory-title { color: rgba(12, 12, 14, 0.92); }
:global(html:not(.dark)) .memory-subtitle { color: rgba(0, 0, 0, 0.4); }
:global(html:not(.dark)) .memory-icon-wrap { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.5); }
:global(html:not(.dark)) .add-btn { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.65); }
:global(html:not(.dark)) .add-btn:hover { background: rgba(0,0,0,0.08); }
:global(html:not(.dark)) .add-form { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.08); }
:global(html:not(.dark)) .category-select { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.7); }
:global(html:not(.dark)) .add-input { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.88); }
:global(html:not(.dark)) .add-input::placeholder { color: rgba(0,0,0,0.3); }
:global(html:not(.dark)) .save-btn { background: #0f0f11; color: #fff; }
:global(html:not(.dark)) .cancel-btn { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.45); }
:global(html:not(.dark)) .search-input { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.88); }
:global(html:not(.dark)) .search-input::placeholder { color: rgba(0,0,0,0.28); }
:global(html:not(.dark)) .search-icon { color: rgba(0,0,0,0.3); }
:global(html:not(.dark)) .tab-btn { border-color: rgba(0,0,0,0.08); color: rgba(0,0,0,0.45); }
:global(html:not(.dark)) .tab-btn:hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.7); }
:global(html:not(.dark)) .tab-btn--active { background: rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.14); color: rgba(0,0,0,0.88); }
:global(html:not(.dark)) .tab-count { background: rgba(0,0,0,0.06); }
:global(html:not(.dark)) .memory-card { background: #fff; border-color: rgba(0,0,0,0.07); }
:global(html:not(.dark)) .memory-card:hover { border-color: rgba(0,0,0,0.14); }
:global(html:not(.dark)) .memory-content { color: rgba(0,0,0,0.75); }
:global(html:not(.dark)) .memory-date { color: rgba(0,0,0,0.3); }
:global(html:not(.dark)) .mem-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.4); }
:global(html:not(.dark)) .mem-btn:hover { background: rgba(0,0,0,0.08); color: rgba(0,0,0,0.75); }
:global(html:not(.dark)) .edit-textarea { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.2); color: rgba(0,0,0,0.88); }
:global(html:not(.dark)) .memory-count { color: rgba(0,0,0,0.25); }
:global(html:not(.dark)) .empty-state { color: rgba(0,0,0,0.35); }
</style>
