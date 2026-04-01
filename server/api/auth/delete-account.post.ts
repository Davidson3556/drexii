export default defineEventHandler(async (event) => {
  // Accept user ID from header or body
  let userId = getHeader(event, 'x-user-id')

  if (!userId) {
    const body = await readBody(event).catch(() => null)
    userId = body?.userId
  }

  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required. Please try again while logged in.' })
  }

  try {
    const config = useRuntimeConfig()
    const ossHost = config.public.insforgeUrl as string

    // Read the admin API key from .insforge/project.json (set at build time via runtimeConfig)
    // Fallback: read from env or project config
    const apiKey = (config as Record<string, unknown>).insforgeApiKey as string
      || process.env.INSFORGE_API_KEY
      || ''

    if (!apiKey) {
      throw new Error('InsForge admin API key is not configured. Cannot delete user from auth system.')
    }

    // Call the InsForge admin API to fully delete the user from the auth system
    await $fetch(`${ossHost}/api/auth/users`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: { userIds: [userId] }
    })

    return { success: true, message: 'Account has been permanently deleted.' }
  } catch (error: unknown) {
    console.error('[API] Delete account error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to delete account: ${(error as Error).message}`
    })
  }
})
