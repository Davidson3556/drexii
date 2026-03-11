import { defineEventHandler } from 'h3'
import { getProviderStatus, runHealthCheck } from '../../lib/models/model-router'

export default defineEventHandler(async () => {
  const status = getProviderStatus()

  const lastCheck = new Date(status.lastChecked).getTime()
  const staleThreshold = 60_000
  if (Date.now() - lastCheck > staleThreshold) {
    const health = await runHealthCheck()
    return {
      ...getProviderStatus(),
      health
    }
  }

  return status
})
