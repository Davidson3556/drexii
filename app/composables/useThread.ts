import type { Thread, Message } from '~/shared/types'

export interface PendingAction {
  actionId: string
  tool: string
  params: Record<string, unknown>
}

export interface AgentStep {
  tool: string
  status: 'executing' | 'done' | 'error'
}

interface ThreadState {
  currentThread: Thread | null
  threads: Thread[]
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  error: string | null
  pendingActions: PendingAction[]
  agentSteps: AgentStep[]
  lastMessageContent: string | null
}

export function useThread() {
  const state = useState<ThreadState>('thread', () => ({
    currentThread: null,
    threads: [],
    messages: [],
    isStreaming: false,
    streamingContent: '',
    error: null,
    pendingActions: [],
    agentSteps: [],
    lastMessageContent: null
  }))

  const currentThread = computed(() => state.value.currentThread)
  const messages = computed(() => state.value.messages)
  const isStreaming = computed(() => state.value.isStreaming)
  const streamingContent = computed(() => state.value.streamingContent)
  const error = computed(() => state.value.error)
  const threads = computed(() => state.value.threads)
  const pendingActions = computed(() => state.value.pendingActions)
  const agentSteps = computed(() => state.value.agentSteps)
  const lastMessageContent = computed(() => state.value.lastMessageContent)

  async function createThread(title?: string): Promise<Thread> {
    const { thread } = await $fetch<{ thread: Thread }>('/api/threads', {
      method: 'POST',
      body: { title }
    })
    state.value.threads.unshift(thread)
    state.value.currentThread = thread
    state.value.messages = []
    state.value.error = null
    if (import.meta.client) {
      localStorage.setItem('drexii_thread_id', thread.id)
    }
    return thread
  }

  async function loadThread(id: string) {
    try {
      const data = await $fetch<{ thread: Thread, messages: Message[] }>(`/api/threads/${id}`)
      state.value.currentThread = data.thread
      state.value.messages = data.messages
      state.value.error = null
    } catch (err) {
      state.value.error = 'Failed to load thread'
      console.error('[useThread] Load error:', err)
    }
  }

  async function send(content: string) {
    if (!state.value.currentThread || state.value.isStreaming) return
    state.value.lastMessageContent = content

    // Resolve current user ID for per-user integrations
    const { user } = useAuth()
    const userId = user.value?.id

    const userMessage: Message = {
      id: crypto.randomUUID(),
      threadId: state.value.currentThread.id,
      role: 'user',
      content,
      modelUsed: null,
      toolCalls: null,
      createdAt: new Date().toISOString()
    }
    state.value.messages.push(userMessage)
    state.value.isStreaming = true
    state.value.streamingContent = ''
    state.value.agentSteps = []
    state.value.error = null

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (userId) headers['x-user-id'] = userId

      const response = await fetch(`/api/threads/${state.value.currentThread.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''
      let modelUsed: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
              const data = JSON.parse(dataStr)

              switch (eventType) {
                case 'text': {
                  // Strip raw [TOOL_CALL:...] syntax from displayed content
                  const clean = data.text.replace(/\[TOOL_CALL:[^\]]*\]/g, '')
                  state.value.streamingContent += clean
                  break
                }
                case 'model_info':
                  modelUsed = data.provider
                  break
                case 'action':
                  if (data.status === 'pending_confirmation') {
                    state.value.pendingActions.push({
                      actionId: data.actionId,
                      tool: data.tool,
                      params: data.params
                    })
                  } else if (data.status === 'executing') {
                    state.value.agentSteps.push({ tool: data.tool, status: 'executing' })
                  }
                  break
                case 'source': {
                  const step = state.value.agentSteps.slice().reverse().find(s => s.tool === data.tool && s.status === 'executing')
                  if (step) step.status = 'done'
                  break
                }
                case 'done':
                  modelUsed = data.modelUsed
                  break
                case 'error':
                  state.value.error = data.message
                  break
              }
            } catch {
              // Skip malformed data
            }
          }
        }
      }

      if (state.value.streamingContent) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          threadId: state.value.currentThread!.id,
          role: 'assistant',
          content: state.value.streamingContent,
          modelUsed: modelUsed as 'anthropic' | 'gemini' | null,
          toolCalls: null,
          createdAt: new Date().toISOString()
        }
        state.value.messages.push(assistantMessage)
      }
    } catch (err) {
      state.value.error = (err as Error).message || 'Failed to send message'
      console.error('[useThread] Send error:', err)
    } finally {
      state.value.isStreaming = false
      state.value.streamingContent = ''
      state.value.agentSteps = []
    }
  }

  async function confirmAction(actionId: string) {
    const action = state.value.pendingActions.find(a => a.actionId === actionId)
    // Remove immediately to prevent double-clicks
    state.value.pendingActions = state.value.pendingActions.filter(a => a.actionId !== actionId)
    try {
      const result = await $fetch<{ success: boolean, result: string }>(`/api/actions/${actionId}/confirm`, {
        method: 'POST'
      })
      if (state.value.currentThread) {
        let parsed: unknown = null
        try {
          parsed = JSON.parse(result.result)
        } catch {
          parsed = null
        }
        const summary = parsed
          ? `**Action completed:** ${action?.tool ?? 'Tool'}\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``
          : `**Action completed:** ${result.result}`
        state.value.messages.push({
          id: crypto.randomUUID(),
          threadId: state.value.currentThread.id,
          role: 'assistant',
          content: summary,
          modelUsed: null,
          toolCalls: null,
          createdAt: new Date().toISOString()
        })
      }
      return result
    } catch (err) {
      state.value.error = (err as Error).message || 'Failed to confirm action'
      // Restore pending action on failure
      if (action) state.value.pendingActions.push(action)
      throw err
    }
  }

  async function cancelAction(actionId: string) {
    const action = state.value.pendingActions.find(a => a.actionId === actionId)
    state.value.pendingActions = state.value.pendingActions.filter(a => a.actionId !== actionId)
    try {
      await $fetch(`/api/actions/${actionId}/cancel`, { method: 'POST' })
      if (state.value.currentThread && action) {
        state.value.messages.push({
          id: crypto.randomUUID(),
          threadId: state.value.currentThread.id,
          role: 'assistant',
          content: `**Action cancelled:** ${action.tool}`,
          modelUsed: null,
          toolCalls: null,
          createdAt: new Date().toISOString()
        })
      }
    } catch (err) {
      state.value.error = (err as Error).message || 'Failed to cancel action'
      if (action) state.value.pendingActions.push(action)
      throw err
    }
  }

  return {
    currentThread,
    threads,
    messages,
    isStreaming,
    streamingContent,
    agentSteps,
    error,
    pendingActions,
    lastMessageContent,
    createThread,
    loadThread,
    send,
    confirmAction,
    cancelAction
  }
}
