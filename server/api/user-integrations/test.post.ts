import { createAdapterFromCredentials } from '../../lib/integrations'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    integration: string
    credentials: Record<string, string>
  }>(event)

  if (!body?.integration || !body?.credentials) {
    throw createError({ statusCode: 400, message: 'Integration name and credentials are required' })
  }

  const adapter = createAdapterFromCredentials({
    integration: body.integration,
    credentials: body.credentials
  })

  if (!adapter) {
    return { success: false, error: 'Invalid credentials format for this integration' }
  }

  try {
    const healthy = await adapter.healthCheck()
    return { success: healthy, error: healthy ? null : 'Connection test failed. Please check your credentials.' }
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message || 'Connection test failed' }
  }
})
