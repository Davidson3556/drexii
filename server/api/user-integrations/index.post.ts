import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required' })
  }

  const body = await readBody<{
    integration: string
    credentials: Record<string, string>
  }>(event)

  if (!body?.integration || !body?.credentials) {
    throw createError({ statusCode: 400, message: 'Integration name and credentials are required' })
  }

  const validIntegrations = ['slack', 'notion', 'discord', 'zendesk', 'salesforce']
  if (!validIntegrations.includes(body.integration)) {
    throw createError({ statusCode: 400, message: `Invalid integration. Must be one of: ${validIntegrations.join(', ')}` })
  }

  const db = useDB()

  // Check if user already has this integration — update if so
  const [existing] = await db.select()
    .from(schema.userIntegrations)
    .where(and(
      eq(schema.userIntegrations.userId, userId),
      eq(schema.userIntegrations.integration, body.integration)
    ))
    .limit(1)

  if (existing) {
    await db.update(schema.userIntegrations)
      .set({
        credentials: body.credentials,
        isActive: 1,
        updatedAt: new Date()
      })
      .where(eq(schema.userIntegrations.id, existing.id))

    return { id: existing.id, integration: body.integration, status: 'updated' }
  }

  const [row] = await db.insert(schema.userIntegrations)
    .values({
      userId,
      integration: body.integration,
      credentials: body.credentials
    })
    .returning({ id: schema.userIntegrations.id })

  return { id: row?.id, integration: body.integration, status: 'created' }
})
