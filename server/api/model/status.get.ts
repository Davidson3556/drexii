import { getProviderStatus, runHealthCheck } from '../../lib/models/model-router'

export default defineEventHandler(async () => {
  const lastCheck = new Date(getProviderStatus().lastChecked).getTime()
  const staleThreshold = 60_000

  let status = getProviderStatus()
  let health: Record<string, boolean> | undefined

  if (Date.now() - lastCheck > staleThreshold) {
    health = await runHealthCheck()
    status = getProviderStatus()
  }

  return {
    models: [
      {
        provider: status.provider,
        state: status.state,
        isHealthy: status.isHealthy,
        isFallback: status.isFallback,
        lastChecked: status.lastChecked
      }
    ],
    ...(health ? { health } : {})
  }
})
