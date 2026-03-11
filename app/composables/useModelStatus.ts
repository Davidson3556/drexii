import type { ProviderStatus, AIProvider } from '~/shared/types'

export function useModelStatus() {
  const status = useState<ProviderStatus>('modelStatus', () => ({
    provider: 'anthropic' as AIProvider,
    state: 'HEALTHY',
    isHealthy: true,
    isFallback: false,
    lastChecked: new Date().toISOString()
  }))

  const provider = computed(() => status.value.provider)
  const isHealthy = computed(() => status.value.isHealthy)
  const isFallback = computed(() => status.value.isFallback)
  const routerState = computed(() => status.value.state)

  let pollInterval: ReturnType<typeof setInterval> | null = null

  async function fetchStatus() {
    try {
      const data = await $fetch<ProviderStatus>('/api/model/status')
      status.value = data
    }
    catch {
      // Silently fail — don't interrupt user
    }
  }

  function startPolling(intervalMs = 30_000) {
    fetchStatus()
    pollInterval = setInterval(fetchStatus, intervalMs)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    provider,
    isHealthy,
    isFallback,
    routerState,
    status,
    fetchStatus,
    startPolling,
    stopPolling
  }
}
