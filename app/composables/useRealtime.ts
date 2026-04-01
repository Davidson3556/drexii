interface RealtimeState {
  isConnected: boolean
  typingUsers: string[]
}

export function useRealtime() {
  const { $insforge: _insforge } = useNuxtApp()
  const $insforge = _insforge as import('@insforge/sdk').InsForgeClient
  const state = useState<RealtimeState>('realtime', () => ({
    isConnected: false,
    typingUsers: []
  }))

  const isConnected = computed(() => state.value.isConnected)
  const typingUsers = computed(() => state.value.typingUsers)

  let currentChannel: string | null = null
  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  async function connect() {
    if (state.value.isConnected) return

    try {
      await $insforge.realtime.connect()
      state.value.isConnected = true

      $insforge.realtime.on('disconnect', () => {
        state.value.isConnected = false
      })

      $insforge.realtime.on('connect', () => {
        state.value.isConnected = true
      })
    } catch (err) {
      console.error('[useRealtime] Connect error:', err)
      state.value.isConnected = false
    }
  }

  async function subscribeToThread(threadId: string) {
    // Unsubscribe from previous channel
    if (currentChannel) {
      $insforge.realtime.unsubscribe(currentChannel)
    }

    const channel = `thread:${threadId}`
    currentChannel = channel

    // Ensure connected first
    await connect()

    const result = await $insforge.realtime.subscribe(channel)
    if (!result.ok) {
      const err = 'error' in result ? result.error : null
      console.error('[useRealtime] Subscribe error:', err?.message)
      return false
    }

    // Listen for typing indicators
    $insforge.realtime.on('typing', (payload: { user: string, isTyping: boolean }) => {
      if (payload.isTyping) {
        if (!state.value.typingUsers.includes(payload.user)) {
          state.value.typingUsers.push(payload.user)
        }
        // Auto-clear after 3 seconds
        if (typingTimeout) clearTimeout(typingTimeout)
        typingTimeout = setTimeout(() => {
          state.value.typingUsers = state.value.typingUsers.filter(u => u !== payload.user)
        }, 3000)
      } else {
        state.value.typingUsers = state.value.typingUsers.filter(u => u !== payload.user)
      }
    })

    return true
  }

  function onNewMessage(handler: (payload: Record<string, unknown>) => void) {
    $insforge.realtime.on('new_message', handler)
  }

  function offNewMessage(handler: (payload: Record<string, unknown>) => void) {
    $insforge.realtime.off('new_message', handler)
  }

  async function publishTyping(userName: string, isTyping: boolean) {
    if (!currentChannel) return
    try {
      await $insforge.realtime.publish(currentChannel, 'typing', {
        user: userName,
        isTyping
      })
    } catch {
      // Silently fail — typing indicators are non-critical
    }
  }

  function cleanup() {
    if (currentChannel) {
      $insforge.realtime.unsubscribe(currentChannel)
      currentChannel = null
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
    state.value.typingUsers = []
    $insforge.realtime.disconnect()
    state.value.isConnected = false
  }

  return {
    isConnected,
    typingUsers,
    connect,
    subscribeToThread,
    onNewMessage,
    offNewMessage,
    publishTyping,
    cleanup
  }
}
